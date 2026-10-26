// ===== Registro: guarda las lecturas en el navegador (localStorage) =====
// Los datos quedan en este celular/navegador; no se envían a ningún servidor.

const Records = {
    KEY: 'pulsoximetria.registros',
    MAX: 500, // máximo de lecturas guardadas; al pasarse se borran las más viejas
    items: [],

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            const data = raw ? JSON.parse(raw) : [];
            this.items = Array.isArray(data) ? data : [];
        } catch (e) {
            this.items = [];
        }
    },

    persist() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(this.items));
            return true;
        } catch (e) {
            console.error('No se pudo guardar el registro:', e);
            return false;
        }
    },

    // Agrega una lectura (la más nueva queda primero). Devuelve null si no se pudo guardar.
    add({ bpm, spo2, demo }) {
        const rec = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ts: Date.now(),
            bpm: bpm > 0 ? Math.round(bpm) : null,
            spo2: Number.isFinite(spo2) && spo2 > 0 ? Math.round(spo2) : null,
            demo: !!demo // las lecturas simuladas quedan marcadas para no confundirlas con reales
        };
        this.items.unshift(rec);
        if (this.items.length > this.MAX) this.items.length = this.MAX;

        if (!this.persist()) {
            this.items.shift();
            return null;
        }
        return rec;
    },

    remove(id) {
        this.items = this.items.filter(r => r.id !== id);
        this.persist();
    },

    clear() {
        this.items = [];
        this.persist();
    },

    // Texto CSV para abrir en Excel / Google Sheets (de la más vieja a la más nueva)
    toCSV() {
        const rows = [['fecha_hora', 'spo2', 'bpm', 'demo']];
        for (const r of [...this.items].reverse()) {
            rows.push([new Date(r.ts).toLocaleString('sv-SE'), r.spo2 ?? '', r.bpm ?? '', r.demo ? 'si' : 'no']);
        }
        return rows.map(r => r.join(',')).join('\n');
    }
};
