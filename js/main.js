// ===== Arranque: une los módulos y conecta los eventos =====

const App = {
    // Punto único por donde pasa cada lectura, venga del Bluetooth o del demo
    applyReading(bpm, irValue, spo2) {
        UI.showReading(bpm, spo2);
        Graph.draw(irValue);
        Alerts.check(spo2);
    },

    init() {
        UI.init();
        Graph.init(UI.el.canvas);

        // El permiso de notificación hay que pedirlo dentro de un clic del usuario
        UI.el.btnConnect.addEventListener('click', () => { Alerts.requestPermission(); BLE.connect(); });
        UI.el.btnDemo.addEventListener('click', () => { Alerts.requestPermission(); Demo.toggle(); });
        UI.el.langSelect.addEventListener('change', e => {
            Lang.set(e.target.value);
            UI.applyLang();
        });

        UI.applyLang(); // Aplica el idioma por defecto (es) al cargar
    }
};

App.init();
