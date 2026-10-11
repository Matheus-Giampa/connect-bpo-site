// Configuração do site — edite aqui, sem mexer no resto do código.
window.CONNECT_CONFIG = {
  // WhatsApp com DDI + DDD + número, só dígitos. Vazio = esconde os botões de WhatsApp.
  whatsapp: "5511918379501",

  // E-mail que aparece como alternativa quando o envio automático não está disponível.
  email: "adm@bpoconnect.com.br",

  // Endereço que recebe o formulário e manda o e-mail (função api/proposta.js).
  // "auto": usa /api/proposta quando o site está na Vercel; no GitHub Pages (sem servidor)
  // o formulário abre o e-mail do visitante já preenchido.
  formEndpoint: "auto",
};
