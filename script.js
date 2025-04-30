const mp = new MercadoPago('APP_USR-502f9ce6-3a4e-40dd-88a4-b1ebe10de60e');
emailjs.init('ymeNjOVYZwuX_I2RX');

// Dados do sistema
const months = ["Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const availableDates = {
  "Maio": [3, 10, 17, 24, 31],
  "Junho": [7, 14, 20, 21, 28],
  "Julho": [2, 5, 9, 12, 16, 19, 23, 26, 30],
  "Agosto": [2, 6, 9, 13, 16, 20, 23, 27, 30],
  "Setembro": [3, 6, 10, 13, 17, 20, 24, 27],
  "Outubro": [1, 4, 8, 11, 15, 18, 22, 25, 29],
  "Novembro": [1, 5, 8, 12, 15, 19, 22, 26, 29],
  "Dezembro": [3, 6, 10, 13, 17, 20, 24, 27, 31]
};
const fixedHour = "13:30";

// Estado do sistema
let selectedMonth = "", selectedDay = "", selectedHour = "";
let passengers = { adultos: 0, criancas: 0, bebes: 0 };
let currentPassengerFormsValid = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  createMonthButtons();
  setupPaymentButtons();
  document.getElementById('btnConfirm').addEventListener('click', handlePurchase);
});

// Função para validar CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Função para validar e-mail
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Função para validar telefone
function validarTelefone(telefone) {
  return telefone.replace(/\D/g, '').length >= 10;
}

// Criação dos botões de mês
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
  
  for (let i = 0; i < passengers.adultos; i++) {
    addPassengerForm(container, 'Adulto', idx++, i === 0);
  }
  for (let i = 0; i < passengers.criancas; i++) {
    addPassengerForm(container, 'Criança', idx++);
  }
  for (let i = 0; i < passengers.bebes; i++) {
    addPassengerForm(container, 'Bebê', idx++);
  }
  
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
  div.dataset.passengerIndex = idx;
  
  div.innerHTML = `
    <h4>${tipo} ${idx}</h4>
    <input type="text" placeholder="Nome Completo" class="input-name" required>
    <div class="error-message" id="nameError${idx}">Preencha o nome</div>
    
    <input type="text" placeholder="CPF" class="input-cpf" required>
    <div class="error-message" id="cpfError${idx}">CPF inválido</div>
    
    ${isResponsavel ? `
    <input type="text" placeholder="Telefone" class="input-phone" required>
    <div class="error-message" id="phoneError${idx}">Preencha o telefone</div>
    
    <input type="email" placeholder="E-mail" class="input-email" required>
    <div class="error-message" id="emailError${idx}">E-mail inválido</div>` : ''}
  `;
  
  container.appendChild(div);
  
  // Adiciona validações em tempo real
  const inputs = div.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('blur', validatePassengerForm);
    input.addEventListener('input', validatePassengerForm);
  });
}

function validatePassengerForm() {
  const form = this.closest('.passenger-form');
  const idx = form.dataset.passengerIndex;
  
  const nome = form.querySelector('.input-name').value.trim();
  const cpf = form.querySelector('.input-cpf').value.trim();
  const phone = form.querySelector('.input-phone')?.value.trim();
  const email = form.querySelector('.input-email')?.value.trim();
  
  // Validação do nome
  const nameError = document.getElementById(`nameError${idx}`);
  if (!nome) {
    nameError.style.display = 'block';
  } else {
    nameError.style.display = 'none';
  }
  
  // Validação do CPF
  const cpfError = document.getElementById(`cpfError${idx}`);
  if (!validarCPF(cpf)) {
    cpfError.style.display = 'block';
  } else {
    cpfError.style.display = 'none';
  }
  
  // Validação do telefone (apenas para o responsável)
  if (phone !== undefined) {
    const phoneError = document.getElementById(`phoneError${idx}`);
    if (!validarTelefone(phone)) {
      phoneError.style.display = 'block';
    } else {
      phoneError.style.display = 'none';
    }
  }
  
  // Validação do e-mail (apenas para o responsável)
  if (email !== undefined) {
    const emailError = document.getElementById(`emailError${idx}`);
    if (!validarEmail(email)) {
      emailError.style.display = 'block';
    } else {
      emailError.style.display = 'none';
    }
  }
  
  // Verifica se todos os forms estão válidos
  checkAllFormsValid();
}

function checkAllFormsValid() {
  const forms = document.querySelectorAll('.passenger-form');
  let allValid = true;
  
  forms.forEach(form => {
    const idx = form.dataset.passengerIndex;
    const nameError = document.getElementById(`nameError${idx}`);
    const cpfError = document.getElementById(`cpfError${idx}`);
    const phoneError = document.getElementById(`phoneError${idx}`);
    const emailError = document.getElementById(`emailError${idx}`);
    
    if (nameError.style.display === 'block' || 
        cpfError.style.display === 'block' ||
        (phoneError && phoneError.style.display === 'block') ||
        (emailError && emailError.style.display === 'block')) {
      allValid = false;
    }
  });
  
  currentPassengerFormsValid = allValid;
  return allValid;
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
  // Validação dos passageiros
  if (!checkAllFormsValid()) {
    alert('Por favor, preencha todos os campos corretamente antes de continuar.');
    return;
  }
  
  // Validação do método de pagamento
  const paymentMethod = document.querySelector('.payment-btn.selected');
  if (!paymentMethod) {
    alert('Escolha uma forma de pagamento.');
    return;
  }
  
  // Validação de passageiros pagantes
  const totalPassengers = passengers.adultos + passengers.criancas;
  if (totalPassengers === 0) {
    alert('Adicione ao menos um passageiro pagante.');
    return;
  }
  
  // Processamento do pagamento
  const method = paymentMethod.id === 'btnPix' ? 'pix' : 'card';
  const pricePer = method === 'pix' ? 146 : 159;
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
  body: JSON.stringify({
    items: [{
      title: "Passeio Trem de Piratuba",
      quantity: totalPassengers,
      unit_price: pricePer
    }],
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" },
        { id: "atm" },
        { id: "bank_transfer" }
      ],
      installments: 3
    },
    back_urls: {
      success: `${window.location.origin}/?status=approved`,
      failure: `${window.location.origin}/?status=failure`,
      pending: `${window.location.origin}/?status=pending`
    },
    auto_return: "approved",
    notification_url: "https://checkout-tremdepiratuba-mercadopago.vercel.app/api/webhook"
  })
})
.then(data => {
  window.location.href = data.init_point;
})

.catch(err => {
  console.error(err);
  alert('Erro ao iniciar pagamento. Tente novamente.');
});


}