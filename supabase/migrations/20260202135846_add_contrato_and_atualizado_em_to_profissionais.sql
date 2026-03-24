-- Adicionar colunas 'contrato' e 'atualizado_em' na tabela profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS contrato JSONB,
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- Criar função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_profissionais_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trg_profissionais_atualizado_em ON profissionais;

-- Criar trigger para atualizar atualizado_em automaticamente em cada UPDATE
CREATE TRIGGER trg_profissionais_atualizado_em
BEFORE UPDATE ON profissionais
FOR EACH ROW
EXECUTE FUNCTION update_profissionais_atualizado_em();

-- Comentários explicativos
COMMENT ON COLUMN profissionais.contrato IS 'Dados do contrato do profissional armazenados em formato JSONB (tipo, valor_combinado, valor_previsto, data_inicio, data_termino, observacoes, anexos)';
COMMENT ON COLUMN profissionais.atualizado_em IS 'Data e hora da última atualização do registro (atualizado automaticamente via trigger)';
