# Passo a passo: configurar RevenueCat + App Store Connect + Google Play Console

Status atual:
- ✅ Código do app já está pronto (compra nativa, webhook, banco de dados).
- ✅ Migration do banco já foi aplicada em produção (`user_profiles` tem `payment_provider`/`store_platform`/`revenuecat_app_user_id`/`revenuecat_product_id`, e a tabela `revenuecat_webhook_logs` já existe).
- ✅ `pnpm exec cap sync` já rodado — os projetos `ios/` e `android/` já têm o SDK do RevenueCat.
- ⬜ Falta você fazer as configurações abaixo, que são todas em dashboards externos (não dá pra automatizar por aqui).

Siga na ordem: **1 → 2 → 3 → 4 → 5**. Os identificadores abaixo (`com.obreasy.app.essencial.monthly`, etc.) já estão escritos no código em `src/lib/revenuecat-plans.ts` — **use exatamente esses nomes** nos passos 1 e 2, ou o app não vai encontrar os produtos.

---

## Passo 1 — App Store Connect (criar os produtos do iOS)

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → selecione o app Obreasy.
2. No menu lateral, vá em **Recursos do App (Features) → Assinaturas (Subscriptions)**.
3. Clique em **"+"** para criar um **Grupo de Assinaturas**. Nome: `Obreasy Assinatura`.
4. Dentro do grupo, crie 4 assinaturas (botão "+" ao lado de "Subscriptions"), uma de cada vez, nesta ordem (do menor pro maior nível — importante pro upgrade funcionar certo):

   | # | Reference Name (interno, só você vê) | Product ID (copiar exatamente) | Preço | Duração |
   |---|---|---|---|---|
   | 1 | Essencial Mensal | `com.obreasy.app.essencial.monthly` | R$ 29,90 | 1 mês |
   | 2 | Essencial Anual | `com.obreasy.app.essencial.annual` | R$ 304,80 | 1 ano |
   | 3 | Profissional Mensal | `com.obreasy.app.profissional.monthly` | R$ 49,90 | 1 mês |
   | 4 | Profissional Anual | `com.obreasy.app.profissional.annual` | R$ 509,00 | 1 ano |

5. Em **cada** uma das 4, preencha:
   - **Display Name** (o que o usuário vê, ex: "Obreasy Essencial Mensal")
   - **Description** — texto sem citar nenhuma outra plataforma (isso resolve a Guideline 2.3.10 que rejeitou o app). Exemplo:
     > "Assinatura Obreasy Essencial: acesso a 1 obra ativa, controle financeiro, relatórios em PDF e alertas de orçamento."
   - **App Store Localization** (pt-BR): mesmo texto acima
   - **Review Screenshot**: um print de tela do app mostrando a tela de planos (obrigatório pra aprovação)
6. Salve os 4 produtos. Eles ficam com status "Ready to Submit" — serão enviados pra revisão junto do próximo build do app.
7. Gere uma chave de API pra conectar com a RevenueCat depois:
   - **Users and Access → Integrations → App Store Connect API**
   - Clique em "+" para gerar uma chave, papel **"App Manager"**
   - Baixe o arquivo `.p8` (só dá pra baixar uma vez, guarde ele) e anote o **Key ID** e o **Issuer ID**

---

## Passo 2 — Google Play Console (criar os produtos do Android)

1. Acesse [play.google.com/console](https://play.google.com/console) → selecione o app Obreasy.
2. Menu lateral → **Monetizar → Produtos → Assinaturas**.
3. Crie 2 produtos de assinatura (um por plano), cada um com 2 **planos base** (base plans):

   | Subscription ID (copiar exatamente) | Base Plan ID | Preço |
   |---|---|---|
   | `essencial` | `monthly` | R$ 29,90 |
   | `essencial` | `annual` | R$ 304,80 |
   | `profissional` | `monthly` | R$ 49,90 |
   | `profissional` | `annual` | R$ 509,00 |

   (ou seja: crie a assinatura `essencial` com os 2 base plans `monthly` e `annual` dentro dela, depois a assinatura `profissional` do mesmo jeito)
4. Ative os planos base (botão "Ativar").
5. Crie a conta de serviço que a RevenueCat vai usar pra ler suas assinaturas:
   - **Configuração → Acesso à API (API access)**
   - Clique em "Criar novo conta de serviço" (ou vincule uma existente do Google Cloud)
   - Dê a ela as permissões: **"Ver dados financeiros"** e **"Gerenciar pedidos e assinaturas"**
   - Baixe o arquivo JSON de credenciais dessa conta de serviço (vai precisar dele no Passo 3)

---

## Passo 3 — Criar sua conta na RevenueCat

1. Acesse [app.revenuecat.com/signup](https://app.revenuecat.com/signup) e crie a conta (tem plano gratuito, cobra só acima de US$ 2.5k/mês em receita rastreada).
2. Crie um projeto novo: nome `Obreasy`.
3. **Adicionar app iOS**:
   - No projeto, vá em **Project Settings → Apps → + New**
   - Tipo: **App Store**
   - Bundle ID: `com.obreasy.app`
   - Cole a chave `.p8`, o Key ID e o Issuer ID que você gerou no Passo 1.7
4. **Adicionar app Android**:
   - **+ New** → Tipo: **Play Store**
   - Package name: `com.obreasy.app`
   - Faça upload do JSON da conta de serviço do Passo 2.5
5. **Criar os Produtos** (Products → + New):
   - Adicione os 4 produtos do iOS (mesmos Product IDs do Passo 1) e os 4 do Android (`essencial:monthly`, `essencial:annual`, `profissional:monthly`, `profissional:annual`) — deve puxar sozinho da loja depois de alguns minutos, ou você adiciona manualmente com esses IDs.
6. **Criar os Entitlements** (Entitlements → + New): crie 2:
   - `essencial` → anexe os produtos `com.obreasy.app.essencial.monthly`, `com.obreasy.app.essencial.annual`, `essencial:monthly`, `essencial:annual`
   - `profissional` → anexe os 4 produtos profissional (iOS + Android)
7. **Criar a Offering** (Offerings → + New):
   - Identifier: `default` (marque como "Current")
   - Adicione 4 packages dentro dela, com estes identifiers exatos (o código procura por esses nomes):
     - `essencial_monthly` → produto iOS `com.obreasy.app.essencial.monthly` + produto Android `essencial:monthly`
     - `essencial_annual` → produto iOS `com.obreasy.app.essencial.annual` + produto Android `essencial:annual`
     - `profissional_monthly` → produto iOS `com.obreasy.app.profissional.monthly` + produto Android `profissional:monthly`
     - `profissional_annual` → produto iOS `com.obreasy.app.profissional.annual` + produto Android `profissional:annual`
8. **Pegar as API Keys** (Project Settings → API Keys):
   - Copie a **Public app-specific API key** do iOS (começa com `appl_`)
   - Copie a **Public app-specific API key** do Android (começa com `goog_`)
9. **Configurar o Webhook** (Project Settings → Integrations → Webhooks → + New):
   - URL: `https://www.obreasy.com.br/api/webhooks/revenuecat`
   - Authorization header value: gere uma senha aleatória forte (ex: `openssl rand -hex 32` no terminal) e guarde ela — vai ser o `REVENUECAT_WEBHOOK_AUTH`

---

## Passo 4 — Adicionar as variáveis de ambiente

Adicione essas 3 variáveis no **Vercel** (Project Settings → Environment Variables) e também no seu `.env.local` pra testar em dev:

```
NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxx
REVENUECAT_WEBHOOK_AUTH=a-senha-aleatoria-que-voce-gerou-no-passo-3.9
```

Depois de adicionar no Vercel, faça um novo deploy pra elas entrarem em vigor.

---

## Passo 5 — Testar antes de reenviar pra Apple

1. **iOS**: abra `ios/App/App.xcworkspace` no Xcode (num Mac), rode num iPhone físico (simulador não funciona pra compra real). Crie um **Sandbox Tester** em App Store Connect (**Users and Access → Sandbox → Testers**) e faça login com essa conta no iPhone em **Ajustes → App Store → Sandbox Account** antes de tentar comprar.
2. **Android**: abra `android/` no Android Studio, adicione seu e-mail como **License Tester** no Play Console (**Configuração → Testes de licença**), suba um build pra faixa de **teste interno** e teste a compra por lá.
3. Confira no dashboard da RevenueCat (**Customers**) se a compra apareceu vinculada ao id do usuário do Supabase, e em **Events** se o webhook dele disparou com sucesso.
4. Confira no Supabase (`user_profiles`) se `status`, `plano` e `payment_provider = 'revenuecat'` foram atualizados depois da compra de teste.

---

## Checklist final antes de reenviar o app pra revisão da Apple

- [ ] Os 4 produtos IAP criados no App Store Connect, sem nenhuma menção a Android/Google Play/links externos nas descrições
- [ ] Os 4 produtos criados no Google Play Console (2 assinaturas x 2 base plans)
- [ ] Conta RevenueCat criada, conectada às duas lojas, com entitlements + offering configurados
- [ ] As 3 env vars adicionadas no Vercel e o app redeployado
- [ ] Testei uma compra de sandbox no iPhone e uma no Android e confirmei que o Supabase atualizou
- [ ] Novo build enviado com o fluxo de compra 100% nativo (sem link pra checkout externo visível no app iOS)
