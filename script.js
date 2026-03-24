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
  { id: "recepcao", label: "Recepção", description: "Aciona o time de recepção." },
  { id: "sonoplastia", label: "Sonoplastia", description: "Aciona o time de som." },
  { id: "midia", label: "Mídia", description: "Aciona o time de mídia e projeção." },
  { id: "comunicacao", label: "Comunicação", description: "Aciona o time de comunicação e divulgação." },
  { id: "louvor", label: "Louvor", description: "Aciona o ministério de louvor." },
  { id: "juventude", label: "Juventude", description: "Aciona o ministério de juventude." },
  { id: "mulheres", label: "Mulheres", description: "Aciona o ministério de mulheres." },
  { id: "acao_social", label: "Ação Social", description: "Aciona o ministério de ação social." },
  { id: "esportes", label: "Esportes", description: "Aciona o ministério de esportes." },
  { id: "ensino", label: "Ensino", description: "Aciona o ministério de ensino." },
  { id: "mensageiras_do_rei", label: "Mensageiras do Rei", description: "Aciona o ministério Mensageiras do Rei." },
  { id: "infantil", label: "Infantil", description: "Aciona o ministério infantil." },
  { id: "missoes", label: "Missões", description: "Aciona o ministério de missões." },
  { id: "eventos", label: "Eventos", description: "Aciona o ministério de eventos." },
  { id: "casais", label: "Casais", description: "Aciona o ministério de casais." },
  { id: "cr", label: "CR", description: "Aciona o ministério CR." }
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

function hideFeedback() {
  feedback.classList.add("hidden");
  feedback.textContent = "";
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}

function validateDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return endDate > startDate;
}

function createHiddenIframe() {
  const iframeName = "apps_script_hidden_iframe";

  let iframe = document.querySelector(`iframe[name="${iframeName}"]`);

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  return iframeName;
}

function appendHiddenField(tempForm, name, value) {
  if (Array.isArray(value)) {
    value.forEach(item => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = item;
      tempForm.appendChild(input);
    });
    return;
  }

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value ?? "";
  tempForm.appendChild(input);
}

function sendViaHiddenForm(payload) {
  const iframeName = createHiddenIframe();

  const tempForm = document.createElement("form");
  tempForm.method = "POST";
  tempForm.action = API_URL;
  tempForm.target = iframeName;
  tempForm.style.display = "none";

  appendHiddenField(tempForm, "nomeEvento", payload.nomeEvento);
  appendHiddenField(tempForm, "nomeResponsavel", payload.nomeResponsavel);
  appendHiddenField(tempForm, "contato", payload.contato);
  appendHiddenField(tempForm, "dataHoraInicio", payload.dataHoraInicio);
  appendHiddenField(tempForm, "dataHoraFim", payload.dataHoraFim);
  appendHiddenField(tempForm, "espacos", payload.espacos);
  appendHiddenField(tempForm, "objetivo", payload.objetivo);
  appendHiddenField(tempForm, "ministerios", payload.ministerios);

  document.body.appendChild(tempForm);
  tempForm.submit();
  document.body.removeChild(tempForm);
}

function handleSubmit(event) {
  event.preventDefault();
  hideFeedback();

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
    nomeResponsavel: form.responsavel.value.trim(),
    contato: form.contato.value.trim(),
    dataHoraInicio: form.dataInicio.value,
    dataHoraFim: form.dataFim.value,
    espacos,
    objetivo: form.objetivo.value.trim(),
    ministerios
  };

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    sendViaHiddenForm(payload);
    showFeedback("Solicitação enviada com sucesso. Verifique a planilha e os e-mails dos ministérios selecionados.", "success");
    form.reset();
  } catch (error) {
    console.error(error);
    showFeedback("Erro inesperado ao enviar a solicitação.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar solicitação";
  }
}

renderCheckboxGroup(spacesContainer, SPACES, "espacos");
renderCheckboxGroup(ministriesContainer, MINISTRIES, "ministerios");
form.addEventListener("submit", handleSubmit);
