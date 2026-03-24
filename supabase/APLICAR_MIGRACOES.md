# Como Aplicar as Migrações no Supabase

## Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Copie e cole o conteúdo do arquivo `migrations/20260130113835_create_obras_table.sql`
5. Clique em "Run" para executar
6. Repita os passos 4-5 para o arquivo `migrations/20260130113934_create_related_tables.sql`

## Opção 2: Via CLI (Requires Supabase Link)

```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push --yes
```

## Verificar se as tabelas foram criadas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('obras', 'despesas', 'profissionais', 'pagamentos', 'recebimentos');
```

Você deve ver 5 tabelas listadas.
