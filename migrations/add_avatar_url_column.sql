-- Adicionar coluna avatar_url à tabela user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL pública do avatar do usuário no Supabase Storage';

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
