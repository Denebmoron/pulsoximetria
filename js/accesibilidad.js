// ===== Accesibilidad: lee la pantalla, los botones con foco y los cambios de lectura =====
const Access = {
    on: false,

    // Cuánto debe cambiar un valor para que se lea de nuevo
    SPO2_STEP: 2,        // puntos de SpO2
    BPM_STEP: 3,         // latidos por minuto
    MIN_GAP_MS: 3000,    // mínimo entre avisos de "cambió el valor" (los cambios de nivel no esperan)
    RED_REPEAT_MS: 30000, // mientras siga en rojo, se repite cada 30 s

    SKIP: '.demo-trigger, .scen, #btnA11y', // el demo sigue oculto

    // Estado de cada medida: último valor leído, nivel y cuándo se avisó
    st: {
        spo2: { val: null, level: null, spokenVal: null, lastSpeech: 0, lastRed: 0 },
        bpm:  { val: null, level: null, spokenVal: null, lastSpeech: 0, lastRed: 0 }
    },

    T: {
        es: { lang: 'es-ES', on: 'Accesibilidad activada.', off: 'Accesibilidad desactivada.',
              spo2: 'Oxígeno', bpm: 'Pulso', pct: 'por ciento', unit: 'latidos por minuto',
              buttons: 'Botones', critical: 'Alerta crítica.', none: 'sin lectura',
              level: { green: 'normal', yellow: 'precaución', red: 'crítico' } },
        en: { lang: 'en-US', on: 'Accessibility on.', off: 'Accessibility off.',
              spo2: 'Oxygen', bpm: 'Pulse', pct: 'percent', unit: 'beats per minute',
              buttons: 'Buttons', critical: 'Critical alert.', none: 'no reading',
              level: { green: 'normal', yellow: 'caution', red: 'critical' } }
    },
    t() {
        const l = (typeof Lang !== 'undefined' && Lang.current) || 'es';
        return this.T[l] || this.T.es;
    },
    $(id) { return document.getElementById(id); },

    speak(text) {
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

    // ---------- Lecturas actuales ----------

    spo2Number() {
        const m = (this.$('spo2Value').textContent || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
    },
    bpmNumber() {
        const n = parseInt(this.$('bpmValue').textContent, 10);
        return n > 0 ? n : null;
    },
    levelOf(el) {
        if (!el) return null;
        for (const l of ['red', 'yellow', 'green']) {
            if (el.classList.contains('level-' + l)) return l;
        }
        return null;
    },
    phrase(kind, val, level) {
        const t = this.t();
        const base = kind === 'spo2'
            ? t.spo2 + ' ' + val + ' ' + t.pct
            : t.bpm + ' ' + val + ' ' + t.unit;
        return level ? base + ', ' + t.level[level] : base;
    },

    // ---------- Leer toda la pantalla ----------

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
            const s = this.spo2Number(), b = this.bpmNumber();
            parts.push(this.$('title').textContent);
            parts.push(this.$('btnChangeId').textContent);
            parts.push(s ? this.phrase('spo2', s, this.levelOf(document.querySelector('.spo2-circle')))
                         : t.spo2 + ' ' + t.none);
            parts.push(b ? this.phrase('bpm', b, this.levelOf(document.querySelector('.bpm-card')))
                         : t.bpm + ' ' + t.none);
            parts.push(t.buttons + ': ' + this.visibleButtons(document.querySelector('.main-container')).join(', '));
        }
        this.speak(parts.join('. '));
    },

    // ---------- Cambios de lectura ----------
    // Reglas:
    //  - Cambio de nivel (normal <-> precaución <-> crítico, en cualquier sentido): se lee siempre.
    //  - Entrar en crítico: se dice SIEMPRE, aunque el ♿ esté apagado.
    //  - Cambio de valor de SpO2 >= 2 puntos o BPM >= 3: se lee (solo con ♿ activado).
    //  - Mientras siga en crítico se repite cada 30 s (también con ♿ apagado).
    onReading(kind) {
        const s = this.st[kind];
        const el = document.querySelector(kind === 'spo2' ? '.spo2-circle' : '.bpm-card');
        const val = kind === 'spo2' ? this.spo2Number() : this.bpmNumber();
        const level = this.levelOf(el);
        const now = Date.now();

        // Sin lectura: se reinicia y no se dice nada
        if (!val) {
            s.val = s.level = s.spokenVal = null;
            s.lastRed = 0;
            return;
        }

        const prevLevel = s.level;
        const prevVal = s.val;
        s.val = val;
        s.level = level;

        const levelChanged = level && prevLevel !== level;
        const step = kind === 'spo2' ? this.SPO2_STEP : this.BPM_STEP;
        const movedEnough = s.spokenVal != null && Math.abs(val - s.spokenVal) >= step;
        const isRed = level === 'red';

        // 1) Cambio de nivel
        if (levelChanged && (this.on || isRed)) {
            const t = this.t();
            this.speak((isRed ? t.critical + ' ' : '') + this.phrase(kind, val, level));
            s.spokenVal = val;
            s.lastSpeech = now;
            if (isRed) s.lastRed = now;
            return;
        }

        // 2) Cambio de valor de 2 o 3 puntos
        if (this.on && movedEnough && now - s.lastSpeech >= this.MIN_GAP_MS) {
            this.speak(this.phrase(kind, val, level));
            s.spokenVal = val;
            s.lastSpeech = now;
            return;
        }

        // Primera lectura con ♿ activado: se guarda como referencia
        if (s.spokenVal == null && prevVal == null && this.on) {
            this.speak(this.phrase(kind, val, level));
            s.spokenVal = val;
            s.lastSpeech = now;
        }
    },

    // Repite la alerta crítica cada 30 s mientras siga en rojo
    repeatRed() {
        const now = Date.now();
        for (const kind of ['spo2', 'bpm']) {
            const s = this.st[kind];
            if (s.level !== 'red' || !s.val) { s.lastRed = 0; continue; }
            if (now - s.lastRed < this.RED_REPEAT_MS) continue;
            s.lastRed = now;
            this.speak(this.t().critical + ' ' + this.phrase(kind, s.val, 'red'));
            s.spokenVal = s.val;
            s.lastSpeech = now;
            break; // un aviso a la vez
        }
    },

    watch(kind, el) {
        if (!el) return;
        const run = () => this.onReading(kind);
        // Cambia el texto del número o cambia el color (nivel)
        new MutationObserver(run).observe(el, { childList: true, characterData: true, subtree: true });
        const card = document.querySelector(kind === 'spo2' ? '.spo2-circle' : '.bpm-card');
        if (card) new MutationObserver(run).observe(card, { attributes: true, attributeFilter: ['class'] });
    },

    toggle() {
        this.on = !this.on;
        const b = this.$('btnA11y');
        b.classList.toggle('on', this.on);
        b.setAttribute('aria-pressed', String(this.on));
        if (this.on) {
            // Lo que ya está en pantalla se lee con "leer pantalla", no se repite como cambio
            this.st.spo2.spokenVal = this.st.spo2.val;
            this.st.bpm.spokenVal = this.st.bpm.val;
            this.speak(this.t().on);
            setTimeout(() => this.readScreen(), 1200);
        } else {
            this.speak(this.t().off);
        }
    },

    init() {
        this.$('btnA11y').addEventListener('click', () => this.toggle());

        // Lee el botón o campo que recibe el foco (solo con ♿ activado)
        document.addEventListener('focusin', e => {
            const el = e.target;
            if (!this.on || !el.matches('button, input, select') || el.matches(this.SKIP)) return;
            this.speak(this.label(el));
        });

        this.watch('spo2', this.$('spo2Value'));
        this.watch('bpm', this.$('bpmValue'));
        setInterval(() => this.repeatRed(), 5000);
    }
};
window.addEventListener('DOMContentLoaded', () => Access.init());
