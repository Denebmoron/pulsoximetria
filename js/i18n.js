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
        stopDemo: 'Detener demo'
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
        stopDemo: 'Stop demo'
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
