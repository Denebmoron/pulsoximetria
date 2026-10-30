// ===== Registro: guarda, filtra y exporta las lecturas de los pacientes =====

const Records = {
    items: [],

    // Carga los registros guardados en el almacenamiento local del navegador
    load() {
        try {
            const data = localStorage.getItem('pulsoxi_records');
            this.items = data ? JSON.parse(data) : [];
        } catch (e) {
            this.items = [];
        }
    },

    // Guarda los registros actuales en el almacenamiento local
    save() {
        try {
            localStorage.setItem('pulsoxi_records', JSON.stringify(this.items));
        } catch (e) {
            console.error('No se pudo guardar en localStorage:', e);
        }
    },

    // Agrega una nueva lectura al inicio del arreglo
    add(record) {
        const newRec = {
            id: 'rec_' + Math.random().toString(36).substr(2, 9),
            ts: Date.now(),
            ...record
        };
        this.items.unshift(newRec); // Lo más nuevo arriba
        this.save();
        return newRec;
    },

    // Elimina una lectura específica por su ID
    remove(id) {
        this.items = this.items.filter(r => r.id !== id);
        this.save();
    },

    // Filtra las lecturas según el ID del paciente introducido en la búsqueda
    filter(query) {
        if (!query) return this.items;
        const q = query.toLowerCase();
        return this.items.filter(r => String(r.pid || '').toLowerCase().includes(q));
    },

    // Elimina múltiples registros a la vez (útil al borrar resultados filtrados)
    removeMany(ids) {
        const idSet = new Set(ids);
        this.items = this.items.filter(r => !idSet.has(r.id));
        this.save();
    },

    // Borra todo el historial
    clear() {
        this.items = [];
        this.save();
    },

    // Genera el formato CSV para exportar los datos (compatible con Excel)
    toCSV(itemsToExport = this.items) {
        let csv = 'Fecha,ID,BPM,SpO2,Modo\n';
        for (const r of itemsToExport) {
            const date = new Date(r.ts).toISOString();
            const mode = r.demo ? 'Demo' : 'Real';
            csv += `"${date}","${r.pid || 'Sin ID'}",${r.bpm ?? ''},${r.spo2 ?? ''},"${mode}"\n`;
        }
        return csv;
    }
};