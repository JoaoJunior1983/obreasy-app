-- ========================================================================
-- 🔧 CORREÇÃO DEFINITIVA: ADICIONAR COLUNAS 'contrato' e 'atualizado_em'
-- ========================================================================
--
-- PROBLEMA RESOLVIDO:
-- ❌ Could not find the 'contrato' column of 'profissionais' in the schema cache
-- ❌ Could not find the 'atualizado_em' column of 'profissionais' in the schema cache
--
-- INSTRUÇÕES:
-- 1. Acesse seu Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole este script completo
-- 4. Clique em "Run" (executar)
-- 5. Aguarde confirmação de sucesso
-- 6. Recarregue sua aplicação
--
-- ========================================================================

-- Passo 1: Adicionar as colunas ausentes
ALTER TABLE profissionais
ADD COLUMN IF NOT EXISTS contrato JSONB,
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- Passo 2: Criar função para atualizar automaticamente 'atualizado_em'
CREATE OR REPLACE FUNCTION update_profissionais_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 3: Remover trigger anterior se existir
DROP TRIGGER IF EXISTS trg_profissionais_atualizado_em ON profissionais;

-- Passo 4: Criar trigger que atualiza 'atualizado_em' automaticamente em cada UPDATE
CREATE TRIGGER trg_profissionais_atualizado_em
BEFORE UPDATE ON profissionais
FOR EACH ROW
EXECUTE FUNCTION update_profissionais_atualizado_em();

-- Passo 5: Adicionar comentários explicativos nas colunas
COMMENT ON COLUMN profissionais.contrato IS 'Dados do contrato do profissional em formato JSONB: tipo, valor_combinado, valor_previsto, data_inicio, data_termino, observacoes, anexos';
COMMENT ON COLUMN profissionais.atualizado_em IS 'Data/hora da última atualização (gerenciada automaticamente pelo trigger)';

-- ========================================================================
-- ✅ APÓS EXECUTAR ESTE SCRIPT:
-- ========================================================================
-- 1. O erro "Could not find the 'contrato' column" será eliminado
-- 2. O erro "Could not find the 'atualizado_em' column" será eliminado
-- 3. Contratos serão salvos corretamente
-- 4. Profissionais não desaparecerão da listagem
-- 5. O campo 'atualizado_em' será atualizado automaticamente em cada UPDATE
-- 6. Você poderá definir contratos e lançar pagamentos sem erros
-- ========================================================================
