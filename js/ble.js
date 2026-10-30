// ==========================================
// PROTOCOLO DE TELEMETRÍA WEB BLUETOOTH (Mark II)
// ==========================================

// ⚠️ CRÍTICO: Web Bluetooth exige que los UUIDs estén estrictamente en minúsculas
const bleServiceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const bleCharacteristicUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice;
let bleCharacteristic;

// ==========================================
// 1. INICIALIZACIÓN Y BÚSQUEDA DEL REACTOR
// ==========================================
async function connectBLE() {
    try {
        console.log('Iniciando radar de telemetría...');

        // Pedir permisos al navegador filtrando por el servicio de nuestra ESP32
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [bleServiceUUID] }]
        });

        console.log('Armadura encontrada:', bluetoothDevice.name);
        
        // Vigilar si la placa se apaga o se aleja
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

        // Conectar al servidor GATT de la ESP32
        console.log('Enlazando con el microcontrolador...');
        const server = await bluetoothDevice.gatt.connect();

        // Obtener el servicio y la característica de transmisión (TX)
        const service = await server.getPrimaryService(bleServiceUUID);
        bleCharacteristic = await service.getCharacteristic(bleCharacteristicUUID);

        // Suscribirse a la transmisión de datos en vivo
        await bleCharacteristic.startNotifications();
        bleCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        
        console.log('¡Conexión establecida! Flujo de datos biométricos activo.');
        
        // OPCIONAL: Si tiene un botón o texto en su HTML, actualícelo aquí
        // document.getElementById('estadoConexion').innerText = "Conectado: Mark II";

    } catch (error) {
        console.error('Fallo en el enlace táctico:', error);
    }
}

// ==========================================
// 2. RECEPCIÓN Y DECODIFICACIÓN DE DATOS
// ==========================================
function handleNotifications(event) {
    // La ESP32 envía bytes crudos, debemos decodificarlos a texto
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const dataString = decoder.decode(value).trim(); 
    
    // El firmware de la ESP32 envía: "beatAvg,irValue,spo2Calculado"
    const dataArray = dataString.split(',');

    if (dataArray.length === 3) {
        const bpm = parseInt(dataArray[0]);
        const irValue = parseInt(dataArray[1]);
        const spo2 = parseInt(dataArray[2]);

        // Verificamos por consola que los datos llegan puros
        console.log(`BPM: ${bpm} | Señal PPG: ${irValue} | O2: ${spo2}%`);

        // ==========================================
        // 3. INYECCIÓN A LA INTERFAZ GRÁFICA (DOM)
        // ==========================================
        // Reemplace 'idDelBpm' y 'idDelSpo2' por los IDs reales de su archivo HTML
        
        // document.getElementById('idDelBpm').innerText = bpm;
        // document.getElementById('idDelSpo2').innerText = spo2 + "%";
        
        // Si está usando Chart.js para dibujar la onda del pulso:
        // actualizarGrafica(irValue); 
    }
}

// ==========================================
// 4. PROTOCOLOS DE DESCONEXIÓN Y SEGURIDAD
// ==========================================
function disconnectBLE() {
    if (!bluetoothDevice) {
        return;
    }
    console.log('Cortando conexión de forma segura...');
    if (bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    } else {
        console.log('El sistema ya estaba desconectado.');
    }
}

function onDisconnected(event) {
    console.log(`Se ha perdido la señal con la placa: ${event.target.name}`);
    // document.getElementById('estadoConexion').innerText = "Señal Perdida";
}