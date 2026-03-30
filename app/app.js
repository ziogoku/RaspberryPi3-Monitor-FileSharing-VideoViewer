const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const mysql = require('mysql2/promise');
const app = express();
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({
    dest: '/tmp/',
    limits: { fileSize: 505 * 1024 * 1024 } // 500MB

}); // Caricamento temporaneo
const { PORT, DB_CONFIG, USB_PATH } = require('./config');


app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors());

const pool = mysql.createPool(DB_CONFIG);

// Inizializzazione Tabella
(async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                done TINYINT(1) DEFAULT 0
            )
        `);
        connection.release();
        console.log("Connesso a MariaDB. Tabella 'tasks' pronta.");
    } catch (err) {
        console.error("Errore inizializzazione DB:", err.message);
    }
})();

// --- ROTTE API ---

// GET: Leggi tutti i task dal database
app.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks');
        res.json({
            message: "Dati recuperati da MariaDB",
            data: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/info', async (req, res) => {
    try {
        // Raccogliamo i dati in parallelo per essere più veloci
        const [cpuTemp, cpuLoad, mem, fsSize] = await Promise.all([
            si.cpuTemperature(),
            si.currentLoad(),
            si.mem(),
            si.fsSize()
        ]);

        res.json({
            timestamp: new Date().toISOString(),
            cpu: {
                temp: `${cpuTemp.main}°C`,
                usage: `${cpuLoad.currentLoad.toFixed(2)}%`,
            },
            ram: {
                total: `${(mem.total / 1024 / 1024).toFixed(0)} MB`,
                used: `${(mem.used / 1024 / 1024).toFixed(0)} MB`,
                free: `${(mem.free / 1024 / 1024).toFixed(0)} MB`,
                usage_percent: `${((mem.used / mem.total) * 100).toFixed(2)}%`
            },
            disk: {
                size: `${(fsSize[0].size / 1024 / 1024 / 1024).toFixed(2)} GB`,
                used: `${(fsSize[0].used / 1024 / 1024 / 1024).toFixed(2)} GB`,
                use_percent: `${fsSize[0].use}%`
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Errore nel recupero info sistema", detail: err.message });
    }
});

const validatePath = (userPath) => {
    // 1. Risolvi il percorso assoluto della USB (la tua root sicura)
    const rootPath = path.resolve(USB_PATH);

    // 2. Risolvi il percorso richiesto dall'utente (se manca, usa la root)
    const requestedPath = path.resolve(userPath || USB_PATH);

    // 3. Verifica se il percorso richiesto inizia con il percorso della root
    if (!requestedPath.startsWith(rootPath)) {
        throw new Error("Accesso negato: Tentativo di uscire dalla cartella consentita.");
    }

    return requestedPath;
};

const getAbsolutePath = (relativeUserPath) => {
    const root = path.resolve(USB_PATH);
    // Uniamo la root fisica con il percorso virtuale del client
    // .normalize() pulisce eventuali "//" o "./"
    const safeRelative = path.normalize(relativeUserPath || '/').replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(root, safeRelative);

    // Sicurezza: non deve mai uscire dalla root
    if (!absolutePath.startsWith(root)) {
        return root; // Forza il ritorno alla base se qualcuno barletta con i path
    }
    return absolutePath;
};

const getRelativePath = (absoluteFilePath) => {
    // Trasforma "/media/pi/USB/cartella/file.txt" in "/cartella/file.txt"
    const root = path.resolve(USB_PATH);
    let relative = absoluteFilePath.replace(root, '');
    if (!relative.startsWith('/')) relative = '/' + relative;
    return relative;
};


// GET: Legge il contenuto di una directory
app.get('/files', async (req, res) => {


    try {
        const targetPath = getAbsolutePath(req.query.path);
        const files = await fs.readdir(targetPath, { withFileTypes: true });

        const content = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            extension: path.extname(file.name),
            // Al client diamo il path relativo (es. /cartella/foto.png)
            virtualPath: path.join(getRelativePath(targetPath), file.name)
        }));

        res.json({
            currentPath: getRelativePath(targetPath), // Il client vedrà "/" o "/cartella"
            items: content
        });
    } catch (err) {
        res.status(500).json({
            error: "Impossibile leggere il path",
            detail: err.message
        });
    }
});

// POST: Crea o sovrascrive un file nel path specificato
app.post('/files/write', async (req, res) => {
    const { fileName, content, subDir } = req.body;

    if (!fileName || content === undefined) {
        return res.status(400).json({ error: "fileName e content sono obbligatori" });
    }

    // Costruiamo il path finale (attenzione alla sicurezza/permessi)
    const baseDir = USB_PATH;
    const finalPath = path.join(baseDir, subDir || '', fileName);

    try {
        // Scrive il file (crea la cartella se non esiste opzionale)
        await fs.writeFile(finalPath, content, 'utf8');

        res.json({
            message: "File salvato con successo",
            path: finalPath
        });
    } catch (err) {
        res.status(500).json({
            error: "Errore durante la scrittura del file",
            detail: err.message
        });
    }
});



// DOWNLOAD: Invia il file al browser
app.get('/files/download', (req, res) => {
    try {
        const fullPath = validatePath(req.query.path);
        res.download(fullPath);
    } catch (err) {
        res.status(403).send("Accesso negato");
    }
});

// UPLOAD: Riceve il file e lo sposta nel path corretto
app.post('/files/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File non ricevuto" });

        const targetDir = validatePath(req.body.path);
        const fileName = req.file.originalname;
        const finalPath = path.join(targetDir, fileName);

        // Debug: vediamo cosa arriva
        console.log(`Caricamento: ${fileName} -> ${finalPath}`);

        // 1. Assicuriamoci che la destinazione esista
        if (!fsSync.existsSync(targetDir)) {
            return res.status(400).json({ error: "La cartella di destinazione non esiste" });
        }

        // 2. Copiamo il file dal percorso temporaneo Multer alla USB
        await fs.copyFile(req.file.path, finalPath);

        // 3. Cancelliamo il file temporaneo creato da Multer in /tmp
        await fs.unlink(req.file.path);

        res.json({ message: "Caricato con successo", file: fileName });
    } catch (err) {
        console.error("ERRORE SERVER 500:", err);
        res.status(500).json({
            error: "Errore interno al server",
            detail: err.message
        });
    }
});

// DELETE: Elimina un file o una cartella
app.delete('/files/delete', async (req, res) => {
    const targetPath = validatePath(req.query.path);

    if (!targetPath || targetPath === USB_PATH) {
        return res.status(400).json({ error: "Path non valido o protetto" });
    }

    try {
        // recursive: true permette di eliminare cartelle non vuote
        // force: true evita errori se il file non esiste
        await fs.rm(targetPath, { recursive: true, force: true });

        console.log(`Eliminato: ${targetPath}`);
        res.json({ message: "Eliminato con successo" });
    } catch (err) {
        res.status(500).json({ error: "Errore durante l'eliminazione", detail: err.message });
    }
});

app.get('/files/video-stream', (req, res) => {
    const videoPath = validatePath(req.query.path);
    if (!videoPath) return res.status(400).send("Path mancante");

    const stat = fsSync.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fsSync.createReadStream(videoPath, { start, end });

        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4', // Funziona bene con mp4, mkv, webm
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fsSync.createReadStream(videoPath).pipe(res);
    }
});

app.listen(PORT, () => {
    console.log(`API attiva su http://raspberry.local/app/ (Porta ${PORT})`);
});

