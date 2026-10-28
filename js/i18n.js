// ===== Idioma: textos traducidos y estado del idioma actual =====

const I18N = {
    es: {
        title: 'Revisa tu pulsoximetría',
        connect: 'Conectar',
        connecting: 'Buscando traje...',
        connected: 'Conectado',
        error: 'Error (Reintentar)',
        history: 'Ver registro',
        chart: 'Curva pletismográfica de la señal',
        startDemo: 'Modo demo',
        stopDemo: 'Detener demo',
        save: 'Guardar',
        saved: 'Lectura guardada',
        noReading: 'Aún no hay una lectura para guardar',
        saveError: 'No se pudo guardar',
        historyTitle: 'Registro',
        empty: 'Aún no hay lecturas guardadas.',
        exportCsv: 'Exportar CSV',
        clearAll: 'Borrar todo',
        confirmClear: '¿Borrar todo el registro? No se puede deshacer.',
        close: 'Cerrar',
        demoTag: 'demo',
        del: 'Eliminar',
        deleted: 'Lectura eliminada',
        cleared: 'Registro borrado',
        exported: 'Archivo descargado',
        nothingToExport: 'No hay nada que exportar',
        scenNormal: 'Normal',
        scenCaution: 'Precaución',
        scenCritical: 'Crítico'
    },
    en: {
        title: 'Check your pulse oximetry',
        connect: 'Connect',
        connecting: 'Searching device...',
        connected: 'Connected',
        error: 'Error (Retry)',
        history: 'View log',
        chart: 'Pulse waveform',
        startDemo: 'Demo mode',
        stopDemo: 'Stop demo',
        save: 'Save',
        saved: 'Reading saved',
        noReading: 'No reading to save yet',
        saveError: 'Could not save',
        historyTitle: 'Log',
        empty: 'No saved readings yet.',
        exportCsv: 'Export CSV',
        clearAll: 'Clear all',
        confirmClear: 'Clear the whole log? This cannot be undone.',
        close: 'Close',
        demoTag: 'demo',
        del: 'Delete',
        deleted: 'Reading deleted',
        cleared: 'Log cleared',
        exported: 'File downloaded',
        nothingToExport: 'Nothing to export',
        scenNormal: 'Normal',
        scenCaution: 'Caution',
        scenCritical: 'Critical'
    }
};

const Lang = {
    current: 'es',

    // Devuelve el texto de una clave en el idioma actual
    t(key) {
        return I18N[this.current][key];
    },

    // Cambia el idioma actual (el repintado lo hace UI.applyLang)
    set(code) {
        this.current = code;
        document.documentElement.lang = code;
    }
};
