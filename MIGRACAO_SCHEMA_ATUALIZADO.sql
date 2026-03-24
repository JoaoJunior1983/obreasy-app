-- ================================================================================
-- 🔄 MIGRAÇÃO: ATUALIZAR SCHEMA EXISTENTE PARA VERSÃO COMPLETA
-- ================================================================================
--
-- Este script atualiza o banco de dados existente adicionando:
-- - Colunas faltantes nas tabelas existentes
-- - Novas tabelas (alertas e notificações)
-- - Políticas de RLS para novas tabelas
--
-- INSTRUÇÕES:
-- 1. Acesse: https://blietvjzchjrzbmkitha.supabase.co
-- 2. Vá em "SQL Editor"
-- 3. Cole todo este script
-- 4. Clique em "Run"
--
-- ================================================================================

-- ================================================================================
-- STEP 1: ADICIONAR COLUNAS FALTANTES EM TABELAS EXISTENTES
-- ================================================================================

-- Adicionar coluna comprovante_url em despesas
ALTER TABLE public.despesas
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

COMMENT ON COLUMN public.despesas.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- Adicionar coluna comprovante_url em pagamentos
ALTER TABLE public.pagamentos
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

COMMENT ON COLUMN public.pagamentos.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- Adicionar coluna comprovante_url em recebimentos
ALTER TABLE public.recebimentos
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

COMMENT ON COLUMN public.recebimentos.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- Garantir que a coluna contrato existe em profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS contrato JSONB;

COMMENT ON COLUMN public.profissionais.contrato IS 'JSON com: tipo, valor_combinado, valor_previsto, data_inicio, data_termino, observacoes, anexos[]';

-- Garantir que a coluna atualizado_em existe em profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

-- ================================================================================
-- STEP 2: CRIAR EXTENSÕES (se não existem)
-- ================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================================
-- STEP 3: CRIAR NOVAS TABELAS
-- ================================================================================

-- ----------------------------------------
-- TABELA: alertas_orcamento
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.alertas_orcamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    percentuais INTEGER[] DEFAULT ARRAY[10,20,30,40,50,60,70,80,90,100],
    disparados INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(obra_id)
);

COMMENT ON TABLE public.alertas_orcamento IS 'Configuração de alertas automáticos quando orçamento atinge percentuais';
COMMENT ON COLUMN public.alertas_orcamento.percentuais IS 'Array de percentuais para alertar (ex: [10, 20, 30, ..., 100])';
COMMENT ON COLUMN public.alertas_orcamento.disparados IS 'Array de percentuais já alertados';

-- ----------------------------------------
-- TABELA: alertas_prazo
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.alertas_prazo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    data DATE NOT NULL,
    aviso_antecipado INTEGER DEFAULT 3 CHECK (aviso_antecipado IN (1, 3, 7)),
    disparado BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.alertas_prazo IS 'Alertas sobre datas importantes da obra';
COMMENT ON COLUMN public.alertas_prazo.aviso_antecipado IS 'Dias antes para avisar (1, 3 ou 7)';

-- ----------------------------------------
-- TABELA: alertas_pagamento
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.alertas_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('profissional', 'material', 'outros')),
    valor NUMERIC(12,2),
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
    data_inicial DATE NOT NULL,
    recorrencia TEXT NOT NULL CHECK (recorrencia IN ('unico', 'semanal', 'mensal')),
    dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
    lembrete_antecipado INTEGER DEFAULT 1,
    proxima_data DATE,
    disparado BOOLEAN DEFAULT false,
    anexo TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.alertas_pagamento IS 'Lembretes de pagamentos recorrentes (ex: aluguel de equipamento)';
COMMENT ON COLUMN public.alertas_pagamento.recorrencia IS 'Tipo: unico, semanal, mensal';
COMMENT ON COLUMN public.alertas_pagamento.dia_semana IS '0-6 (domingo-sábado), usado para recorrencia semanal';
COMMENT ON COLUMN public.alertas_pagamento.anexo IS 'Base64 ou URL do anexo';

-- ----------------------------------------
-- TABELA: notificacoes
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('orcamento', 'prazo', 'pagamento', 'sistema')),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    alerta_id UUID,
    criada_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notificacoes IS 'Registro de notificações/alertas disparados para o usuário';
COMMENT ON COLUMN public.notificacoes.tipo IS 'Tipo: orcamento, prazo, pagamento, sistema';
COMMENT ON COLUMN public.notificacoes.alerta_id IS 'Referência ao alerta que gerou a notificação (opcional)';

-- ================================================================================
-- STEP 4: CRIAR ÍNDICES ADICIONAIS
-- ================================================================================

-- Índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_despesas_comprovante ON public.despesas(comprovante_url) WHERE comprovante_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pagamentos_comprovante ON public.pagamentos(comprovante_url) WHERE comprovante_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recebimentos_comprovante ON public.recebimentos(comprovante_url) WHERE comprovante_url IS NOT NULL;

-- Índices das novas tabelas
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento_user_id ON public.alertas_orcamento(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento_obra_id ON public.alertas_orcamento(obra_id);
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento_ativo ON public.alertas_orcamento(ativo);

CREATE INDEX IF NOT EXISTS idx_alertas_prazo_user_id ON public.alertas_prazo(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_obra_id ON public.alertas_prazo(obra_id);
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_data ON public.alertas_prazo(data);
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_disparado ON public.alertas_prazo(disparado);

CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_user_id ON public.alertas_pagamento(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_obra_id ON public.alertas_pagamento(obra_id);
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_proxima_data ON public.alertas_pagamento(proxima_data);
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_disparado ON public.alertas_pagamento(disparado);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_obra_id ON public.notificacoes(obra_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criada_em ON public.notificacoes(criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);

-- ================================================================================
-- STEP 5: CRIAR/ATUALIZAR TRIGGERS
-- ================================================================================

-- Garantir que a função de update exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alertas_orcamento
DROP TRIGGER IF EXISTS update_alertas_orcamento_updated_at ON public.alertas_orcamento;
CREATE TRIGGER update_alertas_orcamento_updated_at
    BEFORE UPDATE ON public.alertas_orcamento
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================================
-- STEP 6: HABILITAR RLS NAS NOVAS TABELAS
-- ================================================================================

ALTER TABLE public.alertas_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_prazo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- STEP 7: CRIAR POLÍTICAS DE RLS PARA NOVAS TABELAS
-- ================================================================================

-- ----------------------------------------
-- Políticas: alertas_orcamento
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas de orçamento" ON public.alertas_orcamento;
CREATE POLICY "Usuários podem ver seus próprios alertas de orçamento"
    ON public.alertas_orcamento FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios alertas de orçamento" ON public.alertas_orcamento;
CREATE POLICY "Usuários podem criar seus próprios alertas de orçamento"
    ON public.alertas_orcamento FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas de orçamento" ON public.alertas_orcamento;
CREATE POLICY "Usuários podem atualizar seus próprios alertas de orçamento"
    ON public.alertas_orcamento FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios alertas de orçamento" ON public.alertas_orcamento;
CREATE POLICY "Usuários podem deletar seus próprios alertas de orçamento"
    ON public.alertas_orcamento FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: alertas_prazo
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas de prazo" ON public.alertas_prazo;
CREATE POLICY "Usuários podem ver seus próprios alertas de prazo"
    ON public.alertas_prazo FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios alertas de prazo" ON public.alertas_prazo;
CREATE POLICY "Usuários podem criar seus próprios alertas de prazo"
    ON public.alertas_prazo FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas de prazo" ON public.alertas_prazo;
CREATE POLICY "Usuários podem atualizar seus próprios alertas de prazo"
    ON public.alertas_prazo FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios alertas de prazo" ON public.alertas_prazo;
CREATE POLICY "Usuários podem deletar seus próprios alertas de prazo"
    ON public.alertas_prazo FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: alertas_pagamento
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas de pagamento" ON public.alertas_pagamento;
CREATE POLICY "Usuários podem ver seus próprios alertas de pagamento"
    ON public.alertas_pagamento FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios alertas de pagamento" ON public.alertas_pagamento;
CREATE POLICY "Usuários podem criar seus próprios alertas de pagamento"
    ON public.alertas_pagamento FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas de pagamento" ON public.alertas_pagamento;
CREATE POLICY "Usuários podem atualizar seus próprios alertas de pagamento"
    ON public.alertas_pagamento FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios alertas de pagamento" ON public.alertas_pagamento;
CREATE POLICY "Usuários podem deletar seus próprios alertas de pagamento"
    ON public.alertas_pagamento FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: notificacoes
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem ver suas próprias notificações"
    ON public.notificacoes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem criar suas próprias notificações"
    ON public.notificacoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem atualizar suas próprias notificações"
    ON public.notificacoes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários podem deletar suas próprias notificações"
    ON public.notificacoes FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================================================
-- ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
-- ================================================================================
--
-- O que foi feito:
-- ✅ Adicionadas colunas comprovante_url em despesas, pagamentos e recebimentos
-- ✅ Garantida coluna contrato em profissionais
-- ✅ Criadas 4 novas tabelas: alertas_orcamento, alertas_prazo, alertas_pagamento, notificacoes
-- ✅ Criados índices para performance
-- ✅ Configurado RLS em todas as novas tabelas
-- ✅ Criadas políticas de acesso seguro
--
-- Próximos passos:
-- 1. Configure o bucket "comprovantes" no Storage (veja CONFIGURAR_STORAGE.sql)
-- 2. Reinicie o servidor de desenvolvimento
-- 3. Teste o sistema!
--
-- ================================================================================
