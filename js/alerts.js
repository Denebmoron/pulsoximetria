// ===== Alertas: umbrales de semáforo, aviso en pantalla, notificación del teléfono y WhatsApp =====
// Decide los niveles y dispara los avisos; lo que se dibuja en pantalla lo hace UI.

const Alerts = {
    // Umbrales de SpO2 basados en la escala clínica:
    // Menor a 86% -> Rojo (Hipoxia severa)
    // 86% a 90% -> Naranja (Hipoxia moderada)
    // 91% a 94% -> Amarillo (Hipoxia leve)
    // >= 95% -> Verde (Normal)
    THRESH_SPO2: { 
        severe: 86,   
        moderate: 91, 
        caution: 95   
    }, 

    // Umbrales de Frecuencia Cardíaca (BPM)
    // Normal: 60 - 100
    // Precaución / Amarillo: 50 - 59 o 101 - 109
    // Crítico / Rojo: < 50 o >= 110 (Taquicardia severa a partir de 110 lpm)
    THRESH_BPM: {
        lowDanger: 50,
        lowCaution: 60,
        highCaution: 100,
        highDanger: 110
    },

    // WhatsApp en pausa: ponlo en true cuando el servidor esté configurado
    WHATSAPP_ENABLED: false,

    ALERT_SERVER_URL: 'http://localhost:3001/api/alert',

    COOLDOWN_MS: 5 * 60 * 1000, 
    lastLevel: null,
    lastWhatsappAt: 0,
    workerError: '',

    reset() {
        this.lastLevel = null;
    },

    // Cálculo del nivel de SpO2 para el semáforo y gráficas
    levelFor(spo2) {
        const value = Math.round(spo2);
        if (value < this.THRESH_SPO2.severe) return 'red';       // Menor a 86% -> Rojo
        if (value < this.THRESH_SPO2.moderate) return 'orange';  // 86% - 90% -> Naranja
        if (value < this.THRESH_SPO2.caution) return 'yellow';   // 91% - 94% -> Amarillo
        return 'green';                                   // 95% o más -> Verde
    },

    // Cálculo del nivel de BPM para el borde de la tarjeta y los registros
    levelForBpm(bpm) {
        const value = Math.round(bpm);
        if (value < this.THRESH_BPM.lowDanger || value >= this.THRESH_BPM.highDanger) return 'red'; // <50 o >=110 (Rojo por 110 o más)
        if (value < this.THRESH_BPM.lowCaution || value > this.THRESH_BPM.highCaution) return 'yellow'; // Precaución
        return 'green'; // Normal (60-100)
    },

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

    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'default') return await Notification.requestPermission();
        return Notification.permission;
    },

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