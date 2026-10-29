// ===== Alertas: umbrales de semáforo, notificación del sistema y aviso por WhatsApp =====
const Alerts = {
    // Umbrales basados en la escala clínica de la imagen
    THRESH: { 
        severe: 86,   // Menor a 86% -> Rojo (Hipoxia severa)[cite: 1]
        moderate: 91, // De 86% a 90% -> Naranja (Hipoxia moderada)[cite: 1]
        caution: 95   // De 91% a 94% -> Amarillo (Hipoxia leve)[cite: 1]
    }, 

    // WhatsApp en pausa: ponlo en true cuando el servidor (server/) esté configurado
    WHATSAPP_ENABLED: false,

    // Cambia esto por la IP de la compu donde corra server/server.js en tu red local
    ALERT_SERVER_URL: 'http://localhost:3001/api/alert',

    COOLDOWN_MS: 5 * 60 * 1000, // no reenviar el WhatsApp más de una vez cada 5 min
    lastLevel: null,
    lastWhatsappAt: 0,

    // Nueva sesión: la próxima lectura baja vuelve a avisar
    reset() {
        this.lastLevel = null;
    },

    // El nivel se calcula con el valor redondeado
    levelFor(spo2) {
        const value = Math.round(spo2);
        if (value < this.THRESH.severe) return 'red';       // Menor a 86% -> Rojo[cite: 1]
        if (value < this.THRESH.moderate) return 'orange';  // 86% - 90% -> Naranja[cite: 1]
        if (value < this.THRESH.caution) return 'yellow';   // 91% - 94% -> Amarillo[cite: 1]
        return 'green';                                   // 95% o más -> Verde[cite: 1]
    },

    // Registra el service worker (sw.js), necesario para las notificaciones en Android.
    async registerWorker() {
        if (!('serviceWorker' in navigator)) return;
        try {
            await navigator.serviceWorker.register('sw.js');
        } catch (e) {
            console.warn('No se pudo registrar el service worker:', e);
        }
    },

    // Pide permiso de notificaciones
    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'default') return await Notification.requestPermission();
        return Notification.permission;
    },

    // Notificación del sistema (barra del teléfono)
    async notifyPhone(spo2) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const title = '⚠️ SpO2 en niveles de riesgo';
        const options = {
            body: `SpO2 en ${Math.round(spo2)}%. Revisa al paciente inmediatamente.`,
            tag: 'spo2-alert',
            renotify: true,
            vibrate: [200, 100, 200]
        };

        try {
            if ('serviceWorker' in navigator && await navigator.serviceWorker.getRegistration()) {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification(title, options);
                return;
            }
            new Notification(title, options);
        } catch (e) {
            console.error('No se pudo mostrar la notificación:', e);
        }
    },

    // Le pide al backend que mande el WhatsApp al familiar
    async notifyWhatsApp(spo2) {
        const now = Date.now();
        if (now - this.lastWhatsappAt < this.COOLDOWN_MS) return;
        this.lastWhatsappAt = now;
        try {
            await fetch(this.ALERT_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spo2: Math.round(spo2) })
            });
        } catch (e) {
            console.error('No se pudo avisar por WhatsApp:', e);
        }
    },

    // Se llama en cada lectura real o demo. Dispara avisos al entrar en zonas de riesgo (naranja o rojo).
    check(spo2) {
        if (!Number.isFinite(spo2) || spo2 <= 0) return;
        const level = this.levelFor(spo2);

        if ((level === 'red' || level === 'orange') && this.lastLevel !== level) {
            this.notifyPhone(spo2);
            if (this.WHATSAPP_ENABLED) this.notifyWhatsApp(spo2);
        }
        this.lastLevel = level;
    }
};
