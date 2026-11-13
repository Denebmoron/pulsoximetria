// js/whatsapp.js
const WhatsAppAPI = {
    async sendAlert(spo2, bpm, patientId) {
        // Tu token de acceso temporal de Meta
        const token = "EAGXq8PPKX7YBSzTVS22IETKDpVtP1GZCwkR3IolgQ9ZAuETK4caqk1qfV1wXGkb6dUST6knXZBlFIR2MFs4kNQ8N5miRYqwKPfORlAXDz4f5xwDSUZA5pTVwzceQV9gZAQzhtS7Y0VZBaE3ZAZC2TcrSVjCJJxZCpZCPdVDZAzq9zxf7lkRlGtwH8iZB6uNfi4WNZBEfkMQMFNVdnbmE0tO2ZBbbuWYiAWbxxVsnYBm4LskKiUObnMgD8SAfo4PgZDZD";
      
        // Tu Phone Number ID numérico
        const phoneNumberId = "1426314113895859";

        // Número de destino (sin espacios ni símbolos raros, ej: +15551636388 o tu número personal verificado)
        const recipientPhone = "15551636388"; 

        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        const data = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "text",
            text: {
                body: `🚨 ALERTA CRÍTICA - PULSOXIMETRÍA 🚨\nPaciente ID: ${patientId || 'N/D'}\nSpO2: ${spo2}% (Riesgo < 88%)\nBPM: ${bpm}`
            }
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log("Alerta de WhatsApp enviada:", result);
        } catch (error) {
            console.error("Error al enviar WhatsApp:", error);
        }
    }
};
