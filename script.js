const mp = new MercadoPago('APP_USR-502f9ce6-3a4e-40dd-88a4-b1ebe10de60e');
emailjs.init('ymeNjOVYZwuX_I2RX');

const months = ["Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const availableDates = {
  "Maio": [3, 10, 17, 24, 31],
  "Junho": [7, 14, 20, 21, 28],
  "Julho": [2, 5, 9, 12, 16, 19, 23, 26, 30]
};
const fixedHour = "13:30";
let selectedMonth = "", selectedDay = "", selectedHour = "";
let passengers = { adultos: 0, criancas: 0, bebes: 0 };

document.addEventListener('DOMContentLoaded', () => {
  createMonthButtons();
  setupPaymentButtons();
  document.getElementById('btnConfirm').addEventListener('click', handlePurchase);
});

function createMonthButtons() {
  const container = document.getElementById('monthsContainer');
  months.forEach(month => {
    const btn = document.createElement('button');
    btn.className = 'month-button';
    btn.textContent = month;
    btn.onclick = () => selectMonth(btn, month);
    container.appendChild(btn);
  });
}

function selectMonth(button, month) {
  selectedMonth = month;
  selectedDay = "";
  document.querySelectorAll('.month-button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  renderDays(month);
}

function renderDays(month) {
  const container = document.getElementById('daysContainer');
  container.innerHTML = '';
  availableDates[month].forEach(day => {
    const el = document.createElement('div');
    el.className = 'day';
    el.textContent = day;
    el.onclick = () => selectDay(el, day);
    container.appendChild(el);
  });
}

function selectDay(button, day) {
  selectedDay = day;
  document.querySelectorAll('.day').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  showHours();
}

function showHours() {
  const container = document.getElementById('hoursContainer');
  container.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'hour';
  el.textContent = fixedHour;
  el.onclick = () => {
    selectedHour = fixedHour;
    document.querySelectorAll('.hour').forEach(h => h.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('passengersSection').style.display = 'block';
  };
  container.appendChild(el);
}
function updatePassengerCount(type, delta) {
  passengers[type] = Math.max(0, passengers[type] + delta);
  document.getElementById(`${type}Count`).textContent = passengers[type];
  generatePassengerForms();
}

function generatePassengerForms() {
  const container = document.getElementById('passengerForms');
  container.innerHTML = '';
  let idx = 1;
  for (let i = 0; i < passengers.adultos; i++) addPassengerForm(container, 'Adulto', idx++, i === 0);
  for (let i = 0; i < passengers.criancas; i++) addPassengerForm(container, 'Criança', idx++);
  for (let i = 0; i < passengers.bebes; i++) addPassengerForm(container, 'Bebê', idx++);
  if (idx > 1) {
    document.getElementById('paymentSection').style.display = 'block';
    generateResumo();
  } else {
    document.getElementById('paymentSection').style.display = 'none';
  }
}

function addPassengerForm(container, tipo, idx, isResponsavel = false) {
  const div = document.createElement('div');
  div.className = 'passenger-form';
  div.innerHTML = `
    <h4>${tipo} ${idx}</h4>
    <input type="text" placeholder="Nome Completo" class="input-name" required>
    <input type="text" placeholder="CPF" class="input-cpf" required>
    ${isResponsavel ? `
    <input type="text" placeholder="Telefone" class="input-phone" required>
    <input type="email" placeholder="E-mail" class="input-email" required>` : ''}
  `;
  container.appendChild(div);
}

function generateResumo() {
  const total = (passengers.adultos + passengers.criancas) * 159;
  document.getElementById('resumo').innerHTML = `
    <h3>Resumo da Reserva</h3>
    <p><strong>Data:</strong> ${selectedDay} de ${selectedMonth} às ${fixedHour}</p>
    <p><strong>Adultos:</strong> ${passengers.adultos} x R$159,00</p>
    <p><strong>Crianças:</strong> ${passengers.criancas} x R$159,00</p>
    <p><strong>Bebês:</strong> ${passengers.bebes} (Grátis)</p>
    <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
  `;
}
function setupPaymentButtons() {
  document.getElementById('btnCredit').addEventListener('click', () => {
    togglePayment('btnCredit');
  });
  document.getElementById('btnPix').addEventListener('click', () => {
    togglePayment('btnPix');
  });
}

function togglePayment(selectedId) {
  document.getElementById('btnCredit').classList.remove('selected');
  document.getElementById('btnPix').classList.remove('selected');
  document.getElementById(selectedId).classList.add('selected');
  generateResumo();
}

function handlePurchase() {
  const paymentMethod = document.querySelector('.payment-btn.selected');
  if (!paymentMethod) return alert('Escolha uma forma de pagamento.');

  const method = paymentMethod.id === 'btnPix' ? 'pix' : 'card';
  const pricePer = method === 'pix' ? 146 : 159;
  const totalPassengers = passengers.adultos + passengers.criancas;
  if (totalPassengers === 0) return alert('Adicione ao menos um passageiro pagante.');

  const total = totalPassengers * pricePer;

  const preferenceData = {
    items: [{
      title: "Passeio Trem de Piratuba",
      quantity: totalPassengers,
      unit_price: pricePer
    }],
    back_urls: {
      success: window.location.href,
      failure: window.location.href,
      pending: window.location.href
    },
    auto_return: "approved"
  };

  fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": "Bearer APP_USR-3646147308239749-042715-25294f6ef0258492dcdce4d8767b629e-2224895473",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(preferenceData)
  })
    .then(res => res.json())
    .then(data => {
      sendEmails(total, data.id);
      window.location.href = data.init_point;
    })
    .catch(err => {
      console.error(err);
      alert('Erro ao iniciar pagamento. Tente novamente.');
    });
}

function sendEmails(total, mpCode) {
  const forms = document.querySelectorAll('.passenger-form');
  const mainForm = forms[0];
  const nome = mainForm.querySelector('.input-name')?.value || '';
  const email = mainForm.querySelector('.input-email')?.value || '';

  const msgAdmin = Array.from(forms).map((form, i) => {
    const nome = form.querySelector('.input-name')?.value;
    const cpf = form.querySelector('.input-cpf')?.value;
    return `Passageiro ${i + 1}: ${nome}, CPF: ${cpf}`;
  }).join('\n');

  const templateCliente = {
    to_name: nome,
    message: `Sua compra foi confirmada!\nEquipe Trem de Piratuba entrará em contato pelo WhatsApp.\nCódigo Mercado Pago: ${mpCode}`
  };
  const templateAdmin = {
    to_name: "Admin",
    message: `Compra confirmada.\n${msgAdmin}\nTotal: R$ ${total.toFixed(2)}\nCódigo MP: ${mpCode}`
  };

  emailjs.send("service_7h0vwgu", "template_f0qdbl2", templateCliente);
  emailjs.send("service_7h0vwgu", "template_ejloz73", templateAdmin);
}
