export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Método não permitido
  }

  const { type, data } = req.body;
  const topic = req.query.topic;
  const queryId = req.query.id;

  // Cobertura para /api/webhook?topic=merchant_order&id=123
  if (type === 'payment' || topic === 'payment' || topic === 'merchant_order') {
    const paymentId = data?.id || queryId;

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });

      const paymentInfo = await response.json();
      console.log("🔁 Pagamento recebido do MP:", paymentInfo);

      if (paymentInfo.status === 'approved') {
        console.log("✅ Pagamento aprovado. Enviando e-mails via EmailJS...");

        const nome = paymentInfo.payer?.first_name || 'Cliente';
        const email = paymentInfo.payer?.email || '';
        const valor = paymentInfo.transaction_amount || 0;

        // Enviar para CLIENTE
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

        // Enviar para ADMIN
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
      }

    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error);
    }
  }

  return res.status(200).json({ status: 'ok' });
}
