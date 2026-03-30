// config.js
const path = require('path');

module.exports = {
    // Configurazione Server
    PORT: 3001,

    // Configurazione Database MariaDB
    DB_CONFIG: {
        host: 'localhost',
        user: 'vins',
        password: 'admin',
        database: 'raspberry_db',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    },

    // Configurazione File System (USB)
    USB_PATH: '/media/maxtor-500/RaspberryP3',

};