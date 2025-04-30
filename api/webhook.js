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
        // Extrai dados da reserva do metadata
        const metadata = paymentInfo.metadata || {};
        const reserva = {
          nome: metadata.nome || 'Cliente',
          email: metadata.email || 'sem-email@exemplo.com',
          telefone: metadata.telefone || 'Não informado',
          data: metadata.data || 'Não informada',
          horario: metadata.horario || 'Não informado',
          adultos: metadata.adultos || 0,
          criancas: metadata.criancas || 0,
          bebes: metadata.bebes || 0,
          valor: paymentInfo.transaction_amount || 0
        };
        
        console.log("✅ Pagamento aprovado! Dados da reserva:", reserva);

        // Preparando templates de email
        const templateParamsCliente = {
          to_name: reserva.nome,
          to_email: reserva.email,
          data_viagem: reserva.data,
          horario: reserva.horario,
          adultos: reserva.adultos,
          criancas: reserva.criancas,
          bebes: reserva.bebes,
          valor: `R$ ${reserva.valor.toFixed(2)}`,
          payment_id: paymentId
        };

        const templateParamsAdmin = {
          ...templateParamsCliente,
          to_name: 'Administrador',
          to_email: process.env.ADMIN_EMAIL,
          cliente_nome: reserva.nome,
          cliente_email: reserva.email,
          cliente_telefone: reserva.telefone
        };

        // Envia email para o cliente
        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: process.env.EMAILJS_SERVICE_ID,
              template_id: process.env.EMAILJS_TEMPLATE_CLIENTE,
              user_id: process.env.EMAILJS_USER_ID,
              accessToken: process.env.EMAILJS_ACCESS_TOKEN,
              template_params: templateParamsCliente
            })
          });
          console.log("📧 Email enviado para o cliente:", reserva.email);
        } catch (emailError) {
          console.error("❌ Erro ao enviar email para cliente:", emailError);
        }

        // Envia email para o admin
        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: process.env.EMAILJS_SERVICE_ID,
              template_id: process.env.EMAILJS_TEMPLATE_ADMIN,
              user_id: process.env.EMAILJS_USER_ID,
              accessToken: process.env.EMAILJS_ACCESS_TOKEN,
              template_params: templateParamsAdmin
            })
          });
          console.log("📧 Email enviado para o admin:", process.env.ADMIN_EMAIL);
        } catch (emailError) {
          console.error("❌ Erro ao enviar email para admin:", emailError);
        }
      } else {
        console.log("⚠️ Pagamento não aprovado. Status:", paymentInfo.status);
      }
    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error);
    }
  }

  return res.status(200).json({ success: true });
}
