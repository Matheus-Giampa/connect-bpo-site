(() => {
  "use strict";
  const CFG = window.CONNECT_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduzMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- WhatsApp ---------- */
  const waNumero = String(CFG.whatsapp || "").replace(/\D/g, "");
  const waLink = (texto) => `https://wa.me/${waNumero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
  const waFormatado = waNumero.length >= 12
    ? `(${waNumero.slice(2, 4)}) ${waNumero.slice(4, -4)}-${waNumero.slice(-4)}`
    : "";
  $$("[data-wa]").forEach((a) => {
    if (!waNumero) { (a.closest("li") || a).hidden = true; return; }
    a.href = waLink("Olá! Vim pelo site e gostaria de saber mais sobre os serviços da CONNECT BPO.");
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-wa-label]").forEach((s) => { if (waFormatado) s.textContent = `WhatsApp ${waFormatado}`; });

  $("#ano").textContent = new Date().getFullYear();

  /* ---------- Topo e menu ---------- */
  const topbar = $(".topbar");
  const aoRolar = () => topbar.classList.toggle("scrolled", scrollY > 12);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const menuBtn = $(".menu-btn");
  const menu = $("#menu");
  const fecharMenu = () => { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn.addEventListener("click", () => {
    const aberto = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(aberto));
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", fecharMenu));
  addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });

  // Item do menu ativo conforme a seção visível.
  const linksMenu = $$('.nav a[href^="#"]:not(.btn)');
  const secoes = linksMenu.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const obsSecao = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      linksMenu.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  secoes.forEach((s) => obsSecao.observe(s));

  /* ---------- Entrada suave ---------- */
  const obsReveal = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obsReveal.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => obsReveal.observe(el));

  /* ---------- Vídeo ---------- */
  const video = $("#video-bpo");
  const play = $(".video-play");
  if (video && play) {
    video.controls = false;
    const tocar = () => { play.hidden = true; video.controls = true; video.play().catch(() => {}); };
    play.addEventListener("click", tocar);
    video.addEventListener("play", () => { play.hidden = true; video.controls = true; });
    // Começa sozinho (sem som) quando aparece na tela, se a pessoa não pediu menos movimento.
    if (!reduzMovimento && "IntersectionObserver" in window) {
      let jaTocou = false;
      new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.55) {
            if (!jaTocou) { jaTocou = true; tocar(); } else if (video.dataset.pausadoPorRolagem) { delete video.dataset.pausadoPorRolagem; video.play().catch(() => {}); }
          } else if (!e.isIntersecting && !video.paused) {
            video.dataset.pausadoPorRolagem = "1";
            video.pause();
          }
        });
      }, { threshold: [0, 0.55] }).observe(video);
    }
  }

  /* ---------- Constelação (abertura) ---------- */
  const canvas = $("#constelacao");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const cores = ["#1976d2", "#42a5f5", "#5fb3f7", "#90caf9", "#2b5fd9", "#7fd3ff", "#ffffff", "#ffb829"];
    const pesos = [22, 20, 16, 10, 10, 8, 6, 2];
    const sorteiaCor = () => {
      let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
      for (let i = 0; i < cores.length; i++) { r -= pesos[i]; if (r <= 0) return cores[i]; }
      return cores[0];
    };
    let w = 0, h = 0, dpr = 1, particulas = [];
    const criar = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 420 ? 420 : 760;
      particulas = Array.from({ length: n }, (_, i) => {
        const ambiente = i % 6 === 0;
        // Arco em forma de "C": aberto à direita, como o símbolo da marca.
        const ang = ambiente ? Math.random() * Math.PI * 2 : (0.28 + Math.random() * 1.44) * Math.PI;
        const base = ambiente ? 0.2 + Math.random() * 0.3 : 0.31 + (Math.random() - 0.5) * 0.11 * (1 + Math.random());
        return {
          ang, raio: base, cor: sorteiaCor(),
          t: 1.6 + Math.random() * (ambiente ? 2 : 3.6),
          rot: Math.random() * Math.PI * 2, giro: (Math.random() - 0.5) * 0.02,
          fase: Math.random() * Math.PI * 2, vel: (0.0007 + Math.random() * 0.0012) * (Math.random() < 0.5 ? 1 : -1) * (ambiente ? 1 : 0.35),
          alfa: ambiente ? 0.25 + Math.random() * 0.3 : 0.55 + Math.random() * 0.45,
        };
      });
    };
    let mx = 0, my = 0;
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    });
    const desenhar = (tempo) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, s = Math.min(w, h);
      for (const p of particulas) {
        if (!reduzMovimento) { p.ang += p.vel; p.rot += p.giro; }
        const pulso = reduzMovimento ? 1 : 0.75 + 0.25 * Math.sin(tempo / 900 + p.fase);
        const r = p.raio * s * (reduzMovimento ? 1 : 1 + 0.015 * Math.sin(tempo / 1400 + p.fase));
        const x = cx + Math.cos(p.ang) * r + mx * 18 * p.raio;
        const y = cy + Math.sin(p.ang) * r + my * 18 * p.raio;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.alfa * pulso;
        ctx.strokeStyle = p.cor; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.t); ctx.lineTo(p.t * 0.87, p.t * 0.5); ctx.lineTo(-p.t * 0.87, p.t * 0.5); ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };
    let visivel = true, rodando = false;
    const loop = (t) => { if (!visivel) { rodando = false; return; } desenhar(t); requestAnimationFrame(loop); };
    const iniciar = () => { if (!rodando && !reduzMovimento) { rodando = true; requestAnimationFrame(loop); } };
    criar();
    desenhar(0);
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) iniciar(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { visivel = !document.hidden; if (visivel) iniciar(); });
    let espera;
    addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(() => { criar(); desenhar(performance.now()); }, 150); });
  }

  /* ---------- Calculadora ---------- */
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lerValor = (txt) => {
    let t = String(txt || "").replace(/[^\d.,]/g, "");
    if (!t) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^\d+\.\d{1,2}$/.test(t)) { /* 3500.50: ponto como decimal */ }
    else t = t.replace(/\./g, "");
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 999999999) : null;
  };
  const campos = {
    salario: $("#c-salario"), encargos: $("#c-encargos"), beneficios: $("#c-beneficios"),
    outros: $("#c-outros"), sistema: $("#c-sistema"), bpo: $("#c-bpo"),
  };
  const calcular = () => {
    const v = Object.fromEntries(Object.entries(campos).map(([k, el]) => [k, lerValor(el.value)]));
    const pronto = v.salario > 0 && v.bpo > 0;
    $("#calc-empty").hidden = pronto;
    $("#calc-result").hidden = !pronto;
    if (!pronto) return;

    const interno = v.salario + (v.encargos || 0) + (v.beneficios || 0) + (v.outros || 0) + (v.sistema || 0);
    const dif = interno - v.bpo;
    const anual = dif * 12;
    const pct = (dif / interno) * 100;
    const pos = dif > 0.004, neg = dif < -0.004;

    $("#r-interno").textContent = brl.format(interno);
    $("#r-bpo").textContent = brl.format(v.bpo);
    $("#r-dif").textContent = brl.format(Math.abs(dif));
    $("#r-ano").textContent = brl.format(Math.abs(anual));
    $("#r-pct").textContent = `${numero.format(Math.abs(pct))}%`;
    $("#r-dif-label").textContent = pos ? "Economia mensal estimada" : neg ? "BPO acima do custo interno (mês)" : "Diferença mensal";
    $("#r-ano-label").textContent = pos ? "Economia anual estimada" : neg ? "Diferença anual (BPO acima)" : "Diferença anual estimada";
    $("#r-pct-label").textContent = pos ? "Percentual estimado de economia" : neg ? "Percentual acima do custo interno" : "Percentual estimado";
    ["#r-dif-box", "#r-ano-box", "#r-pct-box"].forEach((s) => {
      $(s).classList.toggle("pos", pos);
      $(s).classList.toggle("neg", neg);
    });
    $("#r-note").textContent = pos
      ? `Com os valores informados, a proposta de BPO custa ${brl.format(Math.abs(dif))} a menos por mês do que a estrutura interna.`
      : neg
        ? `Com os valores informados, a proposta de BPO custa ${brl.format(Math.abs(dif))} a mais por mês do que a estrutura interna. Vale comparar também o escopo: serviços, volumes, cobertura de ausências e sistema incluídos.`
        : "Com os valores informados, os dois custos são equivalentes.";

    const maior = Math.max(interno, v.bpo);
    $("#b-interno").style.width = `${(interno / maior) * 100}%`;
    $("#b-bpo").style.width = `${(v.bpo / maior) * 100}%`;
    $("#b-interno-v").textContent = brl.format(interno);
    $("#b-bpo-v").textContent = brl.format(v.bpo);
  };
  Object.values(campos).forEach((el) => {
    el.addEventListener("input", () => {
      const limpo = el.value.replace(/[^\d.,]/g, "");
      if (limpo !== el.value) el.value = limpo;
      calcular();
    });
    el.addEventListener("blur", () => {
      const n = lerValor(el.value);
      el.value = n === null ? "" : numero.format(n);
      calcular();
    });
  });

  /* ---------- Formulário de proposta ---------- */
  const form = $("#proposta");
  const status = $("#form-status");
  const done = $("#form-done");
  const plano = $("#f-plano");

  // Botões dos planos já escolhem o plano no formulário.
  $$("[data-plano]").forEach((a) => a.addEventListener("click", () => { plano.value = a.dataset.plano; }));

  const endpoint = (() => {
    const e = CFG.formEndpoint;
    if (e && e !== "auto") return e;
    if (e === "auto" && location.protocol.startsWith("http") && !location.hostname.endsWith("github.io")) return "/api/proposta";
    return null;
  })();

  const montarTexto = (d) => [
    "Pedido de proposta — site CONNECT BPO",
    "",
    `Nome: ${d.nome}`,
    `Empresa: ${d.empresa}`,
    `WhatsApp: ${d.whatsapp}`,
    `E-mail: ${d.email}`,
    `Serviços de interesse: ${d.servicos.length ? d.servicos.join(", ") : "não informado"}`,
    `Plano de interesse: ${d.plano || "ainda não sei"}`,
    d.mensagem ? `\nMensagem:\n${d.mensagem}` : "",
  ].join("\n").trim();

  const marcarErro = (el, msg) => { el.setAttribute("aria-invalid", "true"); status.textContent = msg; status.className = "form-status err"; el.focus(); };

  form.addEventListener("input", (e) => { if (e.target.hasAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid"); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = ""; status.className = "form-status";
    const fd = new FormData(form);
    const d = {
      nome: String(fd.get("nome") || "").trim(),
      empresa: String(fd.get("empresa") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      servicos: fd.getAll("servicos").map(String),
      plano: String(fd.get("plano") || ""),
      mensagem: String(fd.get("mensagem") || "").trim(),
      site: String(fd.get("site") || ""),
    };
    if (d.site) return; // robô preencheu o campo escondido
    if (d.nome.length < 2) return marcarErro($("#f-nome"), "Informe o seu nome.");
    if (d.empresa.length < 2) return marcarErro($("#f-empresa"), "Informe o nome da empresa.");
    if (d.whatsapp.replace(/\D/g, "").length < 10) return marcarErro($("#f-whatsapp"), "Informe um WhatsApp com DDD.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return marcarErro($("#f-email"), "Informe um e-mail válido.");

    const texto = montarTexto(d);
    const botao = $("#f-enviar");
    let enviadoPorEmail = false;

    if (endpoint) {
      botao.disabled = true; botao.textContent = "Enviando…";
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
        enviadoPorEmail = r.ok;
      } catch { enviadoPorEmail = false; }
      botao.disabled = false; botao.textContent = "Quero minha proposta personalizada";
    }

    if (!enviadoPorEmail) {
      // Sem servidor (GitHub Pages) ou falha no envio: abre o e-mail do visitante já preenchido.
      const assunto = `Pedido de proposta — ${d.empresa}`;
      location.href = `mailto:${CFG.email || "adm@bpoconnect.com.br"}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
    }

    $("#form-done-text").textContent = enviadoPorEmail
      ? "Recebemos o seu pedido e vamos entrar em contato para montar a sua proposta personalizada. Se preferir, fale com a gente agora pelo WhatsApp."
      : "Abrimos o seu aplicativo de e-mail com o pedido já preenchido: é só enviar. Se preferir, mande as mesmas informações pelo WhatsApp.";
    const doneWa = $("#done-wa");
    if (waNumero) doneWa.href = waLink(texto); else doneWa.hidden = true;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  $("#form-novo").addEventListener("click", () => {
    form.reset();
    done.hidden = true;
    form.hidden = false;
    $("#f-nome").focus();
  });
})();
