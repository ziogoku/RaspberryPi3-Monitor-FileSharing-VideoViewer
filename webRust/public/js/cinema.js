import { API_URL, USB_PATH } from './const.js';

export async function initCinema() {
    const videoList = document.getElementById('video-list');
    const player = document.getElementById('main-player');
    const title = document.getElementById('video-title');
    const filenameEl = document.getElementById('video-filename');

    const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi'];

    async function loadPlaylist(path = '') {
        console.log("Richiedo filmati al path:", path);
        try {
            const res = await fetch(`${API_URL}/files?path=${encodeURIComponent(path)}`);
            const data = await res.json();

            videoList.innerHTML = '';

            // Filtriamo solo i video o le cartelle (per navigare)
            const items = data.items.filter(item =>
                item.isDirectory || videoExtensions.some(ext => item.name.toLowerCase().endsWith(ext))
            );

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = `video-item ${item.isDirectory ? 'is-folder' : 'is-video'}`;
                div.innerHTML = `
                    <span class="icon">${item.isDirectory ? '📁' : '▶️'}</span>
                    <span class="name">${item.name}</span>
                `;

                div.onclick = (event) => {
                    const targetPath = item.virtualPath;
                    if (item.isDirectory) {
                        loadPlaylist(targetPath); // Naviga nella sottocartella
                    } else {
                        playVideo(targetPath, item.name, event.currentTarget);
                    }
                };
                videoList.appendChild(div);
            });
        } catch (err) {
            console.error("Errore playlist:", err);
        }
    }

    function playVideo(virtualPath, name, element) {
        title.innerText = name;
        filenameEl.innerText = name;
        const streamUrl = `${API_URL}/files/video-stream?path=${encodeURIComponent(virtualPath)}`;
        player.src = streamUrl;
        player.load();
        player.play();

        // Evidenzia il video attivo
        document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');
    }

    document.getElementById('refresh-cinema').onclick = () => loadPlaylist();
    document.getElementById('close-player').onclick = () => {
        player.pause();
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'monitor' }));
    };

    // Avvio automatico
    loadPlaylist();
}