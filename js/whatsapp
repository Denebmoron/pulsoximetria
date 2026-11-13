// js/whatsapp.js
const WhatsAppAPI = {
    async sendAlert(spo2, bpm, patientId) {
        const token = "TU_TOKEN_TEMPORAL_DE_META";
        const phoneNumberId = EAGXq8PPKX7YBS8BOb7PwX3ZBgBVF8XcuJIaZCuAXZCGYl15jZCvNEdibAQGwgwk4eNUgtaSHZC0HrdNkxw0iUjRbfOWv44bBzRKVAcEDxD0ZBtqK11SZBCoUZBGuk1ZAXgmufHrObLJQ0V05MjYPwwCesIBWSuxdNTlZCcQxajZALOxpooNDZARNucOTtXdOrtfRqXYQFxk53vZBOboY02ZA1w6J2TpjCjPht0s28zorTdrwstyMEt2dZBnrXaHmgZDZD

 "TU_PHONE_NUMBER_ID"; 
        const recipientPhone = "573001234567"; // Número verificado en tu panel de Meta

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
