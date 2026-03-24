-- ⚠️ EXECUTE ESTE SQL NO SUPABASE DASHBOARD PARA CORRIGIR O ERRO
-- Acesse: https://supabase.com/dashboard -> Seu Projeto -> SQL Editor
-- Cole este SQL e clique em "Run"

-- 1. Adicionar coluna 'contrato' na tabela profissionais
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS contrato JSONB;

-- 2. Adicionar coluna 'atualizado_em' para rastrear atualizações
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- 3. Criar função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_profissionais_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Remover trigger existente se houver
DROP TRIGGER IF EXISTS trg_profissionais_atualizado_em ON profissionais;

-- 5. Criar trigger para atualizar atualizado_em automaticamente
CREATE TRIGGER trg_profissionais_atualizado_em
BEFORE UPDATE ON profissionais
FOR EACH ROW
EXECUTE FUNCTION update_profissionais_atualizado_em();

-- 6. Adicionar comentários explicativos
COMMENT ON COLUMN profissionais.contrato IS 'Dados do contrato do profissional (tipo, valor_combinado, valor_previsto, data_inicio, data_termino, observacoes, anexos)';
COMMENT ON COLUMN profissionais.atualizado_em IS 'Data e hora da última atualização (atualizado automaticamente)';

-- ✅ Após executar, volte ao app e tente salvar novamente!
