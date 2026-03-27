# RaspberryPi3 Monitor & Cloud Hub 🚀

Un sistema integrato per monitorare le statistiche di una Raspberry Pi 3, gestire file in remoto (stile cloud privato) e riprodurre contenuti video tramite un'interfaccia web fluida.

## 🏗️ Architettura del Progetto

Il progetto è diviso in tre componenti principali:
- **`app/`**: Server API Rest sviluppato in **Node.js**. Gestisce la logica di backend e l'interazione con il sistema.
- **`webRust/`**: Webserver ad alte prestazioni sviluppato in **Rust** che ospita e serve il frontend statico.
- **`webRust/public/`**: Il cuore dell'interfaccia (HTML5, CSS3 modulare, JS ES6).

## 🛠️ Funzionalità
- **Monitor**: Visualizzazione in tempo reale di CPU, RAM e stato del Disco.
- **Cinema**: Player video integrato con gestione playlist automatica.
- **File Manager**: 
  - Drag & Drop e Click-to-Upload (ottimizzato per Smartphone).
  - Navigazione tra cartelle e download file.
  - Eliminazione file con protezione da bubbling.

## 🚀 Come avviare il sistema

### 1. Backend Node.js
```bash
cd app
npm install
node app.js

### 2. Frontend Rust Server
cd webRust
cargo build --release
./target/release/webRust

