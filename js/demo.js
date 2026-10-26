// ===== Modo demo: simula lecturas para probar la app sin el oxímetro conectado =====
// Tiene tres escenarios (normal, precaución, crítico) para probar el semáforo,
// las notificaciones y el guardado de lecturas.

const Demo = {
    on: false,
    timer: null,
    phase: 0,
    bpm: 75,
    spo2: 97,
    noise: 0,
    scenario: 'normal',

    // Valores hacia los que se mueve la lectura en cada escenario
    SCENARIOS: {
        normal:   { spo2: 97, bpm: 75 },
        caution:  { spo2: 92, bpm: 88 },
        critical: { spo2: 86, bpm: 105 }
    },

    // Pico sistólico + muesca dicrota: forma típica de una onda de pulso real
    shape(p) {
        return Math.exp(-(((p - .18) / .08) ** 2)) + .35 * Math.exp(-(((p - .45) / .1) ** 2));
    },

    // Acerca un valor a su objetivo de a poquito, para que el anillo y el BPM cambien suave
    approach(value, target, step) {
        return value + Math.max(-step, Math.min(step, target - value));
    },

    tick() {
        const goal = this.SCENARIOS[this.scenario];
        this.phase = (this.phase + this.bpm / 1800) % 1; // ~30 pasos/seg de reloj del demo
        const ir = Math.round(this.shape(this.phase) * 750 + 150);

        // Pequeña variación aleatoria para que no se vea una lectura perfectamente plana
        if (Math.random() < 0.02) this.noise = (Math.random() - 0.5) * 1.2;
        this.spo2 = this.approach(this.spo2, goal.spo2 + this.noise, 0.1);
        this.bpm = this.approach(this.bpm, goal.bpm + this.noise * 2, 0.15);

        App.applyReading(Math.round(this.bpm), ir, this.spo2);
    },

    setScenario(name) {
        if (!this.SCENARIOS[name]) return;
        this.scenario = name;
        UI.setScenario(name);
    },

    start() {
        this.on = true;
        this.scenario = 'normal';
        this.bpm = 75;
        this.spo2 = 97;
        this.noise = 0;
        this.timer = setInterval(() => this.tick(), 33); // ~30 Hz, similar al ritmo de notificaciones BLE reales
        UI.setDemoActive(true);
        UI.setScenario('normal');
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
