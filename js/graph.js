// ===== Gráfica pletismográfica: canvas tipo osciloscopio =====

const Graph = {
    canvas: null,
    ctx: null,
    xPos: 0,
    lastY: 0,
    minValue: 999999,
    maxValue: -999999,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastY = canvas.height / 2;
        this.xPos = 0;
    },

    // Método puente para que demo.js y BLE puedan usar .add()
    add(irValue) {
        this.draw(irValue);
    },

    // Dibuja un segmento por cada muestra IR que llega
    draw(irValue) {
        const { canvas, ctx } = this;
        if (!canvas || !ctx) return;

        // Auto-escala dinámica simple para adaptar cualquier rango de sensor o demo
        if (irValue < this.minValue) this.minValue = irValue;
        if (irValue > this.maxValue) this.maxValue = irValue;
        
        // Si el rango es muy angosto, evitamos división por cero
        let range = this.maxValue - this.minValue;
        if (range < 10) range = 1000;

        // Mapear el valor invertido (en canvas el eje Y 0 está arriba)
        const normalized = (irValue - this.minValue) / range;
        const mappedY = canvas.height - (normalized * (canvas.height - 20) + 10);

        ctx.beginPath();
        ctx.moveTo(this.xPos - 2, this.lastY);
        ctx.lineTo(this.xPos, mappedY);
        ctx.strokeStyle = '#00e5ff'; // Cyan neón
        ctx.lineWidth = 2;
        ctx.stroke();

        this.lastY = mappedY;
        this.xPos += 2;

        // Borrar pantalla y reiniciar al llegar al borde derecho
        if (this.xPos >= canvas.width) {
            this.xPos = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Opcional: resetear min/max periódicamente para re-calibrar el zoom dinámico
            this.minValue = 999999;
            this.maxValue = -999999;
        }
    }
};