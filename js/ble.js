// ===== Bluetooth: conexión directa con el ESP32-S3 por nombre =====

const BLE = {
    device: null,
    characteristic: null,

    // Corregida la comilla extra y el número final del TX (3 en vez de 1)
    serviceUUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    charUUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",

    async connect() {
        if (!navigator.bluetooth) {
            alert('Tu navegador no soporta Web Bluetooth. Usa Google Chrome en Android o PC.');
            return;
        }

        try {
            UI.setConnState('connecting');

            // Búsqueda directa filtrando por el nombre exacto que configuraste en la ESP32-S3 ("MarkII_PPG")
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'MarkII_PPG' }
                ],
                optionalServices: [this.serviceUUID]
            });

            this.device.addEventListener('gattserverdisconnected', () => this.onDisconnected());

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.serviceUUID);
            this.characteristic = await service.getCharacteristic(this.charUUID);

            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', e => this.handleData(e));

            UI.setConnState('connected');
            UI.toast('Dispositivo Bluetooth conectado');

        } catch (error) {
            console.error('Error de conexión BLE:', error);
            UI.setConnState('error');
            setTimeout(() => UI.setConnState('idle'), 3000);
        }
    },

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.onDisconnected();
    },

    onDisconnected() {
        this.device = null;
        this.characteristic = null;
        UI.setConnState('idle');
        UI.resetReading();
        UI.toast('Dispositivo desconectado');
    },

    handleData(event) {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(value).trim();

        // El ESP32 envía: "beatAvg,irValue,spo2Calculado"
        const parts = text.split(',');
        if (parts.length >= 3) {
            const bpm = parseInt(parts[0], 10);
            const irValue = parseInt(parts[1], 10);
            const spo2 = parseInt(parts[2], 10);

            // Actualizar la interfaz gráfica con los valores reales
            UI.showReading(bpm, spo2);
            Graph.add(irValue);

            // Evaluar alertas si el SpO2 entra en niveles de riesgo
            Alerts.check(spo2);
        }
    }
};
