// Servidor mínimo: recibe un POST del navegador cuando el SpO2 está muy bajo
// y lo reenvía por WhatsApp usando la API oficial de Meta (WhatsApp Business Platform).
//
// El access token de Meta vive SOLO aquí (en .env), nunca en el código del navegador,
// porque cualquiera que vea el código fuente de la página podría robarlo y usarlo.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, FAMILY_WHATSAPP_NUMBER, PORT = 3001 } = process.env;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !FAMILY_WHATSAPP_NUMBER) {
    console.warn('⚠️  Falta configurar .env (copia .env.example y rellena tus datos de Meta).');
}

const app = express();
app.use(cors()); // el navegador del celular llama a este servidor desde otro origen
app.use(express.json());

app.post('/api/alert', async (req, res) => {
    const { spo2 } = req.body;
    console.log(`Alerta recibida: SpO2 ${spo2}%`);

    try {
        const r = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: FAMILY_WHATSAPP_NUMBER,
                // "hello_world" es la única plantilla aprobada por defecto en el modo de
                // prueba de Meta: sirve para confirmar que la integración funciona, pero
                // NO lleva el valor real de SpO2 en el texto (no acepta variables).
                // Para mandar un mensaje propio como "SpO2 en 87%, revisa a [nombre]"
                // hay que crear y mandar a aprobar tu propia plantilla en Meta Business
                // Manager (suele tardar minutos a un día) y cambiar el bloque de abajo
                // por algo como:
                // template: { name: 'tu_plantilla', language: { code: 'es_MX' },
                //   components: [{ type: 'body', parameters: [{ type: 'text', text: String(spo2) }] }] }
                type: 'template',
                template: { name: 'hello_world', language: { code: 'en_US' } }
            })
        });

        const data = await r.json();
        if (!r.ok) throw new Error(JSON.stringify(data));

        console.log('WhatsApp enviado:', data);
        res.json({ ok: true });
    } catch (err) {
        console.error('Error enviando WhatsApp:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de alertas escuchando en el puerto ${PORT}`);
    console.log('Desde el celular, usa la IP de esta compu en tu red local, no "localhost".');
});
