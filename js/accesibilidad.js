// ===== Accesibilidad: lee la pantalla, identificación, botones con foco y lectura cada 30 s =====
const Access = {
    on: false,

    PERIODIC_MS: 30000,   // Lectura periódica completa cada 30 segundos cuando está activo
    RED_REPEAT_MS: 30000, // Repetición de alerta crítica cada 30 segundos

    SKIP: '.demo-trigger, .scen, #btnA11y',

    // Posibles IDs/clases para identificación de paciente/dispositivo y estado
    ID_SELECTORS: ['#patientId', '#patient-id', '#idValue', '#deviceId', '[data-patient-id]'],
    STATUS_SELECTOR: '#connectionStatus, #bleStatus, .status-text',

    st: {
        spo2: { val: null, level: null, lastRed: 0 },
        bpm:  { val: null, level: null, lastRed: 0 },
        lastPeriodic: 0
    },

    T: {
        es: {
            lang: 'es-ES',
            on: 'Accesibilidad activada. Lectura cada 30 segundos.',
            off: 'Accesibilidad desactivada.',
            idLabel: 'Identificación',
            noId: 'sin identificación',
            statusLabel: 'Estado',
            spo2: 'Oxígeno',
            bpm: 'Pulso',
            pct: 'por ciento',
            unit: 'latidos por minuto',
            buttons: 'Botones',
            critical: 'Alerta crítica.',
            none: 'sin lectura',
            level: { green: 'normal', yellow: 'precaución', red: 'crítico' }
        },
        en: {
            lang: 'en-US',
            on: 'Accessibility on. Reading every 30 seconds.',
            off: 'Accessibility off.',
            idLabel: 'Identification',
            noId: 'no ID',
            statusLabel: 'Status',
            spo2: 'Oxygen',
            bpm: 'Pulse',
            pct: 'percent',
            unit: 'beats per minute',
            buttons: 'Buttons',
            critical: 'Critical alert.',
            none: 'no reading',
            level: { green: 'normal', yellow: 'caution', red: 'critical' }
        }
    },

    t() {
        const l = (typeof Lang !== 'undefined' && Lang.current) || 'es';
        return this.T[l] || this.T.es;
    },

    $(id) {
        return document.getElementById(id);
    },

    speak(text, interrupt = true) {
        if (!('speechSynthesis' in window) || !text) return;
        if (interrupt) speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this.t().lang;
        speechSynthesis.speak(u);
    },

    label(el) {
        if (!el) return '';
        return (
            el.getAttribute('aria-label') ||
            el.title ||
            el.placeholder ||
            (el.textContent || '').replace(/\s+/g, ' ').trim()
        );
    },

    visibleButtons(root) {
        if (!root) return [];
        return [...root.querySelectorAll('button')]
            .filter(b => !b.hidden && b.getClientRects().length && !b.matches(this.SKIP))
            .map(b => this.label(b))
            .filter(Boolean);
    },

    // ---------- Identificación y estado ----------

    getIdentification() {
        const t = this.t();
        for (const sel of this.ID_SELECTORS) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const raw = (el.value !== undefined && el.tagName === 'INPUT'
                ? el.value
                : el.textContent || ''
            ).replace(/\s+/g, ' ').trim();
            if (raw && raw !== '--' && raw !== '-') {
                return `${t.idLabel} ${raw}`;
            }
        }

        const btnId = this.$('btnChangeId');
        if (btnId) {
            const txt = this.label(btnId);
            if (txt) return `${t.idLabel}: ${txt}`;
        }

        return `${t.idLabel} ${t.noId}`;
    },

    getStatusText() {
        const t = this.t();
        const el = document.querySelector(this.STATUS_SELECTOR);
        if (!el) return '';
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return txt ? `${t.statusLabel}: ${txt}` : '';
    },

    // ---------- Lecturas de SpO2 y BPM ----------

    spo2Number() {
        const el = this.$('spo2Value');
        if (!el) return null;
        const m = (el.textContent || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
    },

    bpmNumber() {
        const el = this.$('bpmValue');
        if (!el) return null;
        const m = (el.textContent || '').match(/\d+/);
        const n = m ? parseInt(m[0], 10) : NaN;
        return n > 0 ? n : null;
    },

    levelOf(el) {
        if (!el) return null;
        const target = el.closest('.spo2-circle, .bpm-card, [class*="level-"]') || el;
        for (const l of ['red', 'yellow', 'green']) {
            if (
                target.classList.contains('level-' + l) ||
                el.classList.contains('level-' + l) ||
                target.dataset.level === l
            ) {
                return l;
            }
        }
        return null;
    },

    phrase(kind, val, level) {
        const t = this.t();
        const base = kind === 'spo2'
            ? `${t.spo2} ${val} ${t.pct}`
            : `${t.bpm} ${val} ${t.unit}`;
        return level ? `${base}, ${t.level[level]}` : base;
    },

    buildVitalsSummary() {
        const t = this.t();
        const s = this.spo2Number();
        const b = this.bpmNumber();
        const spo2Text = s != null
            ? this.phrase('spo2', s, this.levelOf(document.querySelector('.spo2-circle') || this.$('spo2Value')))
            : `${t.spo2} ${t.none}`;
        const bpmText = b != null
            ? this.phrase('bpm', b, this.levelOf(document.querySelector('.bpm-card') || this.$('bpmValue')))
            : `${t.bpm} ${t.none}`;
        return `${spo2Text}. ${bpmText}`;
    },

    // ---------- Lectura completa y lectura periódica cada 30 s ----------

    readScreen(includeButtons = true) {
        const t = this.t();
        const parts = [];

        const banner = this.$('alertBanner');
        if (banner && !banner.hidden) {
            const title = (this.$('alertTitle')?.textContent || '').trim();
            const body = (this.$('alertText')?.textContent || '').trim();
            if (title || body) parts.push(`${title}. ${body}`.trim());
        }

        const titleEl = this.$('title');
        if (titleEl && titleEl.textContent.trim()) {
            parts.push(titleEl.textContent.trim());
        }

        parts.push(this.getIdentification());

        const status = this.getStatusText();
        if (status) parts.push(status);

        const panel = ['idPanel', 'historyPanel'].map(i => this.$(i)).find(p => p && !p.hidden);
        if (panel) {
            const panelText = (panel.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 260);
            if (panelText) parts.push(panelText);
            if (includeButtons) {
                const btns = this.visibleButtons(panel);
                if (btns.length) parts.push(`${t.buttons}: ${btns.join(', ')}`);
            }
        } else {
            parts.push(this.buildVitalsSummary());
            if (includeButtons) {
                const container = document.querySelector('.main-container') || document.body;
                const btns = this.visibleButtons(container);
                if (btns.length) parts.push(`${t.buttons}: ${btns.join(', ')}`);
            }
        }

        this.speak(parts.filter(Boolean).join('. '));
    },

    periodicTick() {
        const now = Date.now();

        // Actualiza estados de SpO2 y BPM y avisa si entran en nivel crítico (incluso con voz apagada)
        for (const kind of ['spo2', 'bpm']) {
            const stKind = this.st[kind];
            const el = document.querySelector(kind === 'spo2' ? '.spo2-circle' : '.bpm-card');
            const val = kind === 'spo2' ? this.spo2Number() : this.bpmNumber();
            const level = this.levelOf(el);
            const prevLevel = stKind.level;

            stKind.val = val;
            stKind.level = level;

            if (val && level === 'red') {
                if (prevLevel !== 'red' || now - stKind.lastRed >= this.RED_REPEAT_MS) {
                    stKind.lastRed = now;
                    this.speak(`${this.t().critical} ${this.phrase(kind, val, 'red')}`);
                    return;
                }
            } else {
                stKind.lastRed = 0;
            }
        }

        // Si el modo accesibilidad está encendido, lee identificación y valores cada 30 s
        if (!this.on) return;
        if (now - this.st.lastPeriodic >= this.PERIODIC_MS) {
            this.st.lastPeriodic = now;
            const summary = `${this.getIdentification()}. ${this.buildVitalsSummary()}`;
            this.speak(summary);
        }
    },

    toggle() {
        this.on = !this.on;
        const b = this.$('btnA11y');
        if (b) {
            b.classList.toggle('on', this.on);
            b.setAttribute('aria-pressed', String(this.on));
        }

        if (this.on) {
            this.st.lastPeriodic = Date.now();
            this.speak(this.t().on);
            setTimeout(() => this.readScreen(true), 900);
        } else {
            speechSynthesis.cancel();
            this.speak(this.t().off);
        }
    },

    init() {
        const btn = this.$('btnA11y');
        if (btn) btn.addEventListener('click', () => this.toggle());

        document.addEventListener('focusin', e => {
            const el = e.target;
            if (!this.on || !el.matches('button, input, select') || el.matches(this.SKIP)) return;
            this.speak(this.label(el));
        });

        // Revisa cada 5 s para alertas críticas en rojo y cada 30 s para lectura periódica
        setInterval(() => this.periodicTick(), 5000);
    }
};

window.addEventListener('DOMContentLoaded', () => Access.init());
