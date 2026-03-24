-- Criar tabela de obras
CREATE TABLE IF NOT EXISTS obras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_cliente TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('construcao', 'reforma')),
  area DECIMAL(10, 2) NOT NULL,
  localizacao JSONB NOT NULL,
  orcamento DECIMAL(12, 2),
  valor_contratado DECIMAL(12, 2),
  data_inicio DATE,
  data_termino DATE,
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS obras_user_id_idx ON obras(user_id);
CREATE INDEX IF NOT EXISTS obras_criada_em_idx ON obras(criada_em DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas suas próprias obras
CREATE POLICY "Usuários podem ver próprias obras"
  ON obras
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários podem inserir apenas obras vinculadas a eles
CREATE POLICY "Usuários podem criar próprias obras"
  ON obras
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar apenas suas próprias obras
CREATE POLICY "Usuários podem atualizar próprias obras"
  ON obras
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem deletar apenas suas próprias obras
CREATE POLICY "Usuários podem deletar próprias obras"
  ON obras
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar atualizada_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizada_em_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizada_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obras_atualizada_em
  BEFORE UPDATE ON obras
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizada_em_column();
