// ===== Accesibilidad: lee la pantalla, los botones con foco y las alertas críticas =====
const Access = {
    on: false,
    lastRed: { spo2: 0, bpm: 0 },
    REPEAT_MS: 30000, // mientras siga en rojo, repite cada 30 s
    SKIP: '.demo-trigger, .scen, #btnA11y', // el demo sigue oculto
    T: {
        es: { lang: 'es-ES', on: 'Accesibilidad activada.', off: 'Accesibilidad desactivada.',
              id: 'Identificación', spo2: 'Oxígeno', bpm: 'Pulso', pct: 'por ciento',
              buttons: 'Botones', critical: 'Alerta crítica.', none: 'sin lectura' },
        en: { lang: 'en-US', on: 'Accessibility on.', off: 'Accessibility off.',
              id: 'ID', spo2: 'Oxygen', bpm: 'Pulse', pct: 'percent',
              buttons: 'Buttons', critical: 'Critical alert.', none: 'no reading' }
    },
    t() {
        const l = (typeof Lang !== 'undefined' && Lang.current) || 'es';
        return this.T[l] || this.T.es;
    },
    $(id) { return document.getElementById(id); },

    speak(text, urgent) {
        if (!('speechSynthesis' in window) || !text) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this.t().lang;
        speechSynthesis.speak(u);
    },

    label(el) {
        return el.getAttribute('aria-label') || el.title || el.placeholder ||
               (el.textContent || '').trim();
    },

    visibleButtons(root) {
        return [...root.querySelectorAll('button')]
            .filter(b => !b.hidden && b.getClientRects().length && !b.matches(this.SKIP))
            .map(b => this.label(b)).filter(Boolean);
    },

    spo2Number() {
        const m = (this.$('spo2Value').textContent || '').match(/\d+/);
        return m ? m[0] : null;
    },

    // Lee toda la pantalla visible
    readScreen() {
        const t = this.t();
        const parts = [];
        const banner = this.$('alertBanner');
        if (banner && !banner.hidden) {
            parts.push(this.$('alertTitle').textContent + '. ' + this.$('alertText').textContent);
        }
        const panel = ['idPanel', 'historyPanel'].map(i => this.$(i)).find(p => p && !p.hidden);
        if (panel) {
            parts.push(panel.innerText.replace(/\s+/g, ' ').slice(0, 300));
            parts.push(t.buttons + ': ' + this.visibleButtons(panel).join(', '));
        } else {
            const n = this.spo2Number();
            parts.push(this.$('title').textContent);
            parts.push(this.$('btnChangeId').textContent);
            parts.push(t.spo2 + ' ' + (n ? n + ' ' + t.pct : t.none));
            parts.push(t.bpm + ' ' + this.$('bpmValue').textContent);
            parts.push(t.buttons + ': ' + this.visibleButtons(document.querySelector('.main-container')).join(', '));
        }
        this.speak(parts.join('. '));
    },

    // Alerta crítica: se dice sola al entrar en rojo y se repite cada 30 s
    watchCritical(kind, el) {
        const check = () => {
            if (!this.on) return;
            if (!el.classList.contains('level-red')) { this.lastRed[kind] = 0; return; }
            const now = Date.now();
            if (now - this.lastRed[kind] < this.REPEAT_MS) return;
            this.lastRed[kind] = now;
            const t = this.t();
            const msg = kind === 'spo2'
                ? t.spo2 + ' ' + (this.spo2Number() || '') + ' ' + t.pct
                : t.bpm + ' ' + this.$('bpmValue').textContent;
            this.speak(t.critical + ' ' + msg);
        };
        new MutationObserver(check).observe(el, { attributes: true, attributeFilter: ['class'] });
    },

    toggle() {
        this.on = !this.on;
        const b = this.$('btnA11y');
        b.classList.toggle('on', this.on);
        b.setAttribute('aria-pressed', String(this.on));
        if (this.on) {
            this.speak(this.t().on);
            setTimeout(() => this.readScreen(), 1200);
        } else {
            this.speak(this.t().off);
        }
    },

    init() {
        this.$('btnA11y').addEventListener('click', () => this.toggle());
        // Lee el botón o campo que recibe el foco
        document.addEventListener('focusin', e => {
            const el = e.target;
            if (!this.on || !el.matches('button, input, select') || el.matches(this.SKIP)) return;
            this.speak(this.label(el));
        });
        this.watchCritical('spo2', document.querySelector('.spo2-circle'));
        this.watchCritical('bpm', document.querySelector('.bpm-card'));
    }
};
window.addEventListener('DOMContentLoaded', () => Access.init());
