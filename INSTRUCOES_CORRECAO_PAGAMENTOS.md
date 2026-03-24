# 🔧 Correção: Erro ao salvar pagamento

## Problema Identificado

Ao tentar salvar um pagamento, o sistema retorna o seguinte erro:

```
Could not find the 'comprovante_url' column of 'pagamentos' in the schema cache
Code: PGRST204
```

## Causa

A tabela `pagamentos` no banco de dados Supabase **não possui** a coluna `comprovante_url`, mas o código da aplicação está tentando salvar dados nessa coluna.

## Solução

### Opção 1: Adicionar a coluna faltante (RECOMENDADO)

1. Acesse o Supabase: https://blietvjzchjrzbmkitha.supabase.co
2. Vá em **"SQL Editor"** no menu lateral
3. Abra o arquivo `ADICIONAR_COMPROVANTE_PAGAMENTOS.sql`
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** para executar
7. Aguarde a confirmação de sucesso ✅

### Opção 2: Executar o schema completo

Se você ainda não executou o schema completo do banco de dados:

1. Acesse o Supabase: https://blietvjzchjrzbmkitha.supabase.co
2. Vá em **"SQL Editor"** no menu lateral
3. Abra o arquivo `SCHEMA_COMPLETO_SUPABASE.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **"Run"**

**⚠️ ATENÇÃO:** Se você já tem dados no banco, execute apenas a Opção 1 para evitar perda de dados.

## Verificação

Após executar a migração, tente salvar um pagamento novamente. O erro não deve mais ocorrer.

## Estrutura da coluna adicionada

```sql
comprovante_url TEXT
```

- **Tipo:** TEXT (permite armazenar URLs longas)
- **Nullable:** Sim (pode ser NULL se não houver comprovante)
- **Uso:** Armazena a URL pública do comprovante de pagamento no Supabase Storage

## Arquivos relacionados

- `ADICIONAR_COMPROVANTE_PAGAMENTOS.sql` - Script de migração
- `SCHEMA_COMPLETO_SUPABASE.sql` - Schema completo do banco
- `src/lib/storage.ts` - Código que salva pagamentos (linha ~1031)
