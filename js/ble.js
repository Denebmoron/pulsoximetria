/ ===== Bluetooth (Web Bluetooth): conexión con la ESP32 y lectura de datos =====

const BLE = {
    DEVICE_NAME: 'MarkII_PPG',

    // UUIDs definidos en el código C++ de la ESP32-S3
    SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    CHAR_UUID: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',

    async connect() {
        try {
            UI.setConnState('connecting');

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: this.DEVICE_NAME }],
                optionalServices: [this.SERVICE_UUID]
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(this.SERVICE_UUID);
            const characteristic = await service.getCharacteristic(this.CHAR_UUID);

            await characteristic.startNotifications();
            UI.setConnState('connected');
            App.resetReading(); // sesión nueva: no arrastrar valores de un demo o de una conexión anterior

            characteristic.addEventListener('characteristicvaluechanged', e => this.handleData(e));
        } catch (error) {
            console.error('Fallo de conexión:', error);
            UI.setConnState('error');
        }
    },

    // Convierte el texto de la ESP32 en una lectura
    // Formato: "BPM,IR" siempre, y "BPM,IR,SPO2" si el firmware ya calcula SpO2
    parse(text) {
        const parts = text.split(',');
        if (parts.length < 2) return null;

        return {
            bpm: parseInt(parts[0]),
            ir: parseInt(parts[1]),
            spo2: parts.length >= 3 ? parseFloat(parts[2]) : NaN
        };
    },

    handleData(event) {
        const text = new TextDecoder().decode(event.target.value);
        const reading = this.parse(text);
        if (reading) App.applyReading(reading.bpm, reading.ir, reading.spo2);
    }
