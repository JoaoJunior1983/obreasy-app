-- ============================================================
-- DIÁRIO DA OBRA - Setup completo
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Criar tabela diario_obra
CREATE TABLE IF NOT EXISTS diario_obra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  descricao TEXT,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;

-- 3. Policies de segurança
CREATE POLICY "diario_select" ON diario_obra
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "diario_insert" ON diario_obra
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diario_update" ON diario_obra
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "diario_delete" ON diario_obra
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_diario_obra_obra_id ON diario_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra_user_id ON diario_obra(user_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra_data ON diario_obra(data_registro DESC);

-- ============================================================
-- BUCKET DE STORAGE
-- No painel Supabase > Storage > New bucket:
--   Nome: diario-obra
--   Public: SIM
--   File size limit: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================================

-- Policies do storage (execute depois de criar o bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diario-obra',
  'diario-obra',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "diario_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'diario-obra');

CREATE POLICY "diario_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'diario-obra' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "diario_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'diario-obra' AND auth.uid()::text = (storage.foldername(name))[1]);
