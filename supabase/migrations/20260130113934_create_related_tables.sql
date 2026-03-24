-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  categoria TEXT NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT,
  profissional_id UUID,
  observacao TEXT,
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  valor DECIMAL(12, 2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de recebimentos
CREATE TABLE IF NOT EXISTS recebimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  valor DECIMAL(12, 2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar foreign key de despesas para profissionais
ALTER TABLE despesas
ADD CONSTRAINT fk_despesas_profissional
FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS despesas_user_id_idx ON despesas(user_id);
CREATE INDEX IF NOT EXISTS despesas_obra_id_idx ON despesas(obra_id);
CREATE INDEX IF NOT EXISTS despesas_data_idx ON despesas(data DESC);
CREATE INDEX IF NOT EXISTS profissionais_user_id_idx ON profissionais(user_id);
CREATE INDEX IF NOT EXISTS profissionais_obra_id_idx ON profissionais(obra_id);
CREATE INDEX IF NOT EXISTS pagamentos_user_id_idx ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS pagamentos_obra_id_idx ON pagamentos(obra_id);
CREATE INDEX IF NOT EXISTS pagamentos_profissional_id_idx ON pagamentos(profissional_id);
CREATE INDEX IF NOT EXISTS recebimentos_user_id_idx ON recebimentos(user_id);
CREATE INDEX IF NOT EXISTS recebimentos_obra_id_idx ON recebimentos(obra_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recebimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para despesas
CREATE POLICY "Usuários podem ver próprias despesas"
  ON despesas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar próprias despesas"
  ON despesas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar próprias despesas"
  ON despesas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar próprias despesas"
  ON despesas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para profissionais
CREATE POLICY "Usuários podem ver próprios profissionais"
  ON profissionais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar próprios profissionais"
  ON profissionais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar próprios profissionais"
  ON profissionais FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar próprios profissionais"
  ON profissionais FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver próprios pagamentos"
  ON pagamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar próprios pagamentos"
  ON pagamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar próprios pagamentos"
  ON pagamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar próprios pagamentos"
  ON pagamentos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para recebimentos
CREATE POLICY "Usuários podem ver próprios recebimentos"
  ON recebimentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar próprios recebimentos"
  ON recebimentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar próprios recebimentos"
  ON recebimentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar próprios recebimentos"
  ON recebimentos FOR DELETE USING (auth.uid() = user_id);

-- Triggers para atualizar timestamps
CREATE TRIGGER update_despesas_atualizada_em
  BEFORE UPDATE ON despesas
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizada_em_column();

CREATE TRIGGER update_profissionais_atualizado_em
  BEFORE UPDATE ON profissionais
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizada_em_column();

CREATE TRIGGER update_pagamentos_atualizado_em
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizada_em_column();
