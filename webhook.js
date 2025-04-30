export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Método não permitido
  }

  const topic = req.query.topic;
  const id = req.query.id;

  try {
    let paymentInfo = null;

    // Caso seja uma ordem (merchant_order), precisamos buscar o payment_id real
    if (topic === 'merchant_order') {
      console.log("📦 Webhook recebeu merchant_order:", id);
      const orderRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });
      const orderData = await orderRes.json();
      const paymentId = orderData?.payments?.[0]?.id;

      if (!paymentId) {
        console.warn("⚠️ merchant_order recebido, mas sem payment_id válido");
        return res.status(200).json({ status: 'no payment found' });
      }

      console.log("✅ Pagamento vinculado à ordem:", paymentId);

      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });
      paymentInfo = await paymentRes.json();

    } else if (topic === 'payment') {
      console.log("📨 Webhook recebeu payment direto:", id);
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });
      paymentInfo = await paymentRes.json();
    }

    if (paymentInfo?.status === 'approved') {
      console.log("🎉 Pagamento aprovado. Enviando e-mails...");

      const nome = paymentInfo.payer?.first_name || 'Cliente';
      const email = paymentInfo.payer?.email || '';
      const valor = paymentInfo.transaction_amount || 0;
      const paymentId = paymentInfo.id;

      // E-mail para cliente
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "service_7h0vwgu",
          template_id: "template_f0qdbl2",
          user_id: "ymeNjOVYZwuX_I2RX",
          accessToken: "EcV3h6-K8s6dJqPcEl7rM",
          template_params: {
            to_name: nome,
            message: `Sua compra foi confirmada!\nEquipe Trem de Piratuba entrará em contato pelo WhatsApp.\nValor: R$ ${valor}\nCódigo MP: ${paymentId}`
          }
        })
      });
      console.log("📤 E-mail enviado para cliente");

      // E-mail para admin
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "service_7h0vwgu",
          template_id: "template_ejloz73",
          user_id: "ymeNjOVYZwuX_I2RX",
          accessToken: "EcV3h6-K8s6dJqPcEl7rM",
          template_params: {
            to_name: "Admin",
            message: `Nova compra aprovada!\nValor: R$ ${valor}\nMP ID: ${paymentId}\nEmail do cliente: ${email}`
          }
        })
      });
      console.log("📤 E-mail enviado para admin");
    } else {
      console.log("⏳ Pagamento ainda não aprovado ou inválido:", paymentInfo?.status);
    }

  } catch (error) {
    console.error("❌ Erro no processamento do webhook:", error);
  }

  return res.status(200).json({ status: 'ok' });
}
