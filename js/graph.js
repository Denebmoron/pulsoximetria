// ===== Gráfica pletismográfica: canvas tipo osciloscopio =====

const Graph = {
    canvas: null,
    ctx: null,
    xPos: 0,
    lastY: 0,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastY = canvas.height / 2;
    },

    // Mapea un valor de un rango a otro
    mapValue(x, inMin, inMax, outMin, outMax) {
        return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    // Dibuja un segmento por cada muestra IR que llega
    draw(irValue) {
        const { canvas, ctx } = this;

        // Mapear el valor IR para que encaje en el canvas (ajustar según el ruido del sensor)
        // Se asume un delta simulado para el efecto visual, ya que el IR crudo es muy alto
        const mappedY = this.mapValue(irValue % 1000, 0, 1000, canvas.height, 0);

        ctx.beginPath();
        ctx.moveTo(this.xPos - 2, this.lastY);
        ctx.lineTo(this.xPos, mappedY);
        ctx.strokeStyle = '#00e5ff'; // Cyan neón
        ctx.lineWidth = 2;
        ctx.stroke();

        this.lastY = mappedY;
        this.xPos += 2;

        // Borrar pantalla al llegar al borde derecho
        if (this.xPos >= canvas.width) {
            this.xPos = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
};
