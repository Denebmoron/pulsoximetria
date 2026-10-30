// ===== Arranque: une los módulos y conecta los eventos =====

const App = {
    patientId: '', // ID de la persona que está usando la app (se pide al ingresar)

    // Última lectura mostrada: es la que se guarda al presionar Guardar.
    // Se recuerda de dónde vino cada valor (demo o real) para marcar el registro.
    last: { bpm: 0, spo2: NaN, bpmDemo: false, spo2Demo: false },

    // Punto único por donde pasa cada lectura, venga del Bluetooth o del demo
    applyReading(bpm, irValue, spo2) {
        if (bpm > 0) {
            this.last.bpm = bpm;
            this.last.bpmDemo = Demo.on;
        }
        if (Number.isFinite(spo2) && spo2 > 0) {
            this.last.spo2 = spo2;
            this.last.spo2Demo = Demo.on;
        }

        UI.showReading(bpm, spo2);
        Graph.draw(irValue);
        Alerts.check(spo2);
    },

    // Empieza de cero: borra la lectura mostrada y la recordada.
    // Se usa al conectar el oxímetro y al cambiar de ID, para que valores viejos
    // (de un demo o de otra persona) no se mezclen con los nuevos.
    resetReading() {
        this.last = { bpm: 0, spo2: NaN, bpmDemo: false, spo2Demo: false };
        UI.resetReading();
        Alerts.reset();
    },

    // ---------- Identificación ----------

    // ID válido: 3 a 20 caracteres, letras y números (también . - _ pero no al empezar)
    ID_PATTERN: /^[A-Za-z0-9][A-Za-z0-9._-]{2,19}$/,

    submitId() {
        const value = UI.el.idInput.value.trim();
        if (!this.ID_PATTERN.test(value)) {
            UI.showIdError(Lang.t('idInvalid'));
            return;
        }
        if (value !== this.patientId) this.resetReading(); // otra persona: no arrastrar su lectura
        this.patientId = value;
        UI.setPatient(value);
        UI.closeIdPrompt();
    },

    changeId() {
        UI.openIdPrompt({ canCancel: true, value: this.patientId });
    },

    // ---------- Registro ----------

    saveReading() {
        if (!this.patientId) { // sin ID no se guarda
            UI.openIdPrompt();
            return;
        }

        const { bpm, spo2, bpmDemo, spo2Demo } = this.last;
        const hasSpo2 = Number.isFinite(spo2) && spo2 > 0;

        if (!(bpm > 0) && !hasSpo2) {
            UI.toast(Lang.t('noReading'));
            return;
        }

        // Si cualquiera de los valores vino del demo, el registro queda marcado como demo
        const demo = (bpm > 0 && bpmDemo) || (hasSpo2 && spo2Demo);
        const rec = Records.add({ bpm, spo2, demo, pid: this.patientId });
        UI.toast(Lang.t(rec ? 'saved' : 'saveError'));
    },

    // Botón "Activar notificaciones" del aviso: pedir el permiso desde un toque del usuario
    async enableNotifications() {
        const permission = await Alerts.requestPermission();
        if (permission === 'granted') {
            UI.toast(Lang.t('notifEnabled'));
            // El aviso sigue activo: muestra ya la notificación que antes no pudo salir
            if (UI.alertState && Number.isFinite(this.last.spo2)) {
                UI.setAlertPhoneStatus(await Alerts.notifyPhone(this.last.spo2));
            }
        } else if (UI.alertState) {
            const status = permission === 'denied' ? 'denied' : permission === 'unsupported' ? 'unsupported' : 'default';
            UI.setAlertPhoneStatus({ status });
        }
    },

    deleteRecord(id) {
        Records.remove(id);
        UI.renderHistory();
        UI.toast(Lang.t('deleted'));
    },

    // Sin búsqueda borra todo el registro; con búsqueda, solo las lecturas que se ven
    clearRecords() {
        const query = UI.el.historySearch.value.trim();
        const items = Records.filter(query);
        if (!items.length) return;

        const message = query
            ? Lang.t('confirmClearFiltered').replace('{n}', items.length)
            : Lang.t('confirmClear');
        if (!confirm(message)) return;

        if (query) Records.removeMany(items.map(r => r.id));
        else Records.clear();

        UI.renderHistory();
        UI.toast(Lang.t('cleared'));
    },

    init() {
        // Módulos secundarios: si alguno falta o falla, el resto de la app sigue funcionando
        try {
            Records.load();
            Alerts.registerWorker();
        } catch (e) {
            console.error('Módulo secundario no disponible:', e);
        }
        UI.init();
        Graph.init(UI.el.canvas);

        // El permiso de notificación hay que pedirlo dentro de un clic del usuario
        UI.el.btnConnect.addEventListener('click', () => { Alerts.requestPermission(); BLE.connect(); });
        UI.el.btnDemo.addEventListener('click', () => { Alerts.requestPermission(); Demo.toggle(); });
        UI.el.scenarios.addEventListener('click', e => {
            const b = e.target.closest('[data-scenario]');
            if (b) Demo.setScenario(b.dataset.scenario);
        });

        UI.el.btnChangeId.addEventListener('click', () => this.changeId());
        UI.el.btnIdOk.addEventListener('click', () => this.submitId());
        UI.el.btnIdCancel.addEventListener('click', () => UI.closeIdPrompt());
        UI.el.idInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.submitId(); });

        UI.el.btnCloseAlert.addEventListener('click', () => UI.hideAlert());
        UI.el.btnEnableNotif.addEventListener('click', () => this.enableNotifications());

        UI.el.btnSave.addEventListener('click', () => this.saveReading());
        UI.el.btnHistory.addEventListener('click', () => UI.openHistory());
        UI.el.btnCloseHistory.addEventListener('click', () => UI.closeHistory());
        UI.el.historySearch.addEventListener('input', () => UI.renderHistory());
        UI.el.btnExport.addEventListener('click', () => UI.downloadCSV());
        UI.el.btnClear.addEventListener('click', () => this.clearRecords());
        UI.el.historyList.addEventListener('click', e => {
            const b = e.target.closest('[data-del]');
            if (b) this.deleteRecord(b.dataset.del);
        });

        UI.el.langSelect.addEventListener('change', e => {
            Lang.set(e.target.value);
            UI.applyLang();
        });

        UI.applyLang();                       // Aplica el idioma por defecto (es) al cargar
        UI.openIdPrompt({ canCancel: false }); // Lo primero: pedir el ID
    }
};

App.init();