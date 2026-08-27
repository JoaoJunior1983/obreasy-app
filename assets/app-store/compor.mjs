import fs from "fs"
import { execFileSync } from "child_process"

const SHOTS = process.argv[2]
const OUT = process.argv[3]
const W = Number(process.argv[4] || 1290)
const H = Number(process.argv[5] || 2796)
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

fs.mkdirSync(OUT, { recursive: true })

const telas = [
  { src: "01-minhas-obras",   l1: "Todas as suas obras",        l2: "em um só lugar" },
  { src: "02-dashboard-obra", l1: "Quanto entrou e quanto",     l2: "saiu, em tempo real" },
  { src: "03-despesas",       l1: "Cada gasto da obra",         l2: "registrado pelo celular" },
  { src: "04-profissionais",  l1: "Profissionais e pagamentos", l2: "sempre organizados" },
  { src: "06-custo-m2",       l1: "O custo por m² calculado",   l2: "sozinho pra você" },
]

const html = (b64, l1, l2) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;overflow:hidden;position:relative;
       background:radial-gradient(120% 80% at 50% 0%, #16407c 0%, #0B3064 38%, #071b3a 68%, #050b18 100%);
       font-family:'Archivo',-apple-system,'Helvetica Neue',sans-serif}
  .grid{position:absolute;inset:0;opacity:.55;
        background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),
                         linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
        background-size:${Math.round(W/10)}px ${Math.round(W/10)}px}
  .glow{position:absolute;left:50%;top:-14%;transform:translateX(-50%);
        width:${Math.round(W*1.15)}px;height:${Math.round(W*1.15)}px;border-radius:50%;
        background:radial-gradient(circle,rgba(126,170,238,.28) 0%,rgba(126,170,238,0) 62%)}
  .wrap{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;
        padding:${Math.round(H*0.048)}px ${Math.round(W*0.062)}px 0}
  h1{font-variation-settings:'wdth' 105,'wght' 800;font-size:${Math.round(W*0.077)}px;line-height:1.14;
     color:#fff;text-align:center;letter-spacing:-.02em;text-wrap:balance}
  h1 span{color:#8fbaf5;display:block}
  .rule{width:${Math.round(W*0.12)}px;height:${Math.round(W*0.008)}px;background:#F5A623;
        border-radius:99px;margin:${Math.round(H*0.026)}px 0 0}
  .phone{position:relative;margin-top:${Math.round(H*0.042)}px;width:${Math.round(W*0.76)}px;
         border-radius:${Math.round(W*0.062)}px;padding:${Math.round(W*0.009)}px;
         background:linear-gradient(160deg,rgba(255,255,255,.34),rgba(255,255,255,.06) 42%,rgba(255,255,255,.16));
         box-shadow:0 ${Math.round(W*0.028)}px ${Math.round(W*0.075)}px rgba(0,0,0,.62),
                    0 0 ${Math.round(W*0.11)}px rgba(126,170,238,.16)}
  .screen{border-radius:${Math.round(W*0.054)}px;overflow:hidden;background:#0a0a0a;display:block}
  .screen img{width:100%;display:block}
</style></head><body>
<div class="grid"></div><div class="glow"></div>
<div class="wrap">
  <h1>${l1}<span>${l2}</span></h1>
  <div class="rule"></div>
  <div class="phone"><div class="screen"><img src="data:image/png;base64,${b64}"></div></div>
</div></body></html>`

for (const t of telas) {
  const b64 = fs.readFileSync(`${SHOTS}/${t.src}.png`).toString("base64")
  const f = `/tmp/compose-${t.src}.html`
  fs.writeFileSync(f, html(b64, t.l1, t.l2))
  const dest = `${OUT}/${t.src}.png`
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    `--window-size=${W},${H}`, `--screenshot=${dest}`,
    "--virtual-time-budget=6000", `file://${f}`,
  ], { stdio: "ignore" })
  console.log("  ✓", dest)
}
console.log("pronto")
