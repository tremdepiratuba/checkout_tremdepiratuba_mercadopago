export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Apenas POST permitido
  }

  const { type, data } = req.body;

  // Verifica se o evento é do tipo 'payment'
  if (type === 'payment') {
    const paymentId = data.id;

    try {
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });

      const paymentInfo = await paymentRes.json();
      console.log("🔎 Dados do pagamento:", paymentInfo);

      if (paymentInfo.status === 'approved') {
        console.log("🎉 Pagamento aprovado! Enviando e-mails...");

        const nome = paymentInfo.payer?.first_name || 'Cliente';
        const email = paymentInfo.payer?.email || '';
        const valor = paymentInfo.transaction_amount || 0;

        // Enviar para o cliente
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
              message: `Sua compra foi confirmada!\nEquipe Trem de Piratuba entrará em contato com você.\nValor: R$ ${valor}`
            }
          })
        });

        // Enviar para o admin
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
              message: `Nova compra confirmada!\nValor: R$ ${valor}\nEmail do cliente: ${email}`
            }
          })
        });

        console.log("📤 E-mails enviados com sucesso!");
      } else {
        console.log("⏳ Pagamento ainda não aprovado:", paymentInfo.status);
      }

    } catch (err) {
      console.error("❌ Erro ao processar o pagamento:", err);
    }
  }

  res.status(200).json({ status: 'ok' });
}
