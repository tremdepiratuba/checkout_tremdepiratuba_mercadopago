export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Método não permitido
  }

  const topic = req.query.topic;
  const id = req.query.id;

  try {
    let paymentInfo = null;

    if (topic === 'merchant_order') {
      console.log("📦 Recebido merchant_order:", id);
      const orderRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });

      const orderData = await orderRes.json();

      if (!orderData?.payments?.length) {
        console.log("⚠️ Nenhum pagamento encontrado na ordem.");
        return res.status(200).json({ status: 'sem pagamentos' });
      }

      const paymentId = orderData.payments[0].id;
      console.log("🔍 Pagamento ID encontrado:", paymentId);

      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });

      paymentInfo = await paymentRes.json();
    }

    if (paymentInfo?.status === 'approved') {
      console.log("🎉 Pagamento aprovado! Enviando e-mails...");

      const nome = paymentInfo.payer?.first_name || 'Cliente';
      const email = paymentInfo.payer?.email || 'sem email';
      const valor = paymentInfo.transaction_amount || 0;
      const paymentId = paymentInfo.id;

      const emailPayload = {
        service_id: "service_7h0vwgu",
        user_id: "ymeNjOVYZwuX_I2RX",
        accessToken: "EcV3h6-K8s6dJqPcEl7rM"
      };

      // Enviar para cliente
      const clienteResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...emailPayload,
          template_id: "template_f0qdbl2",
          template_params: {
            to_name: nome,
            message: `Sua compra foi confirmada!\nEquipe Trem de Piratuba entrará em contato pelo WhatsApp.\nValor: R$ ${valor}`
          }
        })
      });
      console.log("📤 Cliente:", clienteResp.status);

      // Enviar para admin
      const adminResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...emailPayload,
          template_id: "template_ejloz73",
          template_params: {
            to_name: "Admin",
            message: `Nova compra confirmada!\nValor: R$ ${valor}\nEmail do cliente: ${email}`
          }
        })
      });
      console.log("📤 Admin:", adminResp.status);
    } else {
      console.log("⏳ Pagamento ainda não aprovado ou inexistente.");
    }

  } catch (err) {
    console.error("❌ Erro no webhook:", err);
  }

  res.status(200).json({ status: 'ok' });
}
