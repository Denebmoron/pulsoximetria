// ===== Interfaz: referencias al DOM y todo lo que se muestra en pantalla =====

const UI = {
    el: {},
    connState: 'idle', // idle | connecting | connected | error
    demoOn: false,
    toastTimer: null,
    alertState: null, // { spo2, status, detail } mientras el aviso de alerta está visible
    patientId: 'Sin ID',

    // Solicita el ID al inicializar o arrancar
    askPatientId() {
        this.patientId = prompt("Ingrese la cédula o ID del paciente:") || "Sin ID";
    },

    // Guarda las referencias a los elementos de la página
    init() {
        const $ = id => document.getElementById(id);
        this.el = {
            title: $('title'),
            langSelect: $('langSelect'),
            btnConnect: $('btnConnect'),
            btnDemo: $('btnDemo'),
            btnSave: $('btnSave'),
            btnHistory: $('btnHistory'),
            chartTitle: $('chartTitle'),
            bpm: $('bpmValue'),
            spo2: $('spo2Value'),
            spo2Circle: document.querySelector('.spo2-circle'),
            bpmCard: document.querySelector('.bpm-card'), // Referencia a la tarjeta BPM para los colores
            canvas: $('plethCanvas'),
            scenarios: $('demoScenarios'),
            historyPanel: $('historyPanel'),
            historyTitle: $('historyTitle'),
            historyList: $('historyList'),
            historyEmpty: $('historyEmpty'),
            btnCloseHistory: $('btnCloseHistory'),
            btnExport: $('btnExport'),
            btnClear: $('btnClear'),
            toast: $('toast'),
            alertBanner: $('alertBanner'),
            alertTitle: $('alertTitle'),
            alertText: $('alertText'),
            alertHint: $('alertHint'),
            alertHintText: $('alertHintText'),
            btnCloseAlert: $('btnCloseAlert'),
            btnEnableNotif: $('btnEnableNotif')
        };
    },

    // ---------- Lectura en vivo ----------

    // Muestra BPM y SpO2, aplicando colores de alerta también al BPM (ej. rojo si >= 110 lpm)
    showReading(bpm, spo2) {
        if (bpm > 0) {
            this.el.bpm.textContent = bpm;
            
            // Lógica de colores para el BPM (Tarjeta de frecuencia cardíaca)
            // Normal: 60-100, Precaución: 50-59 o 101-109, Crítico/Rojo: <50 o >=110
            let bpmLevel = 'green';
            if (bpm < 50 || bpm >= 110) {
                bpmLevel = 'red';
            } else if (bpm < 60 || bpm > 100) {
                bpmLevel = 'yellow';
            }
            
            if (this.el.bpmCard) {
                this.el.bpmCard.classList.remove('level-green', 'level-yellow', 'level-orange', 'level-red');
                this.el.bpmCard.classList.add('level-' + bpmLevel);
            }
        }

        if (Number.isFinite(spo2) && spo2 > 0) {
            const pct = Math.min(100, Math.max(0, spo2));
            this.el.spo2.textContent = Math.round(spo2) + ' % SpO2';
            this.el.spo2Circle.style.setProperty('--pct', pct);

            const level = Alerts.levelFor(spo2); // los umbrales viven en alerts.js
            this.el.spo2Circle.classList.remove('level-green', 'level-yellow', 'level-orange', 'level-red');
            this.el.spo2Circle.classList.add('level-' + level);
        }
    },

    // Deja la pantalla como al inicio (sin lectura, anillo y tarjeta limpios)
    resetReading() {
        this.el.bpm.textContent = '0';
        this.el.spo2.textContent = '-- % SpO2';
        this.el.spo2Circle.style.setProperty('--pct', 0);
        this.el.spo2Circle.classList.remove('level-green', 'level-yellow', 'level-orange', 'level-red');
        if (this.el.bpmCard) {
            this.el.bpmCard.classList.remove('level-green', 'level-yellow', 'level-orange', 'level-red');
        }
        this.hideAlert();
    },

    // ---------- Botones de conexión y demo ----------

    setConnState(state) {
        this.connState = state;
        this.renderConnectBtn();
    },

    setDemoActive(on) {
        this.demoOn = on;
        this.el.btnConnect.disabled = on;
        this.el.scenarios.hidden = !on;
        this.renderDemoBtn();
    },

    setScenario(name) {
        this.el.scenarios.querySelectorAll('[data-scenario]').forEach(b => {
            b.classList.toggle('active', b.dataset.scenario === name);
        });
    },

    renderConnectBtn() {
        const keys = { idle: 'connect', connecting: 'connecting', connected: 'connected', error: 'error' };
        this.el.btnConnect.textContent = Lang.t(keys[this.connState]);
        this.el.btnConnect.style.backgroundColor = this.connState === 'connected' ? '#00FF00' : '';
    },

    renderDemoBtn() {
        const label = Lang.t(this.demoOn ? 'stopDemo' : 'startDemo');
        this.el.btnDemo.classList.toggle('active', this.demoOn);
        this.el.btnDemo.title = label;
        this.el.btnDemo.setAttribute('aria-label', label);
    },

    // ---------- Aviso breve en pantalla ----------

    toast(message) {
        const t = this.el.toast;
        t.textContent = message;
        t.classList.add('show');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    },

    // ---------- Aviso de alerta ----------

    showAlert(spo2) {
        this.alertState = { spo2: Math.round(spo2), status: null, detail: '' };
        this.renderAlert();
        this.el.alertBanner.hidden = false;
    },

    setAlertPhoneStatus(result) {
        if (!this.alertState) return;
        this.alertState.status = result.status;
        this.alertState.detail = result.detail || '';
        this.renderAlert();
    },

    hideAlert() {
        this.alertState = null;
        this.el.alertBanner.hidden = true;
    },

    renderAlert() {
        const s = this.alertState;
        if (!s) return;

        this.el.alertTitle.textContent = Lang.t('alertTitle');
        this.el.alertText.textContent = Lang.t('alertBody').replace('{n}', s.spo2);

        const hints = { unsupported: 'notifUnsupported', denied: 'notifBlocked', default: 'notifDefault', noworker: 'notifNoWorker', error: 'notifError' };
        const key = hints[s.status];
        this.el.alertHint.hidden = !key;
        if (key) this.el.alertHintText.textContent = Lang.t(key) + (s.detail ? ' (' + s.detail + ')' : '');

        this.el.btnEnableNotif.hidden = s.status !== 'default';
        this.el.btnEnableNotif.textContent = Lang.t('enableNotif');
    },

    // ---------- Panel de registro ----------

    openHistory() {
        this.renderHistory();
        this.el.historyPanel.hidden = false;
        document.body.style.overflow = 'hidden';
    },

    closeHistory() {
        this.el.historyPanel.hidden = true;
        document.body.style.overflow = '';
    },

    renderHistory() {
        const list = this.el.historyList;
        list.textContent = '';

        const items = Records.items;
        this.el.historyEmpty.hidden = items.length > 0;

        const locale = Lang.current;
        let lastDay = '';
        for (const r of items) {
            const d = new Date(r.ts);
            const dayKey = d.toDateString();

            if (dayKey !== lastDay) {
                const title = document.createElement('li');
                title.className = 'day-title';
                title.textContent = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
                list.appendChild(title);
                lastDay = dayKey;
            }
            list.appendChild(this.buildRecordRow(r, d, locale));
        }
    },

    buildRecordRow(r, d, locale) {
        const li = document.createElement('li');
        li.className = 'rec';

        const dot = document.createElement('span');
        dot.className = 'dot level-' + (r.spo2 != null ? Alerts.levelFor(r.spo2) : 'none');

        const time = document.createElement('span');
        time.className = 'rec-time';
        time.textContent = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

        const vals = document.createElement('span');
        vals.className = 'rec-vals';
        // Incluimos el ID del paciente en la visualización del registro si existe
        const idText = r.patientId ? ` [ID: ${r.patientId}]` : '';
        vals.textContent = `${r.spo2 ?? '--'} % SpO2 · ${r.bpm ?? '--'} Bpm${idText}`;

        li.append(dot, time, vals);

        if (r.demo) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = Lang.t('demoTag');
            li.append(tag);
        }

        const del = document.createElement('button');
        del.className = 'icon-btn';
        del.textContent = '✕';
        del.dataset.del = r.id;
        del.setAttribute('aria-label', Lang.t('del'));
        li.append(del);

        return li;
    },

    downloadCSV() {
        if (!Records.items.length) {
            this.toast(Lang.t('nothingToExport'));
            return;
        }
        const blob = new Blob([Records.toCSV()], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registro_pulsoximetria.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.toast(Lang.t('exported'));
    },

    applyLang() {
        const t = k => Lang.t(k);
        this.el.title.textContent = t('title');
        this.el.btnSave.textContent = t('save');
        this.el.btnHistory.textContent = t('history');
        this.el.chartTitle.textContent = t('chart');
        this.el.historyTitle.textContent = t('historyTitle');
        this.el.historyEmpty.textContent = t('empty');
        this.el.btnExport.textContent = t('exportCsv');
        this.el.btnClear.textContent = t('clearAll');
        this.el.btnCloseHistory.setAttribute('aria-label', t('close'));
        this.el.btnCloseAlert.setAttribute('aria-label', t('close'));

        const scenKeys = { normal: 'scenNormal', caution: 'scenCaution', borderline: 'scenBorderline', critical: 'scenCritical', severe: 'scenSevere' };
        this.el.scenarios.querySelectorAll('[data-scenario]').forEach(b => {
            if (scenKeys[b.dataset.scenario]) {
                b.title = t(scenKeys[b.dataset.scenario]);
                b.setAttribute('aria-label', b.title);
            }
        });

        this.renderConnectBtn();
        this.renderDemoBtn();
        this.renderAlert();
        if (!this.el.historyPanel.hidden) this.renderHistory();
    }
};