# Site de Solicitação de Eventos com GitHub Pages

Este projeto publica um formulário estático no GitHub Pages e usa **Google Apps Script** como backend para:

- receber o envio do formulário;
- salvar a solicitação no Google Sheets;
- enviar e-mails apenas para os líderes dos ministérios marcados;
- opcionalmente enviar WhatsApp via API.

## Campos do formulário

- Nome do evento
- Nome do responsável
- Contato
- Data e hora do início
- Data e hora do fim
- Espaços da igreja
- Objetivo do evento
- Ministérios que precisam ser acionados

## Espaços cadastrados

- Templo Maior
- Templo Menor
- Sala dos líderes
- Salão vermelho
- Sala Azul
- Sala da juventude
- Cozinha
- Gramado
- Área de Lazer
- Piscina

## Ministérios cadastrados

- Sonoplastia
- Mídia
- Comunicação
- Recepção
- Infantil
- Louvor

## Estrutura

- `index.html` → página do formulário
- `styles.css` → estilos
- `script.js` → envio do formulário para o backend
- `apps-script/Code.gs` → backend do Google Apps Script
- `.github/workflows/static.yml` → deploy automático no GitHub Pages

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto para a branch `main`.
3. No GitHub, abra **Settings > Pages**.
4. Em **Build and deployment**, use **GitHub Actions**.
5. Ao fazer push na `main`, a action vai publicar o site.
6. A URL ficará parecida com:
   - `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

## Como configurar o backend

### 1) Planilha

1. Crie uma planilha no Google Sheets.
2. Copie o ID da URL da planilha.
3. Cole em `CONFIG.spreadsheetId` no arquivo `apps-script/Code.gs`.

### 2) Apps Script

1. Acesse o Google Apps Script.
2. Crie um projeto.
3. Cole o conteúdo de `apps-script/Code.gs`.
4. Ajuste os líderes em `CONFIG.ministries`.
5. Clique em **Deploy > New deployment > Web app**.
6. Publique o projeto com acesso apropriado.
7. Copie a URL do Web App.
8. Cole essa URL na constante `API_URL` do arquivo `script.js`.

## Configuração dos líderes

Dentro de `CONFIG.ministries`, você define quem recebe cada solicitação. Exemplo:

```javascript
sonoplastia: {
  label: 'Sonoplastia',
  emails: ['lider.sonoplastia@exemplo.com'],
  whatsapp: ['5521999999999']
}
```

Assim, somente os ministérios marcados no formulário serão notificados.

## Observações importantes

- GitHub Pages hospeda apenas frontend estático.
- O envio de e-mail e WhatsApp precisa passar pelo Apps Script.
- O WhatsApp exige API configurada e token válido.
