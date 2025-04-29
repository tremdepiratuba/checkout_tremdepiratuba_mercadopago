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
let selectedMonth = "";
let selectedDay = "";
let selectedHour = "";
let passengers = { adultos: 0, criancas: 0, bebes: 0 };

document.addEventListener('DOMContentLoaded', () => {
  createMonthButtons();
});

function createMonthButtons() {
  const container = document.getElementById('monthsContainer');
  container.innerHTML = '';
  months.forEach(month => {
    const button = document.createElement('button');
    button.className = 'month-button';
    button.textContent = month;
    button.onclick = () => selectMonth(button, month);
    container.appendChild(button);
  });
}

function resetReservation() {
  passengers = { adultos: 0, criancas: 0, bebes: 0 };
  document.getElementById('adultosCount').textContent = '0';
  document.getElementById('criancasCount').textContent = '0';
  document.getElementById('bebesCount').textContent = '0';
  document.getElementById('passengerForms').innerHTML = '';
  document.getElementById('paymentSection').style.display = 'none';
  document.getElementById('confirmationSection').style.display = 'none';
}

function selectMonth(button, month) {
  resetReservation();
  selectedMonth = month;
  document.querySelectorAll('.month-button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  showDays(month);
}

function showDays(month) {
  const container = document.getElementById('daysContainer');
  container.innerHTML = '';
  availableDates[month].forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    dayElement.textContent = day;
    dayElement.onclick = () => selectDay(dayElement, day);
    container.appendChild(dayElement);
  });
}

function selectDay(element, day) {
  resetReservation();
  selectedDay = day;
  document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
  element.classList.add('selected');
  showHours();
}

function showHours() {
  resetReservation();
  const container = document.getElementById('hoursContainer');
  container.innerHTML = '';
  const hourElement = document.createElement('div');
  hourElement.className = 'hour';
  hourElement.textContent = fixedHour;
  hourElement.onclick = () => selectHour(hourElement);
  container.appendChild(hourElement);
}

function selectHour(element) {
  selectedHour = fixedHour;
  document.querySelectorAll('.hour').forEach(h => h.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('passengersSection').style.display = 'block';
}

function updatePassengerCount(type, change) {
  passengers[type] = Math.max(0, passengers[type] + change);
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
    lockNextPassengers();
  }
}

function addPassengerForm(container, tipo, idx, isResponsavel = false) {
  const div = document.createElement('div');
  div.className = 'passenger-form';
  div.setAttribute('data-index', idx);
  div.innerHTML = `
    <h4>${tipo} ${idx}</h4>
    <input type="text" placeholder="Nome Completo" class="input-name" required>
    <input type="text" placeholder="CPF" class="input-cpf" required>
    ${isResponsavel ? `
    <input type="text" placeholder="Telefone" class="input-phone" required>
    <input type="email" placeholder="E-mail" class="input-email" required>` : ''}
    <div class="error-message" style="color: red; font-weight: bold; font-size: 14px; margin-top: 5px;"></div>
  `;
  container.appendChild(div);

  const inputs = div.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => validatePassengerSequence(div));
  });
  
  // Adicionar validação para aceitar apenas números no campo CPF
  const cpfInput = div.querySelector('.input-cpf');
  cpfInput.addEventListener('keypress', function(e) {
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  });
  
  // Limpar caracteres não numéricos caso sejam colados
  cpfInput.addEventListener('paste', function(e) {
    setTimeout(() => {
      this.value = this.value.replace(/\D/g, '');
      validatePassengerSequence(div);
    }, 0);
  });
}

function lockNextPassengers() {
  const forms = document.querySelectorAll('.passenger-form');
  forms.forEach((form, index) => {
    if (index > 0) {
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => input.disabled = true);
    }
  });
}

function unlockPassenger(form) {
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => input.disabled = false);
}

function validatePassengerSequence(form) {
  const index = parseInt(form.getAttribute('data-index')) - 1;
  const allForms = document.querySelectorAll('.passenger-form');
  const currentForm = allForms[index];

  if (validatePassengerForm(currentForm)) {
    if (allForms[index + 1]) {
      unlockPassenger(allForms[index + 1]);
    }
    unblockConfirm();
  } else {
    for (let i = index + 1; i < allForms.length; i++) {
      const inputs = allForms[i].querySelectorAll('input');
      inputs.forEach(input => input.disabled = true);
    }
    blockConfirm();
  }
}

function validatePassengerForm(form) {
  let valid = true;
  const nameInput = form.querySelector('.input-name');
  const cpfInput = form.querySelector('.input-cpf');
  const phoneInput = form.querySelector('.input-phone');
  const emailInput = form.querySelector('.input-email');
  const errorDiv = form.querySelector('.error-message');
  errorDiv.innerText = '';

  // Validação do Nome
  if (!nameInput.value.trim()) {
    showError(nameInput, errorDiv, 'Campo obrigatório!');
    valid = false;
  } else {
    clearError(nameInput, errorDiv);
  }

  // Validação do CPF
  if (!cpfInput.value.trim()) {
    showError(cpfInput, errorDiv, 'Campo obrigatório!');
    valid = false;
  } else {
    const cpfValido = validateCPF(cpfInput.value);
    if (!cpfValido) {
      showError(cpfInput, errorDiv, 'CPF inválido! Verifique os números digitados.');
      valid = false;
    } else {
      clearError(cpfInput, errorDiv);
    }
  }

  // Validações do telefone e e-mail (se existirem)
  if (phoneInput && !phoneInput.value.trim()) {
    showError(phoneInput, errorDiv, 'Campo obrigatório!');
    valid = false;
  } else if (phoneInput) {
    clearError(phoneInput, errorDiv);
  }

  if (emailInput && !emailInput.value.trim()) {
    showError(emailInput, errorDiv, 'Campo obrigatório!');
    valid = false;
  } else if (emailInput) {
    clearError(emailInput, errorDiv);
  }

  return valid;
}

function showError(input, errorDiv, message) {
  input.style.border = '2px solid red';
  errorDiv.innerText = message;
}

function clearError(input, errorDiv) {
  input.style.border = '';
  // Não limpar a mensagem de erro aqui, pois pode haver outros erros
}

function blockConfirm() {
  document.getElementById('btnConfirm').disabled = true;
}

function unblockConfirm() {
  if (validateAllPassengers()) {
    document.getElementById('btnConfirm').disabled = false;
  }
}

function validateAllPassengers() {
  let valid = true;
  const forms = document.querySelectorAll('.passenger-form');
  forms.forEach(form => {
    if (!validatePassengerForm(form)) valid = false;
  });
  return valid;
}

function generateResumo() {
  const resumo = document.getElementById('resumo');
  const total = (passengers.adultos * 159) + (passengers.criancas * 159);
  resumo.innerHTML = `
    <h3>Resumo da Reserva</h3>
    <p><strong>Data:</strong> ${selectedDay} de ${selectedMonth} às ${fixedHour}</p>
    <p><strong>Adultos:</strong> ${passengers.adultos} x R$159,00</p>
    <p><strong>Crianças:</strong> ${passengers.criancas} x R$159,00</p>
    <p><strong>Bebês:</strong> ${passengers.bebes} (Grátis)</p>
    <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
  `;
}

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}
