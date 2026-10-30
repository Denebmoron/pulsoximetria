
// ===== Alertas: umbrales de semáforo, aviso en pantalla, notificación del teléfono y WhatsApp =====
// Decide los niveles y dispara los avisos; lo que se dibuja en pantalla lo hace UI.
 
const Alerts = {
    THRESH: { low: 90, caution: 95 }, // <90 rojo, 90-94 amarillo, >=95 verde — ajusta a gusto
 
    // Semáforo del BPM: rojo por encima de 110 (lo pidió el profe); verde de 60 a 100;
    // amarillo de 101 a 110 y por debajo de 60 — ajusta a gusto
    BPM_THRESH: { low: 60, high: 100, red: 110 },
 
    // WhatsApp en pausa: ponlo en true cuando el servidor (server/) esté configurado
    WHATSAPP_ENABLED: false,
 
    // Cambia esto por la IP de la compu donde corra server/server.js en tu red local
    // (si usas "localhost" aquí, el celular busca el backend en SÍ MISMO, no en tu compu)
    ALERT_SERVER_URL: 'http://localhost:3001/api/alert',
 
    COOLDOWN_MS: 5 * 60 * 1000, // no reenviar el WhatsApp más de una vez cada 5 min
    lastLevel: null,
    lastWhatsappAt: 0,
    workerError: '', // motivo si el service worker no se pudo registrar (se muestra como ayuda)
 
    // Nueva sesión: la próxima lectura baja vuelve a avisar
    reset() {
        this.lastLevel = null;
    },
 
    // El nivel se calcula con el valor redondeado, el mismo que se ve en pantalla
    // (así "90 %" nunca aparece en rojo).
    levelFor(spo2) {
        const value = Math.round(spo2);
        if (value < this.THRESH.low) return 'red';
        if (value < this.THRESH.caution) return 'yellow';
        return 'green';
    },
 
    // Nivel de semáforo del BPM, con el valor redondeado igual que el SpO2
    levelForBpm(bpm) {
        const value = Math.round(bpm);
        if (value > this.BPM_THRESH.red) return 'red';
        if (value > this.BPM_THRESH.high || value < this.BPM_THRESH.low) return 'yellow';
        return 'green';
    },
 
    // Registra el service worker (sw.js), necesario para las notificaciones en Android.
    // Solo funciona con HTTPS (p. ej. GitHub Pages) o localhost; abierto como archivo suelto no.
    async registerWorker() {
        if (!('serviceWorker' in navigator)) return;
        try {
            await navigator.serviceWorker.register('sw.js');
            this.workerError = '';
        } catch (e) {
            this.workerError = String((e && e.message) || e);
            console.warn('No se pudo registrar el service worker (¿la página usa HTTPS?):', e);
        }
    },
 
    // Pide permiso de notificaciones. Hay que llamarla desde un clic del usuario
    // (p. ej. al presionar Conectar), los navegadores ignoran el permiso si no.
    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'default') return await Notification.requestPermission();
        return Notification.permission;
    },
 
    // Notificación del sistema (barra del teléfono). En Android/Chrome solo se puede mostrar
    // a través del service worker; "new Notification()" queda como respaldo para escritorio.
    // En iPhone no aparece a menos que la app esté instalada como PWA (limitación de Apple).
    // Devuelve { status, detail } para que la pantalla pueda explicar por qué no salió:
    // shown | unsupported | denied | default | noworker | error
    async notifyPhone(spo2) {
        if (!('Notification' in window)) return { status: 'unsupported' };
        if (Notification.permission === 'denied') return { status: 'denied' };
        if (Notification.permission !== 'granted') return { status: 'default' };
 
        const title = Lang.t('alertTitle');
        const options = {
            body: Lang.t('alertBody').replace('{n}', Math.round(spo2)),
            tag: 'spo2-alert', // evita apilar notificaciones repetidas, la última reemplaza a la anterior
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
                new Notification(title, options); // escritorio sin service worker
            }
            return { status: 'shown' };
        } catch (e) {
            console.error('No se pudo mostrar la notificación:', e);
            return { status: 'error', detail: String((e && e.message) || e).slice(0, 140) };
        }
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
 
    // Se llama en cada lectura real (BLE o demo). Solo avisa al ENTRAR en rojo,
    // no en cada lectura mientras sigue bajo (si no, sería spam constante).
    check(spo2) {
        if (!Number.isFinite(spo2) || spo2 <= 0) return;
        const level = this.levelFor(spo2);
 
        if (level === 'red' && this.lastLevel !== 'red') {
            UI.showAlert(spo2); // aviso en pantalla: sale siempre
            this.notifyPhone(spo2).then(result => UI.setAlertPhoneStatus(result)); // barra del teléfono
            if (this.WHATSAPP_ENABLED) this.notifyWhatsApp(spo2);
        } else if (level !== 'red' && this.lastLevel === 'red') {
            UI.hideAlert(); // la lectura se recuperó
        }
        this.lastLevel = level;
    }
};
 
