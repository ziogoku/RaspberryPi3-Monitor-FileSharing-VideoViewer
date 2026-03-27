import { API_URL } from './const.js';

let currentPath = '';

export async function initFileManager() {
    const listElement = document.getElementById('file-list');
    const fileInput = document.getElementById('hidden-file-input');
    // Usiamo listElement come zona di drop visto che è l'area principale
    const dropZone = listElement;

    if (!listElement || !fileInput) return;

    // --- CLICK PER CARICARE ---
    // Cliccando sulla lista o sul testo di stato si apre il selettore
    [listElement, document.getElementById('upload-status')].forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === listElement || e.target.closest('#upload-status')) {
                fileInput.click();
            }
        });
    });

    fileInput.onchange = async () => {
        if (fileInput.files.length > 0) {
            await uploadMultipleFiles(fileInput.files);
            fileInput.value = '';
        }
    };

    // --- GESTIONE DRAG & DROP ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        await uploadMultipleFiles(e.dataTransfer.files);
    });

    async function uploadMultipleFiles(files) {
        const status = document.getElementById('upload-status');
        status.innerText = "Caricamento in corso...";

        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', currentPath);
            try {
                await fetch(`${API_URL}/files/upload`, { method: 'POST', body: formData });
            } catch (err) { console.error(err); }
        }

        status.innerHTML = 'Trascina file qui o <strong>clicca qui</strong> per caricare';
        refreshList(currentPath);
    }

    async function refreshList(path = '') {
        try {
            const res = await fetch(`${API_URL}/files?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            currentPath = data.path;
            document.getElementById('current-path').innerText = currentPath;
            listElement.innerHTML = '';

            if (data.items.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-folder-msg">
                        <span>📂</span>
                        <p>Cartella vuota</p>
                    </div>`;
            }

            const sortedItems = data.items.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            });

            sortedItems.forEach(item => {
                const div = document.createElement('div');
                div.className = `file-row ${item.isDirectory ? 'is-dir' : 'is-file'}`;
                const fullPath = `${currentPath}/${item.name}`.replace(/\/+/g, '/');

                div.innerHTML = `
                    <span class="icon">${item.isDirectory ? '📁' : '📄'}</span>
                    <span class="name">${item.name}</span>
                    <button class="btn-delete">🗑️</button>
                `;

                div.onclick = () => {
                    item.isDirectory ? refreshList(fullPath) : window.location.href = `${API_URL}/files/download?path=${encodeURIComponent(fullPath)}`;
                };

                div.querySelector('.btn-delete').onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Eliminare ${item.name}?`)) {
                        await fetch(`${API_URL}/files/delete?path=${encodeURIComponent(fullPath)}`, { method: 'DELETE' });
                        refreshList(currentPath);
                    }
                };
                listElement.appendChild(div);
            });
        } catch (err) { console.error(err); }
    }

    document.getElementById('back-btn').onclick = () => {
        const parts = currentPath.split('/').filter(p => p);
        parts.pop();
        refreshList('/' + parts.join('/'));
    };

    refreshList();
}