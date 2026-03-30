// 1. Importiamo tutti i moduli interni
import { VDKElement } from './vdk-element.js';
import { VDKLayout } from './vdk-layout.js';


// 2. Definiamo l'oggetto Namespace principale
export const VDK = {
    // Il selettore universale
    $: (selector) => new VDKElement(selector),

    // Il costruttore per i layout
    // L'utente farà: const mioLayout = new VDK.Layout("id")
    Layout: VDKLayout,

    // Altri componenti
    // ...

    // Metadati
    VERSION: "1.0.0",

    // Utility opzionale: un metodo init per loggare lo stato
    init: () => console.log(`VDK Framework v${VDK.VERSION} pronto.`)
};