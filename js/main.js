// ===== Lógica Principal (App): coordina eventos, estado y acciones de // ===== Lógica Principal (App): coordina eventos, estado y acciones de la interfaz =====

const App = {
    currentId: '',

    init() {
        try {
            Records.load();
            Alerts.registerWorker();
        } catch (e) {
            console.error('Módulo secundario no disponible:', e);
        }

        UI.init();
        Graph.init(UI.el.canvas);

        // OBLIGATORIO: Pedir ID al arrancar siempre
        UI.openIdPrompt({ canCancel: false });

        // --- Eventos de Conexión y Demo ---
        UI.el.btnConnect.addEventListener('click', () => {
            Alerts.requestPermission();
            if (typeof BLE !== 'undefined') {
                BLE.connect();
            } else {
                console.error('El módulo BLE no está cargado');
            }
        });

        UI.el.btnDemo.addEventListener('click', () => {
            Alerts.requestPermission();
            Demo.toggle();
        });

        UI.el.scenarios.addEventListener('click', e => {
            const b = e.target.closest('[data-scenario]');
            if (b) Demo.setScenario(b.dataset.scenario);
        });

        // --- Eventos de Identificación (ID) ---
        UI.el.btnChangeId.addEventListener('click', () => UI.openIdPrompt({ canCancel: true, value: this.currentId }));
        UI.el.btnIdOk.addEventListener('click', () => this.submitId());
        UI.el.btnIdCancel.addEventListener('click', () => UI.closeIdPrompt());
        UI.el.idInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.submitId(); });

        // --- Eventos de Alertas y Notificaciones ---
        UI.el.btnCloseAlert.addEventListener('click', () => UI.hideAlert());
        UI.el.btnEnableNotif.addEventListener('click', () => this.enableNotifications());

        // --- Eventos de Registro e Historial ---
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

        // --- Idioma ---
        UI.el.langSelect.addEventListener('change', e => {
            Lang.set(e.target.value);
            UI.applyLang();
        });

        UI.applyLang();
    },

    submitId() {
        const val = UI.el.idInput.value.trim();
        if (!val || val.length > 20) {
            UI.showIdError(Lang.t('idInvalid') || 'El ID debe tener entre 1 y 20 caracteres');
            return;
        }
        this.currentId = val;
        localStorage.setItem('pulsoxi_current_id', val);
        UI.setPatient(val);
        UI.closeIdPrompt();
        UI.toast(Lang.t('saved') || 'ID Actualizado');
    },

    applyReading(bpm, spo2) {
        UI.showReading(bpm, spo2);
        Alerts.check(spo2);
    },

    saveReading() {
        if (!this.currentId) {
            UI.openIdPrompt({ canCancel: false });
            return;
        }

        const bpmText = UI.el.bpm.textContent;
        const spo2Text = UI.el.spo2.textContent;

        const bpm = parseInt(bpmText, 10);
        const spo2Match = spo2Text.match(/(\d+)/);
        const spo2 = spo2Match ? parseInt(spo2Match[1], 10) : NaN;

        if (isNaN(bpm) || isNaN(spo2) || bpm <= 0 || spo2 <= 0) {
            UI.toast(Lang.t('noReading'));
            return;
        }

        Records.add({
            pid: this.currentId,
            bpm: bpm,
            spo2: spo2,
            demo: UI.demoOn
        });

        UI.toast(Lang.t('saved'));
    },

    clearRecords() {
        const query = UI.el.historySearch.value.trim();
        if (query) {
            const items = Records.filter(query);
            const ids = items.map(r => r.id);
            if (confirm(Lang.t('confirmClearFiltered').replace('{n}', items.length))) {
                Records.removeMany(ids);
                UI.renderHistory();
            }
        } else {
            if (confirm(Lang.t('confirmClear'))) {
                Records.clear();
                UI.renderHistory();
            }
        }
    },

    deleteRecord(id) {
        Records.remove(id);
        UI.renderHistory();
    },

    enableNotifications() {
        Alerts.requestPermission().then(res => {
            UI.setAlertPhoneStatus(res);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => App.init()); interfaz =====

const App = {
    currentId: '',

    init() {
        try {
            Records.load();
            Alerts.registerWorker();
        } catch (e) {
            console.error('Módulo secundario no disponible:', e);
        }

        UI.init();
        Graph.init(UI.el.canvas);

        // Recuperar ID guardado previamente si existe
        const savedId = localStorage.getItem('pulsoxi_current_id');
        if (savedId) {
            this.currentId = savedId;
            UI.setPatient(savedId);
        } else {
            // Si no hay ID, abrir el panel de identificación de forma obligatoria al arrancar
            UI.openIdPrompt({ canCancel: false });
        }

        // --- Eventos de Conexión y Demo ---
        UI.el.btnConnect.addEventListener('click', () => {
            Alerts.requestPermission();
            if (typeof BLE !== 'undefined') {
                BLE.connect();
            } else {
                console.error('El módulo BLE no está cargado');
            }
        });

        UI.el.btnDemo.addEventListener('click', () => {
            Alerts.requestPermission();
            Demo.toggle();
        });

        UI.el.scenarios.addEventListener('click', e => {
            const b = e.target.closest('[data-scenario]');
            if (b) Demo.setScenario(b.dataset.scenario);
        });

        // --- Eventos de Identificación (ID) ---
        UI.el.btnChangeId.addEventListener('click', () => UI.openIdPrompt({ canCancel: true, value: this.currentId }));
        UI.el.btnIdOk.addEventListener('click', () => this.submitId());
        UI.el.btnIdCancel.addEventListener('click', () => UI.closeIdPrompt());
        UI.el.idInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.submitId(); });

        // --- Eventos de Alertas y Notificaciones ---
        UI.el.btnCloseAlert.addEventListener('click', () => UI.hideAlert());
        UI.el.btnEnableNotif.addEventListener('click', () => this.enableNotifications());

        // --- Eventos de Registro e Historial ---
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

        // --- Idioma ---
        UI.el.langSelect.addEventListener('change', e => {
            Lang.set(e.target.value);
            UI.applyLang();
        });

        UI.applyLang();
    },

    submitId() {
        const val = UI.el.idInput.value.trim();
        if (!val || val.length > 20) {
            UI.showIdError(Lang.t('idInvalid'));
            return;
        }
        this.currentId = val;
        localStorage.setItem('pulsoxi_current_id', val);
        UI.setPatient(val);
        UI.closeIdPrompt();
        UI.toast(Lang.t('saved') || 'ID Actualizado');
    },

    saveReading() {
        if (!this.currentId) {
            UI.openIdPrompt({ canCancel: false });
            return;
        }

        // Obtener valores actuales de la interfaz
        const bpmText = UI.el.bpm.textContent;
        const spo2Text = UI.el.spo2.textContent;

        const bpm = parseInt(bpmText, 10);
        const spo2Match = spo2Text.match(/(\d+)/);
        const spo2 = spo2Match ? parseInt(spo2Match[1], 10) : NaN;

        if (isNaN(bpm) || isNaN(spo2) || bpm <= 0 || spo2 <= 0) {
            UI.toast(Lang.t('noReading'));
            return;
        }

        Records.add({
            pid: this.currentId,
            bpm: bpm,
            spo2: spo2,
            demo: UI.demoOn
        });

        UI.toast(Lang.t('saved'));
    },

    clearRecords() {
        const query = UI.el.historySearch.value.trim();
        if (query) {
            const items = Records.filter(query);
            const ids = items.map(r => r.id);
            if (confirm(Lang.t('confirmClearFiltered').replace('{n}', items.length))) {
                Records.removeMany(ids);
                UI.renderHistory();
            }
        } else {
            if (confirm(Lang.t('confirmClear'))) {
                Records.clear();
                UI.renderHistory();
            }
        }
    },

    deleteRecord(id) {
        Records.remove(id);
        UI.renderHistory();
    },

    enableNotifications() {
        Alerts.requestPermission().then(res => {
            UI.setAlertPhoneStatus(res);
        });
    }
};

// Arrancar la aplicación cuando cargue la página
window.addEventListener('DOMContentLoaded', () => App.init());