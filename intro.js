// Intro de entrada (~2s): as partículas em triângulo se juntam e formam o "C" do logo,
// o nome CONNECT BPO aparece e o logo desliza para o topo, revelando o site.
// Só roda quando o <head> marcou html.com-intro (primeira visita da sessão).
(() => {
  "use strict";
  const html = document.documentElement;
  const intro = document.getElementById("intro");
  if (!intro) return;
  if (!html.classList.contains("com-intro")) { intro.remove(); return; }
  try { sessionStorage.setItem("cbpo-intro", "1"); } catch (e) { /* sem storage: roda só desta vez */ }

  const canvas = intro.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const logo = intro.querySelector(".intro-logo");
  const logoTopo = document.querySelector(".brand img");

  let acabou = false, saindo = false, raf = 0;
  const timers = [];
  const depois = (ms, fn) => timers.push(setTimeout(fn, ms));
  const fim = () => {
    if (acabou) return;
    acabou = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    html.classList.remove("com-intro");
    intro.remove();
  };
  // Pular: some rápido.
  const pular = () => { if (saindo) return; saindo = true; intro.classList.add("saindo"); setTimeout(fim, 320); };
  intro.addEventListener("click", pular);
  addEventListener("keydown", pular, { once: true });
  addEventListener("resize", pular, { once: true });
  setTimeout(fim, 5000); // segurança: nunca prende o visitante

  const comecar = () => {
    if (saindo || acabou) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Lê os pixels do logo no tamanho em que ele vai aparecer, para saber onde fica o "C".
    const r = logo.getBoundingClientRect();
    const lw = Math.max(1, Math.round(r.width)), lh = Math.max(1, Math.round(r.height));
    const off = document.createElement("canvas");
    off.width = lw; off.height = lh;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(logo, 0, 0, lw, lh);
    let px;
    try { px = octx.getImageData(0, 0, lw, lh).data; } catch (e) { return pular(); }
    const alfa = (x, y) => px[(y * lw + x) * 4 + 3];

    // Fim do símbolo = primeira faixa de colunas vazias depois do começo do desenho.
    let inicio = -1, fimSimbolo = Math.round(lw * 0.3), vazias = 0;
    for (let x = 0; x < lw; x++) {
      let tem = false;
      for (let y = 0; y < lh; y += 2) if (alfa(x, y) > 40) { tem = true; break; }
      if (tem && inicio < 0) inicio = x;
      if (inicio >= 0) {
        vazias = tem ? 0 : vazias + 1;
        if (vazias >= Math.max(3, lw * 0.015)) { fimSimbolo = x - vazias + 1; break; }
      }
    }
    const corteTexto = 100 - ((fimSimbolo + 2) / lw) * 100;
    logo.style.setProperty("--corte", `${corteTexto}%`);

    // Alvos: pontos dentro do "C".
    const passo = Math.max(3, Math.round(fimSimbolo / 34));
    let alvos = [];
    for (let y = 0; y < lh; y += passo) for (let x = 0; x < fimSimbolo; x += passo) {
      if (alfa(x, y) > 150) alvos.push([r.left + x + (Math.random() - 0.5) * passo, r.top + y + (Math.random() - 0.5) * passo]);
    }
    const maximo = W < 600 ? 360 : 620;
    if (alvos.length > maximo) alvos = alvos.sort(() => Math.random() - 0.5).slice(0, maximo);
    if (!alvos.length) return pular();

    const cores = ["#1976d2", "#42a5f5", "#5fb3f7", "#90caf9", "#2b5fd9", "#7fd3ff", "#ffffff", "#ffb829"];
    const pesos = [22, 20, 16, 10, 10, 8, 6, 2];
    const cor = () => {
      let s = Math.random() * 94;
      for (let i = 0; i < cores.length; i++) { s -= pesos[i]; if (s <= 0) return cores[i]; }
      return cores[0];
    };
    const diag = Math.hypot(W, H);
    const particulas = alvos.map(([tx, ty]) => {
      const ang = Math.random() * Math.PI * 2, dist = diag * (0.35 + Math.random() * 0.45);
      return {
        x0: W / 2 + Math.cos(ang) * dist, y0: H / 2 + Math.sin(ang) * dist, tx, ty,
        t: 1.4 + Math.random() * 2.4, rot0: Math.random() * Math.PI * 4, cor: cor(),
        atraso: Math.random() * 260, dur: 700 + Math.random() * 260,
      };
    });
    const suave = (k) => 1 - Math.pow(1 - k, 3);

    const t0 = performance.now();
    const quadro = (agora) => {
      const t = agora - t0;
      ctx.clearRect(0, 0, W, H);
      for (const p of particulas) {
        const k = Math.min(1, Math.max(0, (t - p.atraso) / p.dur));
        const e = suave(k);
        const x = p.x0 + (p.tx - p.x0) * e, y = p.y0 + (p.ty - p.y0) * e;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(p.rot0 * (1 - e));
        ctx.globalAlpha = Math.min(1, k * 3);
        ctx.strokeStyle = p.cor; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.t); ctx.lineTo(p.t * 0.87, p.t * 0.5); ctx.lineTo(-p.t * 0.87, p.t * 0.5); ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      if (t < 1500 && !acabou) raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);

    // 0,95s: o "C" de verdade aparece sobre as partículas, que somem.
    depois(950, () => { logo.style.opacity = "1"; canvas.style.opacity = "0"; });
    // 1,2s: o nome CONNECT BPO entra da esquerda para a direita.
    depois(1200, () => logo.style.setProperty("--corte", "0%"));
    // 1,85s: o logo desliza para o lugar dele no topo e o site aparece.
    depois(1850, () => {
      if (saindo) return;
      saindo = true;
      const de = logo.getBoundingClientRect();
      const para = logoTopo ? logoTopo.getBoundingClientRect() : null;
      intro.classList.add("revelando");
      html.classList.remove("com-intro"); // libera a rolagem e anima a abertura do site
      html.classList.add("intro-voando");
      if (!para || !para.width) { setTimeout(fim, 600); return; }
      Object.assign(logo.style, { transition: "none", transform: "none", left: `${de.left}px`, top: `${de.top}px`, width: `${de.width}px`, transformOrigin: "0 0" });
      if (logoTopo) logoTopo.style.opacity = "0";
      logo.animate(
        [{ transform: "translate(0, 0) scale(1)" }, { transform: `translate(${para.left - de.left}px, ${para.top - de.top}px) scale(${para.width / de.width})` }],
        { duration: 650, easing: "cubic-bezier(.65, 0, .25, 1)", fill: "forwards" },
      ).finished.then(() => {
        if (logoTopo) logoTopo.style.opacity = "";
        html.classList.remove("intro-voando");
        fim();
      }, fim);
    });
  };

  // Espera o logo carregar; se a conexão estiver lenta, entra direto no site.
  const pronto = logo.decode ? logo.decode() : new Promise((ok) => (logo.complete ? ok() : logo.addEventListener("load", ok, { once: true })));
  Promise.race([pronto, new Promise((_, nao) => setTimeout(nao, 1500))]).then(comecar, fim);
})();
