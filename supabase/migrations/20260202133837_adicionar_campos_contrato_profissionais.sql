-- Adicionar campos de contrato na tabela profissionais
-- Decisão Arquitetural: Contrato é parte do profissional (OPÇÃO A - SIMPLES)

-- Adicionar campo JSONB para armazenar o contrato completo
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS contrato JSONB;

-- Adicionar campo para valor previsto (extraído do contrato para facilitar queries)
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS valor_previsto DECIMAL(12, 2) DEFAULT 0;

-- Adicionar índice para melhorar performance de queries por valor_previsto
CREATE INDEX IF NOT EXISTS profissionais_valor_previsto_idx ON profissionais(valor_previsto);

-- Comentários para documentação
COMMENT ON COLUMN profissionais.contrato IS 'Contrato/combinado do profissional em formato JSONB. Estrutura: {tipoContrato, valorCombinado, valorPrevisto, dataInicio, dataTermino, observacoes, diaria, qtdDiarias, valorM2, areaM2, valorUnidade, qtdUnidades, etapas, anexo}';
COMMENT ON COLUMN profissionais.valor_previsto IS 'Valor total previsto do contrato (denormalizado para facilitar cálculos e queries). Atualizado automaticamente quando o contrato é salvo.';
