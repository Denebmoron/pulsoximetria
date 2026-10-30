Claude




























Ui · JS
// ===== Interfaz: referencias al DOM y todo lo que se muestra en pantalla =====
 
const UI = {
    el: {},
    connState: 'idle', // idle | connecting | connected | error
    demoOn: false,
    patientId: '',     // ID que se muestra en la etiqueta de arriba
    toastTimer: null,
    alertState: null,  // { spo2, status, detail } mientras el aviso de alerta está visible
 
    // Guarda las referencias a los elementos de la página
    init() {
        const $ = id => document.getElementById(id);
        this.el = {
            title: $('title'),
            langSelect: $('langSelect'),
            btnChangeId: $('btnChangeId'),
            btnConnect: $('btnConnect'),
            btnDemo: $('btnDemo'),
            btnSave: $('btnSave'),
            btnHistory: $('btnHistory'),
            chartTitle: $('chartTitle'),
            bpm: $('bpmValue'),
            bpmCard: document.querySelector('.bpm-card'),
            spo2: $('spo2Value'),
            spo2Circle: document.querySelector('.spo2-circle'),
            canvas: $('plethCanvas'),
            scenarios: $('demoScenarios'),
            idPanel: $('idPanel'),
            idTitle: $('idTitle'),
            idHelp: $('idHelp'),
            idInput: $('idInput'),
            idError: $('idError'),
            btnIdOk: $('btnIdOk'),
            btnIdCancel: $('btnIdCancel'),
            historyPanel: $('historyPanel'),
            historyTitle: $('historyTitle'),
            historySearch: $('historySearch'),
            historyCount: $('historyCount'),
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
 
    // Quita los colores de semáforo de un elemento y le pone el del nivel indicado (o ninguno)
    setLevel(el, level) {
        el.classList.remove('level-green', 'level-yellow', 'level-red');
        if (level) el.classList.add('level-' + level);
    },
 
    // Muestra BPM y SpO2 (cada uno solo si llegó un valor válido), cada uno con su semáforo
    showReading(bpm, spo2) {
        if (bpm > 0) {
            this.el.bpm.textContent = bpm;
            this.setLevel(this.el.bpmCard, Alerts.levelForBpm(bpm)); // los umbrales viven en alerts.js
        }
 
        if (Number.isFinite(spo2) && spo2 > 0) {
            const pct = Math.min(100, Math.max(0, spo2));
            this.el.spo2.textContent = Math.round(spo2) + ' % SpO2';
            this.el.spo2Circle.style.setProperty('--pct', pct);
            this.setLevel(this.el.spo2Circle, Alerts.levelFor(spo2));
        }
    },
 
    // Deja la pantalla como al inicio (sin lectura, anillo vacío, sin colores)
    resetReading() {
        this.el.bpm.textContent = '0';
        this.el.spo2.textContent = '-- % SpO2';
        this.el.spo2Circle.style.setProperty('--pct', 0);
        this.setLevel(this.el.spo2Circle, null);
        this.setLevel(this.el.bpmCard, null);
        this.hideAlert();
    },
 
    // ---------- Identificación (ID) ----------
 
    // Muestra la etiqueta "ID: ..." de arriba
    setPatient(id) {
        this.patientId = id;
        this.el.btnChangeId.textContent = Lang.t('idChip').replace('{id}', id || '--');
    },
 
    // Abre la ventana que pide el ID. Al empezar no se puede cancelar; al cambiar de ID sí.
    openIdPrompt({ canCancel = false, value = '' } = {}) {
        this.el.idInput.value = value;
        this.el.idError.hidden = true;
        this.el.btnIdCancel.hidden = !canCancel;
        this.el.idPanel.hidden = false;
        setTimeout(() => this.el.idInput.focus(), 50);
    },
 
    closeIdPrompt() {
        this.el.idPanel.hidden = true;
        this.el.idInput.blur();
    },
 
    showIdError(message) {
        this.el.idError.textContent = message;
        this.el.idError.hidden = false;
    },
 
    // ---------- Botones de conexión y demo ----------
 
    // Cambia el estado del botón Conectar y lo repinta
    setConnState(state) {
        this.connState = state;
        this.renderConnectBtn();
    },
 
    // Activa/desactiva el aspecto de demo, bloquea Conectar y muestra los escenarios
    setDemoActive(on) {
        this.demoOn = on;
        this.el.btnConnect.disabled = on;
        this.el.scenarios.hidden = !on;
        this.renderDemoBtn();
    },
 
    // Marca cuál escenario del demo está activo
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
 
    // ---------- Aviso de alerta (SpO2 en rojo) ----------
 
    // Muestra el aviso en pantalla. El estado de la notificación del teléfono llega después.
    showAlert(spo2) {
        this.alertState = { spo2: Math.round(spo2), status: null, detail: '' };
        this.renderAlert();
        this.el.alertBanner.hidden = false;
    },
 
    // Si la notificación del teléfono no pudo salir, explica por qué dentro del aviso
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
        this.el.historySearch.value = '';
        this.renderHistory();
        this.el.historyPanel.hidden = false;
        document.body.style.overflow = 'hidden';
    },
 
    closeHistory() {
        this.el.historyPanel.hidden = true;
        document.body.style.overflow = '';
    },
 
    // Dibuja la lista agrupada por día (lo más nuevo arriba), filtrada por la búsqueda de ID
    renderHistory() {
        const list = this.el.historyList;
        list.textContent = '';
 
        const query = this.el.historySearch.value.trim();
        const items = Records.filter(query);
        const total = Records.items.length;
 
        this.el.historyEmpty.textContent = Lang.t(query ? 'emptySearch' : 'empty');
        this.el.historyEmpty.hidden = items.length > 0;
 
        this.el.historyCount.hidden = total === 0;
        this.el.historyCount.textContent = query
            ? Lang.t('countFiltered').replace('{n}', items.length).replace('{m}', total)
            : Lang.t('countAll').replace('{n}', total);
 
        // Con una búsqueda activa, "Borrar" solo borra lo que se ve (así no se borra todo por error)
        this.el.btnClear.textContent = query
            ? Lang.t('clearFiltered').replace('{n}', items.length)
            : Lang.t('clearAll');
        this.el.btnClear.disabled = items.length === 0;
 
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
 
    // Una fila: ID + hora arriba; SpO2 y BPM abajo, cada uno con el color de su semáforo
    buildRecordRow(r, d, locale) {
        const li = document.createElement('li');
        li.className = 'rec';
 
        const body = document.createElement('div');
        body.className = 'rec-body';
 
        const top = document.createElement('div');
        top.className = 'rec-top';
 
        const id = document.createElement('span');
        id.className = 'rec-id';
        id.textContent = r.pid ? 'ID ' + r.pid : Lang.t('noId');
 
        const time = document.createElement('span');
        time.className = 'rec-time';
        time.textContent = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
 
        top.append(id, time);
 
        if (r.demo) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = Lang.t('demoTag');
            top.append(tag);
        }
 
        const vals = document.createElement('div');
        vals.className = 'rec-vals';
 
        const spo2 = document.createElement('span');
        spo2.className = 'level-' + (r.spo2 != null ? Alerts.levelFor(r.spo2) : 'none');
        spo2.textContent = `${r.spo2 ?? '--'} % SpO2`;
 
        const bpm = document.createElement('span');
        bpm.className = 'level-' + (r.bpm != null ? Alerts.levelForBpm(r.bpm) : 'none');
        bpm.textContent = `${r.bpm ?? '--'} Bpm`;
 
        vals.append(spo2, document.createTextNode(' · '), bpm);
        body.append(top, vals);
 
        const del = document.createElement('button');
        del.className = 'icon-btn';
        del.textContent = '✕';
        del.dataset.del = r.id;
        del.setAttribute('aria-label', Lang.t('del'));
 
        li.append(body, del);
        return li;
    },
 
    // Descarga como CSV lo que se está viendo (con búsqueda activa, solo ese ID)
    downloadCSV() {
        const query = this.el.historySearch.value.trim();
        const items = Records.filter(query);
        if (!items.length) {
            this.toast(Lang.t('nothingToExport'));
            return;
        }
        const suffix = query ? '_' + query.replace(/[^A-Za-z0-9._-]/g, '') : '';
        const blob = new Blob([Records.toCSV(items)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registro_pulsoximetria' + suffix + '.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.toast(Lang.t('exported'));
    },
 
    // ---------- Idioma ----------
 
    // Repinta todos los textos según el idioma actual
    applyLang() {
        const t = k => Lang.t(k);
        this.el.title.textContent = t('title');
        this.el.btnSave.textContent = t('save');
        this.el.btnHistory.textContent = t('history');
        this.el.chartTitle.textContent = t('chart');
 
        this.el.idTitle.textContent = t('idTitle');
        this.el.idHelp.textContent = t('idHelp');
        this.el.idInput.placeholder = t('idPlaceholder');
        this.el.btnIdOk.textContent = t('idOk');
        this.el.btnIdCancel.textContent = t('idCancel');
        this.el.btnChangeId.setAttribute('aria-label', t('idChange'));
        this.setPatient(this.patientId);
 
        this.el.historyTitle.textContent = t('historyTitle');
        this.el.historySearch.placeholder = t('searchPlaceholder');
        this.el.historySearch.setAttribute('aria-label', t('searchPlaceholder'));
        this.el.btnExport.textContent = t('exportCsv');
        this.el.btnCloseHistory.setAttribute('aria-label', t('close'));
        this.el.btnCloseAlert.setAttribute('aria-label', t('close'));
 
        const scenKeys = { normal: 'scenNormal', caution: 'scenCaution', critical: 'scenCritical' };
        this.el.scenarios.querySelectorAll('[data-scenario]').forEach(b => {
            b.title = t(scenKeys[b.dataset.scenario]);
            b.setAttribute('aria-label', b.title);
        });
 
        this.renderConnectBtn();
        this.renderDemoBtn();
        this.renderAlert();
        this.renderHistory();
    }
};
 
