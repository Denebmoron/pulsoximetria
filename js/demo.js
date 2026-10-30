// ===== Demo: simula lecturas continuas y escenarios clínicos =====

const Demo = {
    on: false,
    timer: null,
    scenario: 'normal', // 'normal' | 'caution' | 'critical'

    // Valores simulados actuales
    bpm: 75,
    spo2: 98,
    ir: 50000,
    phase: 0,

    toggle() {
        if (this.on) {
            this.stop();
        } else {
            this.start();
        }
    },

    start() {
        this.on = true;
        UI.setDemoActive(true);
        UI.toast(Lang.t('demoStarted') || 'Modo Demo activado');
        this.loop();
    },

    stop() {
        this.on = false;
        clearTimeout(this.timer);
        UI.setDemoActive(false);
        UI.resetReading();
        UI.toast(Lang.t('demoStopped') || 'Modo Demo detenido');
    },

    setScenario(name) {
        this.scenario = name;
        UI.setScenario(name);

        switch (name) {
            case 'critical':
                this.bpm = 125;
                this.spo2 = 87; // Nivel crítico (<90)
                break;
            case 'caution':
                this.bpm = 105;
                this.spo2 = 92; // Nivel de precaución (90-94)
                break;
            case 'normal':
            default:
                this.bpm = 75;
                this.spo2 = 98; // Nivel normal (>=95)
                break;
        }
    },

    loop() {
        if (!this.on) return;

        // Simular variación pequeña en BPM y SpO2 según el escenario
        const bpmVariation = Math.floor(Math.random() * 3) - 1;
        const currentBpm = Math.max(40, Math.min(180, this.bpm + bpmVariation));

        // Generar onda pletismográfica simulada (curva PPG con seno y ruido)
        this.phase += (currentBpm / 60) * 0.2;
        const ppgWave = Math.sin(this.phase) * 15000 + Math.sin(this.phase * 2) * 5000;
        const simulatedIR = 60000 + ppgWave + (Math.random() * 1000 - 500);

        // Actualizar la interfaz y la gráfica
        UI.showReading(currentBpm, this.spo2);
        Graph.add(simulatedIR);

        // Evaluar alertas si aplica
        Alerts.check(this.spo2);

        // Repetir el ciclo cada ~50ms (~20 FPS para la gráfica)
        this.timer = setTimeout(() => this.loop(), 50);
    }
};