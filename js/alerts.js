// ===== Alertas: umbrales de semáforo, aviso en pantalla, notificación del teléfono y WhatsApp =====
// Decide los niveles y dispara los avisos; lo que se dibuja en pantalla lo hace UI.

const Alerts = {
    // Umbrales basados en la escala clínica:
    // Menor a 86% -> Rojo (Hipoxia severa)
    // 86% a 90% -> Naranja (Hipoxia moderada)
    // 91% a 94% -> Amarillo (Hipoxia leve)
    // >= 95% -> Verde (Normal)
    THRESH: { 
        severe: 86,   
        moderate: 91, 
        caution: 95   
    }, 

    // WhatsApp en pausa: ponlo en true cuando el servidor (server/) esté configurado
    WHATSAPP_ENABLED: false,

    // Cambia esto por la IP de la compu donde corra server/server.js en tu red local
    ALERT_SERVER_URL: 'http://localhost:3001/api/alert',

    COOLDOWN_MS: 5 * 60 * 1000, // no reenviar el WhatsApp más de una vez cada 5 min
    lastLevel: null,
    lastWhatsappAt: 0,
    workerError: '', // motivo si el service worker no se pudo registrar

    // Nueva sesión: la próxima lectura baja vuelve a avisar
    reset() {
        this.lastLevel = null;
    },

    // El nivel se calcula con el valor redondeado, el mismo que se ve en pantalla
    levelFor(spo2) {
        const value = Math.round(spo2);
        if (value < this.THRESH.severe) return 'red';       // Menor a 86% -> Rojo
        if (value < this.THRESH.moderate) return 'orange';  // 86% - 90% -> Naranja
        if (value < this.THRESH.caution) return 'yellow';   // 91% - 94% -> Amarillo
        return 'green';                                   // 95% o más -> Verde
    },

    // Registra el service worker (sw.js), necesario para las notificaciones en Android.
    async registerWorker() {
        if (!('serviceWorker' in navigator)) return;
        try {
            await navigator.serviceWorker.register('sw.js');
            this.workerError = '';
        } catch (e) {
            this.workerError = String((e && e.message) || e);
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
        if (!('Notification' in window)) return { status: 'unsupported' };
        if (Notification.permission === 'denied') return { status: 'denied' };
        if (Notification.permission !== 'granted') return { status: 'default' };

        const title = Lang.t('alertTitle');
        const options = {
            body: Lang.t('alertBody').replace('{n}', Math.round(spo2)),
            tag: 'spo2-alert',
            renotify: true,
            vibrate: [200, 100, 200]
        };

        try {
            if ('serviceWorker' in navigator) {
                if (!(await navigator.serviceWorker.getRegistration())) {
                    return { status: 'noworker', detail: this.workerError.slice(0, 140) };
                }
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('el service worker no se activó')), 4000));
                const reg = await Promise.race([navigator.serviceWorker.ready, timeout]);
                await reg.showNotification(title, options);
            } else {
                new Notification(title, options);
            }
            return { status: 'shown' };
        } catch (e) {
            console.error('No se pudo mostrar la notificación:', e);
            return { status: 'error', detail: String((e && e.message) || e).slice(0, 140) };
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

    // Se llama en cada lectura real o demo. Dispara avisos al ENTRAR en zonas de riesgo (naranja o rojo).
    check(spo2) {
        if (!Number.isFinite(spo2) || spo2 <= 0) return;
        const level = this.levelFor(spo2);
        const isCriticalZone = (level === 'red' || level === 'orange');
        const wasCriticalZone = (this.lastLevel === 'red' || this.lastLevel === 'orange');

        if (isCriticalZone && !wasCriticalZone) {
            UI.showAlert(spo2); 
            this.notifyPhone(spo2).then(result => UI.setAlertPhoneStatus(result)); 
            if (this.WHATSAPP_ENABLED) this.notifyWhatsApp(spo2);
        } else if (!isCriticalZone && wasCriticalZone) {
            UI.hideAlert(); 
        }
        this.lastLevel = level;
    }
};