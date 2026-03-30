import { CONST } from "./const.js";
import { VDK } from "./vdk/index.js";

// Usiamo una funzione di inizializzazione pulita
const initApp = () => {
    // 1. Impostazioni globali dal file CONST
    document.title = CONST.TITLE;

    // 2. Esempio di creazione Layout con il nuovo metodo
    const layout = new VDK.Layout("main-layout")
        .addRow(1, ["header"])
        .addRow(2, ["sidebar", "content"], [1, 3])
        .addRow(1, ["footer"])
        .mount("body"); // Lo agganciamo al div principale nell'HTML

    // 3. Popoliamo i pezzi usando il selettore VDK
    VDK.$("#header").html(`<h1>${CONST.TITLE}</h1>`);
    VDK.$("#sidebar").html("<nav><ul><li>Dashboard</li><li>Settings</li></ul></nav>");
    VDK.$("#content").html("<p>Benvenuto nel sistema gestito da VDK Framework.</p>");

    // Messaggio di log (opzionale)
    VDK.init();
};

// Facciamo partire tutto quando il DOM è pronto (senza aspettare le immagini)
document.addEventListener("DOMContentLoaded", initApp);