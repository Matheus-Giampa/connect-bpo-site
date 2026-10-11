# CONNECT BPO — site institucional

Site estático (HTML, CSS e JS puros), sem etapa de build.

- `index.html`: conteúdo de todas as seções
- `styles.css`: visual
- `main.js`: menu, vídeo, animação, calculadora e formulário
- `config.js`: **WhatsApp, e-mail e envio do formulário** (edite aqui)
- `api/proposta.js`: função da Vercel que manda o formulário por e-mail (SMTP)
- `assets/`: logo, símbolo, vídeo (comprimido) e capa do vídeo

## Formulário de proposta
- **GitHub Pages:** não há servidor; ao enviar, abre o e-mail do visitante já preenchido para adm@bpoconnect.com.br e oferece o botão do WhatsApp com os dados.
- **Vercel:** o formulário chama `/api/proposta`, que envia o e-mail direto. Configure na Vercel:
  `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (os mesmos do sistema) e, se quiser, `SMTP_PORT` e `PROPOSTA_PARA`.
  Se o envio falhar, o site volta a abrir o e-mail do visitante.

## Antes de publicar no domínio definitivo
- Remover `<meta name="robots" content="noindex, nofollow">` do `index.html`.
- Trocar `og:image` por um endereço completo (`https://seudominio/assets/video-capa.jpg`).

## Rodar localmente
```
python3 -m http.server 8094
```
