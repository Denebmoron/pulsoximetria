// ===== Alertas y Semáforo clínico para SpO2 y BPM =====

const Alerts = {
    // Umbrales clínicos de SpO2 ajustados
    levelFor(spo2) {
        if (spo2 >= 95) return 'green';    // Normal
        if (spo2 >= 88) return 'yellow';   // Precaución (entre 88 y 94)
        return 'red';                      // Crítico (por debajo de 88)
    },

    // Umbrales clínicos de BPM
    levelForBpm(bpm) {
        if (bpm < 50 || bpm >= 110) return 'red';    // Crítico
        if (bpm < 60 || bpm > 100) return 'yellow';  // Precaución
        return 'green';                              // Normal
    },

    check(spo2, bpm) { // Agregamos 'bpm' para poder enviarlo por WhatsApp
        // Actualiza el color del círculo de SpO2 en la interfaz según el nivel
        const level = this.levelFor(spo2);
        if (UI.el.spo2Circle) {
            UI.el.spo2Circle.classList.remove('level-green', 'level-yellow', 'level-red');
            UI.el.spo2Circle.classList.add('level-' + level);
        }

        // Si el SpO2 está por debajo de 88, dispara el banner y la API de WhatsApp
        if (spo2 < 88) {
            UI.showAlert(spo2);
            // Envía la alerta oficial por WhatsApp integrada con la API de Meta
            if (typeof WhatsAppAPI !== 'undefined' && WhatsAppAPI.sendAlert) {
                WhatsAppAPI.sendAlert(spo2, bpm, UI.patientId);
            }
        } else {
            UI.hideAlert(); // Oculta la alerta si se recupera
        }
    },

    async registerWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
            } catch (e) {
                console.error('Error al registrar el service worker:', e);
            }
        }
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            return { status: 'unsupported' };
        }
        if (Notification.permission === 'granted') {
            return { status: 'enabled' };
        }
        if (Notification.permission === 'denied') {
            return { status: 'denied' };
        }
        const result = await Notification.requestPermission();
        return { status: result === 'granted' ? 'enabled' : 'denied' };
    }
};
