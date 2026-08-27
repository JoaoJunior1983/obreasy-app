# Ficha da App Store — Obreasy

Material da Etapa 1 do projeto de posicionamento (ASO). Screenshots gerados a partir das telas
reais do app em produção, com dados de demonstração, e compostos com as frases de destaque.

App: `Obreasy` · bundle `com.obreasy.app` · ASC app id `6782952692` · locale `pt-BR`.

## O que já existe na loja hoje

| Campo | Valor atual | Situação |
|---|---|---|
| Subtítulo | vazio | **falta preencher** |
| Palavras-chave | `obra,construção,orçamento,despesas,reforma,construtora,engenheiro,arquiteto,gestão,financeiro,pdf` | repete o que já está no nome e no subtítulo proposto |
| Screenshots iPhone | 3 imagens em 1284×2778 (6.5") | **falta o set 6.9"**, que é o tamanho pedido hoje |
| Screenshots iPad | 3 imagens em 2048×2732 | manter |

## Screenshots novos

`6.9-iphone/` — **1290 × 2796**, tamanho principal exigido pela Apple hoje.
`6.5-iphone/` — 1284 × 2778, mesmo conteúdo para o set legado.
`telas-cruas/` — as capturas do app sem arte, caso alguém queira recompor.

Ordem sugerida na loja e a frase de cada uma:

| # | Arquivo | Frase |
|---|---|---|
| 1 | `01-minhas-obras` | Todas as suas obras **em um só lugar** |
| 2 | `02-dashboard-obra` | Quanto entrou e quanto **saiu, em tempo real** |
| 3 | `03-despesas` | Cada gasto da obra **registrado pelo celular** |
| 4 | `04-profissionais` | Profissionais e pagamentos **sempre organizados** |
| 5 | `06-custo-m2` | O custo por m² calculado **sozinho pra você** |

## Textos propostos

**Subtítulo** (limite de 30 caracteres, hoje está vazio):

```
Controle e Gestão de Obras
```

**Palavras-chave** (limite de 100 caracteres). O nome do app e o subtítulo já cobrem
"Obreasy", "controle", "gestão" e "obras", então a lista não repete essas palavras — a Apple
combina os termos entre si sozinha:

```
construção,reforma,orçamento,despesas,gastos,diário,empreiteiro,pedreiro,engenharia,construtora
```

**Descrição** (primeiras linhas são o que aparece sem expandir):

```
Controle sua obra sem planilhas confusas.

O Obreasy é o aplicativo de controle e gestão de obras para quem constrói ou reforma.
Registre cada gasto pelo celular, acompanhe o orçamento em tempo real e saiba exatamente
quanto já saiu e quanto ainda falta.

O QUE VOCÊ FAZ NO OBREASY

• Controle de gastos: lance despesas de material, mão de obra, serviços e equipamentos, com
  comprovante anexado e filtro por categoria.
• Orçamento em tempo real: veja o saldo da obra e o quanto já foi consumido, sem esperar o
  fim do mês.
• Custo por m²: calculado automaticamente a partir da área e dos gastos lançados.
• Profissionais e pagamentos: cadastre a equipe, registre o que foi combinado e o que já foi
  pago, e nunca mais perca o controle da mão de obra.
• Recebimentos do cliente: acompanhe o que foi contratado, o que já entrou e o que falta receber.
• Diário de obra: registre o andamento com fotos e data.
• Relatórios em PDF: gere um relatório completo para apresentar ao cliente.
• Várias obras ao mesmo tempo: gerencie construções e reformas em paralelo e conclua a obra
  mantendo todo o histórico.

PARA QUEM É

Construtores, engenheiros, arquitetos, empreiteiros e também quem está construindo ou
reformando a própria casa e quer acompanhar cada centavo.

CELULAR E COMPUTADOR

Use a mesma conta no aplicativo e no navegador. O que você lança em um aparece no outro.

Comece com 7 dias grátis.
```

## Como regerar

Os dois scripts desta pasta reproduzem o material do zero:

```bash
node assets/app-store/capturar.mjs /tmp/shots        # captura as telas reais (Playwright)
node assets/app-store/compor.mjs /tmp/shots /tmp/out 1290 2796   # compõe as artes
```

A captura usa uma conta de demonstração criada só para isso e removida logo em seguida. Se for
rodar de novo, recrie a conta e os dados antes (obras, despesas, profissionais, pagamentos,
recebimentos), senão as telas saem vazias.

## Pendente

Subir na App Store Connect. Mudança de subtítulo, palavras-chave, descrição e screenshots exige
uma **nova versão** do app, que passa por revisão da Apple — não dá para alterar na versão
1.0 que já está `READY_FOR_SALE`. O texto promocional é a única exceção, esse muda a qualquer
momento sem revisão.
