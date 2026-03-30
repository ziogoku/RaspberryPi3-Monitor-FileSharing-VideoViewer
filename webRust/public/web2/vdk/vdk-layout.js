export class VDKLayout {
    constructor(id) {
        // Creiamo l'elemento radice del layout
        this.mainContainer = document.createElement('div');
        this.mainContainer.className = "vdk-layout-container";
        if (id) this.mainContainer.id = id;

        // Setup CSS base per il layout verticale
        Object.assign(this.mainContainer.style, {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "10px"
        });

        this.rows = [];
        this.idMap = {};
    }

    /**
     * Appende il layout al DOM
     * @param {string|HTMLElement} selector - Dove appendere il layout
     */
    mount(selector) {
        const target = selector instanceof HTMLElement
            ? selector
            : document.querySelector(selector);

        if (target) {
            target.appendChild(this.mainContainer);
        } else {
            console.error("VDKLayout: Target non trovato", selector);
        }
        return this;
    }

    /**
     * Aggiunge una riga con pesi opzionali (es. [2, 1] per 66% e 33%)
     */
    addRow(numCols, ids = [], weights = []) {
        const row = document.createElement('div');
        row.className = "vdk-row";
        Object.assign(row.style, {
            display: "flex",
            width: "100%",
            gap: "10px"
        });

        const currentRowNodes = [];

        for (let i = 0; i < numCols; i++) {
            const col = document.createElement('div');
            col.className = "vdk-col";

            // Gestione dei pesi (Flex-grow)
            const weight = weights[i] || 1;
            col.style.flex = `${weight}`;

            // Bordi o padding di debug opzionali
            col.style.minHeight = "50px";

            if (ids[i]) {
                col.id = ids[i];
                this.idMap[ids[i]] = col;
            }

            row.appendChild(col);
            currentRowNodes.push(col);
        }

        this.mainContainer.appendChild(row);
        this.rows.push(currentRowNodes);
        return this;
    }

    at(r, c) { return this.rows[r]?.[c] || null; }
    getById(id) { return this.idMap[id] || null; }
}