if (paymentInfo.status === 'approved') {
  console.log("Pagamento aprovado. Enviando e-mails via EmailJS...");

  const nome = paymentInfo.payer?.first_name || 'Cliente';
  const email = paymentInfo.payer?.email || '';
  const valor = paymentInfo.transaction_amount || 0;

  // Log extra de dados recebidos
  console.log("Dados para envio:", { nome, email, valor });

  try {
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
    console.log("E-mail enviado para cliente");

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
    console.log("E-mail enviado para admin");

  } catch (err) {
    console.error("Erro ao enviar e-mails via EmailJS:", err);
  }
}
