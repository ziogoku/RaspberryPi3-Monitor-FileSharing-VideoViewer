
import { API_URL, TIMEOUT, CLOCK_HEADER } from './const.js';

let statsInterval; // Variabile per gestire il timer del refresh

// Funzione per l'orologio nell'header
function startClock() {
    setInterval(() => {
        const clockEl = document.getElementById('header-clock');
        if (clockEl) {
            clockEl.innerText = new Date().toLocaleTimeString('it-IT');
        }
    }, CLOCK_HEADER);
}

// --- 1. FUNZIONE PER IL MONITORAGGIO HARDWARE ---
async function updateStats() {
    // Se l'elemento cpu-temp non esiste, significa che non siamo nella dashboard
    const tempEl = document.getElementById('cpu-temp');
    if (!tempEl) return;

    try {
        const response = await fetch(API_URL + "/info");
        if (!response.ok) throw new Error('API non raggiungibile');
        const data = await response.json();

        // Inserimento dati nelle card

        tempEl.innerText = data.cpu.temp;
        document.getElementById('cpu-load').innerText = data.cpu.usage;
        document.getElementById('ram-usage-percent').innerText = data.ram.usage_percent;
        document.getElementById('ram-used').innerText = data.ram.used;
        document.getElementById('ram-total').innerText = data.ram.total;
        document.getElementById('disk-usage-percent').innerText = data.disk.use_percent;
        document.getElementById('disk-used').innerText = data.disk.used;
        document.getElementById('disk-total').innerText = data.disk.size;

        // 2. AGGIORNA I DATI NELLA SIDEBAR (Sempre presente!)
        const cpuSide = document.getElementById('side-cpu-temp');
        if (cpuSide) cpuSide.innerText = data.cpu.temp;

        // Stato connessione
        const dot = document.getElementById('status-dot');
        if (dot) dot.className = 'status-dot status-online';
        document.getElementById('status-text').innerText = 'Online - ' + new Date().toLocaleTimeString();

    } catch (error) {
        console.error('Errore updateStats:', error);
        const dot = document.getElementById('status-dot');
        if (dot) {
            dot.className = 'status-dot status-offline';
            document.getElementById('status-text').innerText = 'Errore Connessione API';
        }
    }
}

// --- 2. NAVIGAZIONE E CARICAMENTO ---
async function includeHTML(elementId, fileName) {
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`Errore: ${response.status}`);
    const text = await response.text();
    document.getElementById(elementId).innerHTML = text;
}

// --- 3. NAVIGAZIONE DINAMICA (Senza ricaricare la pagina) ---
async function navigateTo(pageName) {
    // 1. Carica il contenuto nel centro
    // Nota: aggiungo 'pages/' se hai messo i file in una sottocartella
    await includeHTML('content-area', `pages/${pageName}.html`);

    // 2. Aggiorna Titolo Header
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.innerText = pageName.toUpperCase();
    }

    // 3. Gestione logica specifica
    // Se passiamo a una pagina che non è monitor, potresti voler fermare il refresh pesante
    // o forzarne uno subito se torni su monitor.
    if (pageName === 'monitor') {
        updateStats();
    }
    else if (pageName === 'filemanager') {
        // Carichiamo il modulo JS solo se serve
        const module = await import('./filemanager.js');
        module.initFileManager();
    } else if (pageName === 'cinema') {
        // Importiamo il modulo e lanciamo l'inizializzazione
        const { initCinema } = await import('./cinema.js');
        initCinema();
    }

    highlightSidebar(pageName);
}

function highlightSidebar(activePage) {
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
        // Se il data-page o l'id corrisponde, aggiungi active
        if (link.id === `link-${activePage}`) link.classList.add('active');
    });
}

// --- 4. AVVIO DELL'APP E GESTIONE EVENTI ---
window.addEventListener('DOMContentLoaded', async () => {
    // Caricamento scheletro
    await Promise.all([
        includeHTML('sidebar-placeholder', 'parts/sidebar.html'),
        includeHTML('header-placeholder', 'parts/header.html'),
        includeHTML('footer-placeholder', 'parts/footer.html')
    ]);

    // Gestione Click Sidebar (Delegation)
    // Intercettiamo i click sulla sidebar-placeholder anche se il contenuto è dinamico
    document.getElementById('sidebar-placeholder').addEventListener('click', (e) => {
        const link = e.target.closest('a[id^="link-"]'); // Cerca link che iniziano con link-
        if (link) {
            e.preventDefault();
            const pageName = link.id.replace('link-', '');
            navigateTo(pageName);
        }
    });

    await navigateTo('monitor');
    startClock();
    statsInterval = setInterval(updateStats, TIMEOUT);
});