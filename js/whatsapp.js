// js/whatsapp.js
const WhatsAppAPI = {
    async sendAlert(spo2, bpm, patientId) {
        // Tu token de acceso temporal de Meta
        const token = "EAGXq8PPKX7YBSzTVS22IETKDpVtP1GZCwkR3IolgQ9ZAuETK4caqk1qfV1wXGkb6dUST6knXZBlFIR2MFs4kNQ8N5miRYqwKPfORlAXDz4f5xwDSUZA5pTVwzceQV9gZAQzhtS7Y0VZBaE3ZAZC2TcrSVjCJJxZCpZCPdVDZAzq9zxf7lkRlGtwH8iZB6uNfi4WNZBEfkMQMFNVdnbmE0tO2ZBbbuWYiAWbxxVsnYBm4LskKiUObnMgD8SAfo4PgZDZD";
        
        // El Phone Number ID de tu panel de Meta
        const phoneNumberId = "1426314113895859"; //[span_1](start_span)[span_1](end_span)
        
        // Tu número personal verificado en la lista de destinatarios de Meta (solo números, con código de país)
        const recipientPhone = "573177581336"; // Reemplaza por tu número exacto registrado en Meta

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
            console.log("Respuesta de la API de Meta:", result);
        } catch (error) {
            console.error("Error de red al enviar WhatsApp:", error);
        }
    }
};
