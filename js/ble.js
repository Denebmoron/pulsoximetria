// ===== Bluetooth: conexión directa con el ESP32-S3 por nombre =====

const BLE = {
    device: null,
    characteristic: null,

    // UUIDs idénticos a los del ESP32
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    charUUID: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',

    logDiag(msg) {
        console.log(msg);
        if (window.__diag && typeof window.__diag.show === 'function') {
            window.__diag.show('BLE: ' + msg);
        }
    },

    async connect() {
        if (!navigator.bluetooth) {
            alert('Tu navegador no soporta Web Bluetooth. Usa Google Chrome en Android o PC.');
            return;
        }

        try {
            UI.setConnState('connecting');
            this.logDiag('Iniciando escaneo de dispositivos...');

            // Desconectar dispositivo previo si quedó en caché
            if (this.device && this.device.gatt.connected) {
                this.device.gatt.disconnect();
            }

            // Búsqueda directa filtrando por el nombre exacto de la ESP32-S3
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'MarkII_PPG' }
                ],
                optionalServices: [this.serviceUUID]
            });

            this.logDiag('Dispositivo seleccionado. Conectando al servidor GATT...');
            this.device.addEventListener('gattserverdisconnected', () => this.onDisconnected());

            const server = await this.device.gatt.connect();
            
            this.logDiag('Buscando servicio principal...');
            const service = await server.getPrimaryService(this.serviceUUID);
            
            this.logDiag('Buscando característica TX...');
            this.characteristic = await service.getCharacteristic(this.charUUID);

            this.logDiag('Activando notificaciones...');
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', e => this.handleData(e));

            UI.setConnState('connected');
            UI.toast('Dispositivo Bluetooth conectado');
            this.logDiag('¡Conexión establecida con éxito!');

        } catch (error) {
            console.error('Error de conexión BLE:', error);
            this.logDiag('Fallo: ' + (error.message || error));
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
        this.logDiag('Dispositivo desconectado');
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