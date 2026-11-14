// js/whatsapp.js
const WhatsAppAPI = {
    async sendAlert(spo2, bpm, patientId) {
        // Pega aquí la URL exacta que te dio Cloudflare
        const workerUrl = "https://tu-proyecto.pages.dev"; 

        try {
            const response = await fetch(workerUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ spo2, bpm, patientId })
            });
            
            const result = await response.json();
            console.log("Alerta enviada a través de Cloudflare:", result);
        } catch (error) {
            console.error("Error al conectar con Cloudflare Worker:", error);
        }
    }
};
