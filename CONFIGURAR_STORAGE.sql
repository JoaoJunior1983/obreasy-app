-- ================================================================================
-- 🗄️ CONFIGURAÇÃO DO STORAGE - BUCKET DE COMPROVANTES
-- ================================================================================
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard: https://blietvjzchjrzbmkitha.supabase.co
-- 2. Vá em "Storage" no menu lateral
-- 3. Clique em "Create a new bucket"
-- 4. Preencha:
--    - Name: comprovantes
--    - Public bucket: YES (marcado)
--    - File size limit: 10 MB
--    - Allowed MIME types: image/jpeg,image/png,application/pdf
-- 5. Clique em "Create bucket"
-- 6. Cole e execute este SQL no SQL Editor para configurar as políticas
--
-- ================================================================================

-- ================================================================================
-- POLÍTICAS DE STORAGE PARA O BUCKET "comprovantes"
-- ================================================================================

-- Política: Usuários autenticados podem fazer UPLOAD de comprovantes
CREATE POLICY "Usuários autenticados podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'comprovantes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Arquivos públicos podem ser visualizados por qualquer um
CREATE POLICY "Comprovantes são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comprovantes');

-- Política: Usuários autenticados podem ATUALIZAR seus próprios comprovantes
CREATE POLICY "Usuários podem atualizar seus próprios comprovantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'comprovantes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuários autenticados podem DELETAR seus próprios comprovantes
CREATE POLICY "Usuários podem deletar seus próprios comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'comprovantes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================================================
-- ✅ POLÍTICAS DO BUCKET "comprovantes" CONFIGURADAS COM SUCESSO!
-- ================================================================================
--
-- Estrutura de diretórios do bucket:
-- comprovantes/
-- ├── {user_id}/
-- │   ├── despesas/
-- │   │   ├── {despesa_id}_{timestamp}.pdf
-- │   │   └── {despesa_id}_{timestamp}.png
-- │   ├── pagamentos/
-- │   │   ├── {pagamento_id}_{timestamp}.pdf
-- │   │   └── {pagamento_id}_{timestamp}.png
-- │   └── recebimentos/
-- │       ├── {recebimento_id}_{timestamp}.pdf
-- │       └── {recebimento_id}_{timestamp}.png
--
-- Tipos de arquivo aceitos: JPG, PNG, PDF
-- Tamanho máximo: 10 MB por arquivo
-- Acesso: Público para leitura (URLs diretas), autenticado para upload/delete
--
-- ================================================================================
