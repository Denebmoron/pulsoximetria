// js/whatsapp.js
const WhatsAppAPI = {
    async sendAlert(spo2, bpm, patientId) {
        // Token de acceso de tu captura de Meta
        const token = "EAGXq8PPKX7YBSzTVS22IETKDpVtP1GZC..."; // (Pega tu token completo aquí)
        
        // Phone Number ID exacto de tu captura
        const phoneNumberId = "1426314113895859";[span_1](start_span)[span_1](end_span)
        
        // ¡CAMBIA ESTO! Pon aquí tu número personal verificado en Meta (ej: 573001234567 sin el símbolo +)
        const recipientPhone = "573177581336"; 

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
