-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para melhorar performance
CREATE INDEX idx_user_profiles_id ON user_profiles(id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuário pode ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: usuário pode inserir apenas seu próprio perfil
CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Perfis de usuários com informações adicionais';
COMMENT ON COLUMN user_profiles.id IS 'ID do usuário (referência ao auth.users)';
COMMENT ON COLUMN user_profiles.first_name IS 'Primeiro nome do usuário';
COMMENT ON COLUMN user_profiles.last_name IS 'Sobrenome do usuário';
COMMENT ON COLUMN user_profiles.phone IS 'Telefone celular do usuário';
