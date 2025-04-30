export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Método não permitido
  }

  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473"
        }
      });

      const paymentInfo = await response.json();

      if (paymentInfo.status === 'approved') {
        const nome = paymentInfo.payer?.first_name || 'Cliente';
        const email = paymentInfo.payer?.email || '';
        const valor = paymentInfo.transaction_amount || 0;

        // Cliente
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

        // Admin
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
      }

    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
    }
  }

  return res.status(200).json({ status: 'email sent if approved' });
}
