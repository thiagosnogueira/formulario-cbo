const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

const SPACES = [
  { id: "templo_maior", label: "Templo Maior" },
  { id: "templo_menor", label: "Templo Menor" },
  { id: "sala_lideres", label: "Sala dos líderes" },
  { id: "salao_vermelho", label: "Salão vermelho" },
  { id: "sala_azul", label: "Sala Azul" },
  { id: "sala_juventude", label: "Sala da juventude" },
  { id: "cozinha", label: "Cozinha" },
  { id: "gramado", label: "Gramado" },
  { id: "area_lazer", label: "Área de Lazer" },
  { id: "piscina", label: "Piscina" }
];

const MINISTRIES = [
  { id: "sonoplastia", label: "Sonoplastia", description: "Aciona o time de som." },
  { id: "midia", label: "Mídia", description: "Aciona o time de mídia e projeção." },
  { id: "comunicacao", label: "Comunicação", description: "Aciona o time de comunicação e divulgação." },
  { id: "recepcao", label: "Recepção", description: "Aciona o time de recepção." },
  { id: "infantil", label: "Infantil", description: "Aciona o ministério infantil." },
  { id: "louvor", label: "Louvor", description: "Aciona o ministério de louvor." }
];

const form = document.getElementById("eventForm");
const feedback = document.getElementById("feedback");
const spacesContainer = document.getElementById("spacesContainer");
const ministriesContainer = document.getElementById("ministriesContainer");
const submitButton = document.getElementById("submitButton");

function renderCheckboxGroup(container, items, inputName) {
  container.innerHTML = items.map(item => `
    <label class="checkbox-card">
      <input type="checkbox" name="${inputName}" value="${item.id}" />
      <span>
        <strong>${item.label}</strong>
        ${item.description ? `<small>${item.description}</small>` : ""}
      </span>
    </label>
  `).join("");
}

function showFeedback(message, type) {
  feedback.className = `feedback ${type}`;
  feedback.textContent = message;
  feedback.classList.remove("hidden");
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}

function validateDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return endDate > startDate;
}

async function handleSubmit(event) {
  event.preventDefault();

  const espacos = getCheckedValues("espacos");
  const ministerios = getCheckedValues("ministerios");

  if (!espacos.length) {
    showFeedback("Selecione pelo menos um espaço da igreja.", "error");
    return;
  }

  if (!ministerios.length) {
    showFeedback("Selecione pelo menos um ministério para ser acionado.", "error");
    return;
  }

  if (!validateDateRange(form.dataInicio.value, form.dataFim.value)) {
    showFeedback("A data e hora do fim precisam ser maiores que a data e hora do início.", "error");
    return;
  }

  if (!API_URL || API_URL.includes("COLE_AQUI")) {
    showFeedback("Configure a constante API_URL no arquivo script.js com a URL do Web App do Apps Script.", "error");
    return;
  }

  const payload = {
    nomeEvento: form.nomeEvento.value.trim(),
    responsavel: form.responsavel.value.trim(),
    contato: form.contato.value.trim(),
    dataInicio: form.dataInicio.value,
    dataFim: form.dataFim.value,
    espacos,
    objetivo: form.objetivo.value.trim(),
    ministerios
  };

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    const response = await fetch(API_URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify(payload)
});

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Falha ao enviar a solicitação.");
    }

    showFeedback("Solicitação enviada com sucesso. Os ministérios selecionados foram notificados.", "success");
    form.reset();
  } catch (error) {
    console.error(error);
    showFeedback(error.message || "Erro inesperado ao enviar a solicitação.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar solicitação";
  }
}

renderCheckboxGroup(spacesContainer, SPACES, "espacos");
renderCheckboxGroup(ministriesContainer, MINISTRIES, "ministerios");
form.addEventListener("submit", handleSubmit);
