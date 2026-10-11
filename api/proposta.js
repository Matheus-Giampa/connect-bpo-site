// Função da Vercel: recebe o formulário "Solicitar proposta" e envia para a caixa da empresa.
// Usa o mesmo SMTP da Hostinger do sistema. Variáveis na Vercel:
//   SMTP_HOST, SMTP_USER, SMTP_PASS (obrigatórias), SMTP_PORT (opcional, padrão 465),
//   PROPOSTA_PARA (opcional, padrão adm@bpoconnect.com.br).
// No GitHub Pages esta função não roda: lá o formulário abre o e-mail do visitante.
const nodemailer = require("nodemailer");

const tentativas = new Map(); // limite simples por IP (melhor esforço, por instância)
const LIMITE = 5, JANELA_MS = 10 * 60 * 1000;

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const txt = (v, max) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const agora = Date.now();
  const lista = (tentativas.get(ip) || []).filter((t) => agora - t < JANELA_MS);
  if (lista.length >= LIMITE) return res.status(429).json({ ok: false });
  tentativas.set(ip, [...lista, agora]);

  const b = typeof req.body === "object" && req.body ? req.body : {};
  if (b.site) return res.status(200).json({ ok: true }); // campo-isca preenchido: robô
  const d = {
    nome: txt(b.nome, 120), empresa: txt(b.empresa, 160), whatsapp: txt(b.whatsapp, 20), email: txt(b.email, 160),
    plano: txt(b.plano, 60),
    servicos: (Array.isArray(b.servicos) ? b.servicos : []).slice(0, 6).map((s) => txt(s, 40)),
    mensagem: String(b.mensagem ?? "").trim().slice(0, 1500),
  };
  if (d.nome.length < 2 || d.empresa.length < 2 || d.whatsapp.replace(/\D/g, "").length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
    return res.status(400).json({ ok: false });
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return res.status(503).json({ ok: false });

  const linhas = [
    ["Nome", d.nome], ["Empresa", d.empresa], ["WhatsApp", d.whatsapp], ["E-mail", d.email],
    ["Serviços de interesse", d.servicos.join(", ") || "não informado"], ["Plano de interesse", d.plano || "ainda não sei"],
  ];
  const porta = Number(process.env.SMTP_PORT || 465);
  try {
    await nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: porta, secure: porta === 465, requireTLS: porta !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 10000,
    }).sendMail({
      from: `Site CONNECT BPO <${process.env.SMTP_USER}>`,
      to: process.env.PROPOSTA_PARA || "adm@bpoconnect.com.br",
      replyTo: d.email,
      subject: `Pedido de proposta — ${d.empresa}`,
      text: linhas.map(([k, v]) => `${k}: ${v}`).join("\n") + (d.mensagem ? `\n\nMensagem:\n${d.mensagem}` : ""),
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2 style="color:#0d1b3e">Pedido de proposta pelo site</h2>`
        + `<table cellpadding="6">${linhas.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>`
        + (d.mensagem ? `<p><b>Mensagem:</b><br>${esc(d.mensagem).replace(/\n/g, "<br>")}</p>` : "") + `</div>`,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[proposta] falha no envio:", e instanceof Error ? e.message : "erro");
    return res.status(502).json({ ok: false });
  }
};
