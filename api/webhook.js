export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Apenas POST permitido
  }

  console.log("🔔 Webhook recebido:", JSON.stringify(req.body, null, 2));

  const { type, data } = req.body;

  // Verifica se o evento é do tipo 'payment'
  if (type === 'payment') {
    const paymentId = data.id;

    try {
      // Busca detalhes do pagamento no Mercado Pago
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });

      const paymentInfo = await paymentRes.json();
      console.log("🔎 Detalhes do pagamento:", paymentInfo);

      if (paymentInfo.status === 'approved') {
        console.log("🎉 Pagamento aprovado! Processando reserva...");

        // Extrai dados da reserva do metadata
        const metadata = paymentInfo.metadata || {};
        const reservationData = {
          date: metadata.date || 'Data não informada',
          time: metadata.time || 'Horário não informado',
          adults: metadata.adults || 0,
          children: metadata.children || 0,
          babies: metadata.babies || 0,
          total: metadata.total || 0,
          customer: {
            name: metadata.customer?.name || 'Cliente',
            email: metadata.customer?.email || '',
            phone: metadata.customer?.phone || 'Não informado'
          }
        };

        console.log("📦 Dados da reserva:", reservationData);

        // Template para o CLIENTE
        const clientEmailParams = {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_CLIENTE,
          user_id: process.env.EMAILJS_USER_ID,
          accessToken: process.env.EMAILJS_ACCESS_TOKEN,
          template_params: {
            to_name: reservationData.customer.name,
            to_email: reservationData.customer.email,
            adultos: reservationData.adults,
            crianças: reservationData.children,
            total: reservationData.total.toFixed(2),
            codigo_reserva: paymentId,
            data: reservationData.date,
            horario: reservationData.time,
            telefone: reservationData.customer.phone
          }
        };

        // Template para o ADMIN (você)
        const adminEmailParams = {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ADMIN,
          user_id: process.env.EMAILJS_USER_ID,
          accessToken: process.env.EMAILJS_ACCESS_TOKEN,
          template_params: {
            to_name: "Admin",
            to_email: process.env.ADMIN_EMAIL,
            cliente_nome: reservationData.customer.name,
            cliente_email: reservationData.customer.email,
            cliente_telefone: reservationData.customer.phone,
            adultos: reservationData.adults,
            crianças: reservationData.children,
            bebes: reservationData.babies,
            total: reservationData.total.toFixed(2),
            data: reservationData.date,
            horario: reservationData.time,
            codigo_reserva: paymentId
          }
        };

        // Envia e-mail para o CLIENTE
        try {
          console.log("📤 Enviando e-mail para o cliente...");
          const clientEmailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientEmailParams)
          });

          if (!clientEmailRes.ok) throw new Error(await clientEmailRes.text());
          console.log("✅ E-mail enviado ao cliente com sucesso!");
        } catch (err) {
          console.error("❌ Falha ao enviar e-mail ao cliente:", err);
        }

        // Envia e-mail para o ADMIN
        try {
          console.log("📤 Enviando e-mail para o admin...");
          const adminEmailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(adminEmailParams)
          });

          if (!adminEmailRes.ok) throw new Error(await adminEmailRes.text());
          console.log("✅ E-mail enviado ao admin com sucesso!");
        } catch (err) {
          console.error("❌ Falha ao enviar e-mail ao admin:", err);
        }

      } else {
        console.log("⏳ Pagamento ainda não aprovado. Status:", paymentInfo.status);
      }
    } catch (err) {
      console.error("❌ Erro ao processar webhook:", err);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  res.status(200).json({ status: 'ok' });
}