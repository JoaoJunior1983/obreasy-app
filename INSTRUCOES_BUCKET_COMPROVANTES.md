# 📋 Instruções: Configurar Bucket de Comprovantes

## ⚠️ AÇÃO NECESSÁRIA

Para que o upload de comprovantes de pagamento funcione corretamente, você precisa criar o bucket no Supabase Storage.

## 🛠️ Como Criar o Bucket

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **"Create a new bucket"**
5. Configure:
   - **Name**: `comprovantes`
   - **Public bucket**: ✅ Marcar como público
   - Clique em **"Save"**

6. Configure as políticas de segurança (RLS):
   - Clique no bucket `comprovantes`
   - Vá em **"Policies"**
   - Adicione as seguintes políticas:

#### Política 1: Upload (INSERT)
```sql
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprovantes');
```

#### Política 2: Visualização (SELECT)
```sql
CREATE POLICY "Usuários podem visualizar comprovantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprovantes');
```

#### Política 3: Exclusão (DELETE)
```sql
CREATE POLICY "Usuários podem excluir comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprovantes');
```

### Opção 2: Via SQL Editor

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Execute o SQL da migration criada em:
   ```
   supabase/migrations/20260202123333_criar_bucket_comprovantes.sql
   ```

## ✅ Verificação

Após criar o bucket, teste:

1. Acesse a aplicação
2. Crie um novo pagamento
3. Anexe um comprovante (JPG, PNG ou PDF)
4. Salve o pagamento

Se tudo estiver correto, você verá:
- ✅ Loading "Enviando comprovante..."
- ✅ Mensagem de sucesso
- ✅ Comprovante salvo e acessível

## 🔍 Troubleshooting

### Erro: "bucket not found"
- O bucket `comprovantes` não foi criado
- Siga as instruções acima para criar

### Erro: "permission denied"
- As políticas RLS não foram configuradas
- Configure as políticas de segurança

### Erro ao fazer upload
- Verifique se o bucket é público
- Verifique se o arquivo é menor que 10MB
- Formatos aceitos: JPG, PNG, PDF

## 📱 Como Funciona

1. **Usuário anexa comprovante** → FileUpload detecta arquivo
2. **Click em "Salvar"** → Sistema inicia upload
3. **Upload no Storage** → Arquivo enviado para `comprovantes/{obra_id}/{timestamp}.ext`
4. **URL gerada** → Sistema obtém URL pública
5. **Salvamento no banco** → Pagamento salvo com `comprovante_url`
6. **Sucesso** → Usuário vê confirmação

## 🔒 Segurança

- Apenas usuários autenticados podem fazer upload
- Arquivos organizados por obra (pasta = obra_id)
- URLs públicas, mas difíceis de adivinhar
- Tamanho máximo: 10MB por arquivo
- Formatos permitidos: JPG, PNG, PDF
