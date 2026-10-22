// ===== Modo demo: simula lecturas para presentar la app sin la ESP32 conectada =====

const Demo = {
    on: false,
    timer: null,
    phase: 0,
    bpm: 75,
    spo2: 97,

    // Pico sistólico + muesca dicrota: forma típica de una onda de pulso real
    shape(p) {
        return Math.exp(-(((p - .18) / .08) ** 2)) + .35 * Math.exp(-(((p - .45) / .1) ** 2));
    },

    tick() {
        this.phase = (this.phase + this.bpm / 1800) % 1; // ~30 pasos/seg de reloj del demo
        const ir = Math.round(this.shape(this.phase) * 750 + 150);

        // Pequeñas variaciones aleatorias para que no se vea una línea perfectamente plana
        if (Math.random() < 0.02) this.bpm = Math.min(90, Math.max(65, this.bpm + (Math.random() * 4 - 2)));
        if (Math.random() < 0.02) this.spo2 = Math.min(99, Math.max(95, this.spo2 + (Math.random() * 2 - 1)));

        App.applyReading(Math.round(this.bpm), ir, this.spo2);
    },

    start() {
        this.on = true;
        this.timer = setInterval(() => this.tick(), 33); // ~30 Hz, similar al ritmo de notificaciones BLE reales
        UI.setDemoActive(true);
    },

    stop() {
        this.on = false;
        clearInterval(this.timer);
        UI.setDemoActive(false);
    },

    toggle() {
        this.on ? this.stop() : this.start();
    }
};
