// ===== Idioma: textos traducidos y estado del idioma actual =====

const I18N = {
    es: {
        title: 'Revisa tu pulsoximetría',
        connect: 'Conectar',
        connecting: 'Buscando dispositivo...',
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

    // ... tus otras traducciones ...
    idTitle: 'Identificación',
    idHelp: 'Ingresa tu número de identificación para empezar. Se guarda con cada lectura.',
    idPlaceholder: 'Número de identificación',
    idOk: 'Continuar',
    idCancel: 'Cancelar',
    idChange: 'Cambiar ID',
    idChip: 'ID: {id}'

        // Nuevos escenarios ampliados para los 4 niveles clínicos
        scenNormal: 'Normal',
        scenCaution: 'Hipoxia leve',
        scenBorderline: 'Moderada (Límite)',
        scenCritical: 'Moderada (Baja)',
        scenSevere: 'Hipoxia severa',
        alertTitle: '⚠️ SpO2 en niveles de riesgo',
        alertBody: 'SpO2 en {n} %. Revísalo cuanto antes.',
        enableNotif: 'Activar notificaciones',
        notifEnabled: 'Notificaciones activadas',
        notifDefault: 'Falta permitir las notificaciones del teléfono.',
        notifBlocked: 'Las notificaciones están bloqueadas. Actívalas en Chrome: ⋮ → Configuración → Configuración de sitios → Notificaciones.',
        notifUnsupported: 'Este navegador no permite notificaciones del teléfono.',
        notifNoWorker: 'No se pudo activar el service worker (sw.js). Revisa que esté subido en la raíz del repositorio y que la página use HTTPS.',
        notifError: 'No se pudo mostrar la notificación del teléfono.'
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
        // Expanded scenarios for the clinical levels
        scenNormal: 'Normal',
        scenCaution: 'Mild hypoxia',
        scenBorderline: 'Moderate (Borderline)',
        scenCritical: 'Moderate (Low)',
        scenSevere: 'Severe hypoxia',
        alertTitle: '⚠️ Low SpO2 / Risk Level',
        alertBody: 'SpO2 at {n}%. Check right away.',
        enableNotif: 'Enable notifications',
        notifEnabled: 'Notifications enabled',
        notifDefault: 'Phone notifications are not allowed yet.',
        notifBlocked: 'Notifications are blocked. Enable them in Chrome: ⋮ → Settings → Site settings → Notifications.',
        notifUnsupported: 'This browser does not support phone notifications.',
        notifNoWorker: 'The service worker (sw.js) could not start. Make sure it is uploaded to the repository root and the page uses HTTPS.',
        notifError: 'Could not show the phone notification.'
    }
};

const Lang = {
    current: 'es',

    // Devuelve el texto de una clave en el idioma actual
    t(key) {
        return I18N[this.current][key] || key;
    },

    // Cambia el idioma actual (el repintado lo hace UI.applyLang)
    set(code) {
        if (!I18N[code]) return;
        this.current = code;
        document.documentElement.lang = code;
    }
};