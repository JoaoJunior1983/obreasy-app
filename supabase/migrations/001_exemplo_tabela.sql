-- Exemplo de criação de tabela
-- Este é apenas um exemplo. Adapte conforme sua necessidade.
-- Clique no botão "Execute" que aparecerá na interface para criar a tabela.

-- Criar tabela de exemplo (descomente para usar)
/*
CREATE TABLE IF NOT EXISTS usuarios_exemplo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios_exemplo ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver próprios dados"
  ON usuarios_exemplo
  FOR SELECT
  USING (auth.uid() = id);

-- Política: usuários podem inserir próprios dados
CREATE POLICY "Usuários podem inserir dados"
  ON usuarios_exemplo
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: usuários podem atualizar próprios dados
CREATE POLICY "Usuários podem atualizar próprios dados"
  ON usuarios_exemplo
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS usuarios_email_idx ON usuarios_exemplo(email);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios_exemplo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
*/

-- Descomente o código acima e adapte conforme sua necessidade!
-- Depois clique em "Execute" para criar a tabela no Supabase.
