# Obreasy Mobile — Guia de Desenvolvimento iOS

App nativo iOS/Android gerado com [Capacitor](https://capacitorjs.com/). O WebView carrega `https://www.obreasy.com.br` em produção.

---

## Pré-requisitos

- macOS com **Xcode 15+** instalado (App Store)
- **Node.js 22+** e **pnpm**
- Conta Apple (gratuita para simulador, Apple Developer $99/ano para dispositivo físico)

---

## Rodar no simulador iOS

### 1. Instalar dependências (apenas na primeira vez)

```bash
pnpm install
```

### 2. Sincronizar o projeto nativo

Sempre que alterar `capacitor.config.ts` ou adicionar plugins:

```bash
pnpm exec cap sync ios
```

### 3. Abrir no Xcode

```bash
pnpm exec cap open ios
```

### 4. Rodar no Xcode

1. No seletor de dispositivo (barra superior), escolha um **iPhone** (ex: iPhone 15 Pro)
2. Selecione o target **App**
3. Clique em **▶ Run** ou pressione `Cmd + R`

O simulador vai abrir e carregar `https://www.obreasy.com.br` no WebView.

---

## Fluxo de atualização

### Mudança apenas no código web (Next.js)

Faça deploy para o Vercel e recarregue o app no simulador — não precisa recompilar o Xcode.

```bash
./scripts/deploy.sh
```

Depois no simulador: puxe para baixo para recarregar ou dê **Stop + Run** no Xcode.

### Mudança em configurações nativas (capacitor.config.ts, plugins)

```bash
pnpm exec cap sync ios
# Xcode → Stop → Run
```

---

## Testar em dispositivo físico

1. Conecte o iPhone via cabo
2. No Xcode, vá em **Signing & Capabilities**
3. Marque **Automatically manage signing**
4. Selecione seu **Team** (Apple ID)
5. Selecione o iPhone na barra de dispositivos
6. Clique em **▶ Run**

---

## Estrutura dos arquivos nativos

```
ios/
└── App/
    ├── App/
    │   ├── Assets.xcassets/     # Ícones e splash screen
    │   │   ├── AppIcon.appiconset/
    │   │   └── Splash.imageset/
    │   ├── Info.plist           # Configurações do app
    │   └── public/              # Assets web (placeholder)
    └── App.xcodeproj/

assets/
├── icon.png          # Ícone fonte 1024x1024
├── splash.png        # Splash fonte 2732x2732
├── icon-foreground.png
└── icon-background.png
```

---

## Atualizar ícone ou splash

Substitua os arquivos em `assets/` e rode o script Python:

```bash
python3 scripts/generate-icons.py
pnpm exec cap sync ios
```

---

## Comandos úteis

| Comando | O que faz |
|---|---|
| `pnpm exec cap sync` | Sincroniza config e plugins com Android e iOS |
| `pnpm exec cap sync ios` | Sincroniza apenas iOS |
| `pnpm exec cap open ios` | Abre o projeto no Xcode |
| `pnpm exec cap open android` | Abre o projeto no Android Studio |
| `./scripts/deploy.sh` | Deploy para produção na Vercel |
| `./scripts/deploy.sh --preview` | Deploy de preview na Vercel |
