export class VDKElement {
    constructor(selector) {
        // Se passi già un elemento DOM, usalo, altrimenti cercalo
        this.nodes = selector instanceof HTMLElement
            ? [selector]
            : Array.from(document.querySelectorAll(selector));
    }

    // Metodo per gestire eventi (tipo .on di jQuery)
    on(event, callback) {
        this.nodes.forEach(node => node.addEventListener(event, callback));
        return this; // Permette il chaining (concatenazione)
    }

    // Metodo per cambiare il testo
    text(val) {
        if (val === undefined) return this.nodes[0]?.innerText;
        this.nodes.forEach(node => node.innerText = val);
        return this;
    }

    html(val) {
        if (val === undefined) {
            return this.nodes[0]?.innerHTML;
        }

        // Forza il comportamento solo su stringhe
        const htmlString = String(val);
        this.nodes.forEach(node => {
            node.innerHTML = htmlString;
        });

        return this;
    }

    // Metodo per aggiungere classi
    addClass(className) {
        this.nodes.forEach(node => node.classList.add(className));
        return this;
    }

    // Aggiunge contenuto alla FINE di ogni elemento selezionato
    append(content) {
        this._insert(content, 'beforeend');
        return this;
    }

    // Aggiunge contenuto all'INIZIO di ogni elemento selezionato
    prepend(content) {
        this._insert(content, 'afterbegin');
        return this;
    }

    // Metodo privato di supporto per evitare ripetizioni
    _insert(content, position) {
        this.nodes.forEach(node => {
            if (typeof content === 'string') {
                // Se è una stringa, la inseriamo come HTML
                node.insertAdjacentHTML(position, content);
            } else if (content instanceof VDKElement) {
                // Se è un'altra istanza VDK, appendiamo i suoi nodi interni
                content.nodes.forEach(childNode => {
                    if (position === 'beforeend') node.appendChild(childNode);
                    else node.insertBefore(childNode, node.firstChild);
                });
            } else if (content instanceof HTMLElement) {
                // Se è un elemento DOM puro
                if (position === 'beforeend') node.appendChild(content);
                else node.insertBefore(content, node.firstChild);
            }
        });
    }
}