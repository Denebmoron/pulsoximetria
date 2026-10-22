// ===== Alertas: umbrales de semáforo, notificación del sistema y aviso por WhatsApp =====
// No toca el DOM directamente (eso lo hace UI) — solo decide niveles y dispara los avisos.

const Alerts = {
    THRESH: { low: 90, caution: 95 }, // <90 rojo, 90-94 amarillo, >=95 verde — ajusta a gusto

    // WhatsApp en pausa: ponlo en true cuando el servidor (server/) esté configurado
    WHATSAPP_ENABLED: false,

    // Cambia esto por la IP de la compu donde corra server/server.js en tu red local
    // (si usas "localhost" aquí, el celular busca el backend en SÍ MISMO, no en tu compu)
    ALERT_SERVER_URL: 'http://localhost:3001/api/alert',

    COOLDOWN_MS: 5 * 60 * 1000, // no reenviar el WhatsApp más de una vez cada 5 min
    lastLevel: null,
    lastWhatsappAt: 0,

    levelFor(spo2) {
        if (spo2 < this.THRESH.low) return 'red';
        if (spo2 < this.THRESH.caution) return 'yellow';
        return 'green';
    },

    // Pide permiso de notificaciones. Hay que llamarla desde un clic del usuario
    // (p. ej. al presionar Conectar), los navegadores ignoran el permiso si no.
    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'default') return await Notification.requestPermission();
        return Notification.permission;
    },

    // Notificación nativa: en Android aparece en la barra del sistema aunque
    // cambies de pestaña, mientras Chrome siga abierto. En iPhone no aparece
    // a menos que la app esté instalada como PWA (limitación de Apple, no nuestra).
    notifyPhone(spo2) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        new Notification('⚠️ SpO2 bajo', {
            body: `SpO2 en ${Math.round(spo2)}%. Revisa al paciente.`,
            tag: 'spo2-alert', // evita apilar notificaciones repetidas, la última reemplaza a la anterior
            renotify: true
        });
    },

    // Le pide al backend (server/server.js) que mande el WhatsApp al familiar.
    // El token de Meta nunca debe vivir en este archivo ni en el navegador.
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
            console.error('No se pudo avisar por WhatsApp (¿está corriendo el servidor?):', e);
        }
    },

    // Se llama en cada lectura real (BLE o demo). Solo dispara avisos al ENTRAR en rojo,
    // no en cada lectura mientras sigue bajo (si no, sería spam constante).
    check(spo2) {
        if (!Number.isFinite(spo2) || spo2 <= 0) return;
        const level = this.levelFor(spo2);

        if (level === 'red' && this.lastLevel !== 'red') {
            this.notifyPhone(spo2);
            if (this.WHATSAPP_ENABLED) this.notifyWhatsApp(spo2);
        }
        this.lastLevel = level;
    }
};
