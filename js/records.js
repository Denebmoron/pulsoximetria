
// ===== Registro: guarda las lecturas en el navegador (localStorage) =====
// Los datos (incluido el ID de cada persona) quedan en este celular/navegador;
// no se envían a ningún servidor.
 
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
    // pid = ID / número de identificación de la persona.
    add({ bpm, spo2, demo, pid }) {
        const rec = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ts: Date.now(),
            pid: pid || '',
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
 
    // Busca por ID: coincide si el ID contiene el texto (sin distinguir mayúsculas).
    // Con la búsqueda vacía devuelve todo. Las lecturas viejas sin ID solo salen sin búsqueda.
    filter(query) {
        const q = (query || '').trim().toLowerCase();
        if (!q) return this.items;
        return this.items.filter(r => (r.pid || '').toLowerCase().includes(q));
    },
 
    remove(id) {
        this.items = this.items.filter(r => r.id !== id);
        this.persist();
    },
 
    removeMany(ids) {
        const set = new Set(ids);
        this.items = this.items.filter(r => !set.has(r.id));
        this.persist();
    },
 
    clear() {
        this.items = [];
        this.persist();
    },
 
    // Texto CSV para abrir en Excel / Google Sheets (de la más vieja a la más nueva)
    toCSV(items = this.items) {
        const rows = [['fecha_hora', 'id', 'spo2', 'bpm', 'demo']];
        for (const r of [...items].reverse()) {
            rows.push([new Date(r.ts).toLocaleString('sv-SE'), r.pid || '', r.spo2 ?? '', r.bpm ?? '', r.demo ? 'si' : 'no']);
        }
        return rows.map(r => r.join(',')).join('\n');
    }
};
 