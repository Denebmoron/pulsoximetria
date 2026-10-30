// ===== Modo demo: simula lecturas para probar la app sin el oxímetro conectado =====
const Demo = {
    on: false,
    timer: null,
    phase: 0,
    bpm: 75,
    spo2: 97,
    noise: 0,
    scenario: 'normal',

    // 5 escenarios para probar los 4 niveles del semáforo y notificaciones
    SCENARIOS: {
        normal:    { spo2: 97, bpm: 75 },  // Verde: Normal (95-99%)[cite: 1]
        caution:   { spo2: 93, bpm: 82 },  // Amarillo: Hipoxia leve (91-94%)[cite: 1]
        borderline:{ spo2: 90, bpm: 88 },  // Naranja: Hipoxia moderada límite (86-90%)[cite: 1]
        critical:  { spo2: 87, bpm: 96 },  // Naranja: Hipoxia moderada baja (86-90%)[cite: 1]
        severe:    { spo2: 83, bpm: 110 }  // Rojo: Hipoxia severa (<86%)[cite: 1]
    },

    // Pico sistólico + muesca dicrota: forma típica de una onda de pulso real
    shape(p) {
        return Math.exp(-(((p - .18) / .08) ** 2)) + .35 * Math.exp(-(((p - .45) / .1) ** 2));
    },

    // Acerca un valor a su objetivo suavemente
    approach(value, target, step) {
        return value + Math.max(-step, Math.min(step, target - value));
    },

    tick() {
        const goal = this.SCENARIOS[this.scenario];
        this.phase = (this.phase + this.bpm / 1800) % 1; 
        const ir = Math.round(this.shape(this.phase) * 750 + 150);

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
        this.timer = setInterval(() => this.tick(), 33); 
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
