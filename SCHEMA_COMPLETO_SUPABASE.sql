-- ================================================================================
-- 🗄️ SCHEMA COMPLETO DO BANCO DE DADOS - OBREASY
-- ================================================================================
--
-- INSTRUÇÕES DE INSTALAÇÃO:
-- 1. Acesse: https://blietvjzchjrzbmkitha.supabase.co
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Cole todo este script
-- 4. Clique em "Run" para executar
-- 5. Aguarde a confirmação de sucesso
--
-- ================================================================================

-- ================================================================================
-- STEP 1: CRIAR EXTENSÕES NECESSÁRIAS
-- ================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto

-- ================================================================================
-- STEP 2: CRIAR TABELAS PRINCIPAIS
-- ================================================================================

-- ----------------------------------------
-- TABELA: user_profiles
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'Perfis complementares dos usuários autenticados';
COMMENT ON COLUMN public.user_profiles.id IS 'UUID do usuário (referencia auth.users)';

-- ----------------------------------------
-- TABELA: obras
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nome_cliente TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('construcao', 'reforma')),
    area NUMERIC(10,2) NOT NULL,
    localizacao JSONB NOT NULL,
    orcamento NUMERIC(12,2),
    valor_contratado NUMERIC(12,2),
    data_inicio DATE,
    data_termino DATE,
    criada_em TIMESTAMPTZ DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.obras IS 'Obras/projetos gerenciados pelo usuário';
COMMENT ON COLUMN public.obras.localizacao IS 'JSON com estrutura: { "estado": string, "cidade": string }';
COMMENT ON COLUMN public.obras.orcamento IS 'Valor total estimado do orçamento';
COMMENT ON COLUMN public.obras.valor_contratado IS 'Valor do contrato com o cliente';

-- ----------------------------------------
-- TABELA: profissionais
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    funcao TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    cpf TEXT,
    observacoes TEXT,
    contrato JSONB,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profissionais IS 'Profissionais e fornecedores da obra';
COMMENT ON COLUMN public.profissionais.funcao IS 'Ex: Pedreiro, Eletricista, Encanador, Azulejista, Pintor, etc';
COMMENT ON COLUMN public.profissionais.contrato IS 'JSON com: tipo, valor_combinado, valor_previsto, data_inicio, data_termino, observacoes, anexos[]';

-- ----------------------------------------
-- TABELA: despesas
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
    categoria TEXT NOT NULL,
    data DATE NOT NULL,
    forma_pagamento TEXT,
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
    observacao TEXT,
    comprovante_url TEXT,
    criada_em TIMESTAMPTZ DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.despesas IS 'Registro de despesas da obra (materiais, mão de obra, etc)';
COMMENT ON COLUMN public.despesas.categoria IS 'Ex: material, mao_obra, outros';
COMMENT ON COLUMN public.despesas.forma_pagamento IS 'Ex: Pix, Dinheiro, Cartão, Boleto, Transferência';
COMMENT ON COLUMN public.despesas.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- ----------------------------------------
-- TABELA: pagamentos
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
    data DATE NOT NULL,
    forma_pagamento TEXT NOT NULL,
    observacao TEXT,
    comprovante_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pagamentos IS 'Histórico de pagamentos realizados para profissionais';
COMMENT ON COLUMN public.pagamentos.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- ----------------------------------------
-- TABELA: recebimentos
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.recebimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
    data DATE NOT NULL,
    forma_pagamento TEXT NOT NULL,
    observacao TEXT,
    comprovante_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recebimentos IS 'Recebimentos de valores do cliente (para construtores)';
COMMENT ON COLUMN public.recebimentos.comprovante_url IS 'URL pública do comprovante no Supabase Storage';

-- ================================================================================
-- STEP 3: CRIAR TABELAS DE ALERTAS E NOTIFICAÇÕES
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
-- STEP 4: CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================================================

-- Índices de user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Índices de obras
CREATE INDEX IF NOT EXISTS idx_obras_user_id ON public.obras(user_id);
CREATE INDEX IF NOT EXISTS idx_obras_criada_em ON public.obras(criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_obras_tipo ON public.obras(tipo);

-- Índices de despesas
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_obra_id ON public.despesas(obra_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON public.despesas(data DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON public.despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_despesas_profissional_id ON public.despesas(profissional_id);

-- Índices de profissionais
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON public.profissionais(user_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_obra_id ON public.profissionais(obra_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_funcao ON public.profissionais(funcao);

-- Índices de pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_obra_id ON public.pagamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_profissional_id ON public.pagamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON public.pagamentos(data DESC);

-- Índices de recebimentos
CREATE INDEX IF NOT EXISTS idx_recebimentos_user_id ON public.recebimentos(user_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_obra_id ON public.recebimentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_data ON public.recebimentos(data DESC);

-- Índices de alertas_orcamento
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento_user_id ON public.alertas_orcamento(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento_obra_id ON public.alertas_orcamento(obra_id);

-- Índices de alertas_prazo
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_user_id ON public.alertas_prazo(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_obra_id ON public.alertas_prazo(obra_id);
CREATE INDEX IF NOT EXISTS idx_alertas_prazo_data ON public.alertas_prazo(data);

-- Índices de alertas_pagamento
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_user_id ON public.alertas_pagamento(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_obra_id ON public.alertas_pagamento(obra_id);
CREATE INDEX IF NOT EXISTS idx_alertas_pagamento_proxima_data ON public.alertas_pagamento(proxima_data);

-- Índices de notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_obra_id ON public.notificacoes(obra_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criada_em ON public.notificacoes(criada_em DESC);

-- ================================================================================
-- STEP 5: CRIAR FUNÇÕES E TRIGGERS
-- ================================================================================

-- Função para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para obras
DROP TRIGGER IF EXISTS update_obras_updated_at ON public.obras;
CREATE TRIGGER update_obras_updated_at
    BEFORE UPDATE ON public.obras
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para despesas
DROP TRIGGER IF EXISTS update_despesas_updated_at ON public.despesas;
CREATE TRIGGER update_despesas_updated_at
    BEFORE UPDATE ON public.despesas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para profissionais
DROP TRIGGER IF EXISTS update_profissionais_updated_at ON public.profissionais;
CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON public.profissionais
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para pagamentos
DROP TRIGGER IF EXISTS update_pagamentos_updated_at ON public.pagamentos;
CREATE TRIGGER update_pagamentos_updated_at
    BEFORE UPDATE ON public.pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para alertas_orcamento
DROP TRIGGER IF EXISTS update_alertas_orcamento_updated_at ON public.alertas_orcamento;
CREATE TRIGGER update_alertas_orcamento_updated_at
    BEFORE UPDATE ON public.alertas_orcamento
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================================
-- STEP 6: HABILITAR ROW LEVEL SECURITY (RLS)
-- ================================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_prazo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- STEP 7: CRIAR POLÍTICAS DE RLS
-- ================================================================================

-- ----------------------------------------
-- Políticas: user_profiles
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- ----------------------------------------
-- Políticas: obras
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver suas próprias obras" ON public.obras;
CREATE POLICY "Usuários podem ver suas próprias obras"
    ON public.obras FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias obras" ON public.obras;
CREATE POLICY "Usuários podem criar suas próprias obras"
    ON public.obras FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias obras" ON public.obras;
CREATE POLICY "Usuários podem atualizar suas próprias obras"
    ON public.obras FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias obras" ON public.obras;
CREATE POLICY "Usuários podem deletar suas próprias obras"
    ON public.obras FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: despesas
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver suas próprias despesas" ON public.despesas;
CREATE POLICY "Usuários podem ver suas próprias despesas"
    ON public.despesas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias despesas" ON public.despesas;
CREATE POLICY "Usuários podem criar suas próprias despesas"
    ON public.despesas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias despesas" ON public.despesas;
CREATE POLICY "Usuários podem atualizar suas próprias despesas"
    ON public.despesas FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias despesas" ON public.despesas;
CREATE POLICY "Usuários podem deletar suas próprias despesas"
    ON public.despesas FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: profissionais
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios profissionais" ON public.profissionais;
CREATE POLICY "Usuários podem ver seus próprios profissionais"
    ON public.profissionais FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios profissionais" ON public.profissionais;
CREATE POLICY "Usuários podem criar seus próprios profissionais"
    ON public.profissionais FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios profissionais" ON public.profissionais;
CREATE POLICY "Usuários podem atualizar seus próprios profissionais"
    ON public.profissionais FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios profissionais" ON public.profissionais;
CREATE POLICY "Usuários podem deletar seus próprios profissionais"
    ON public.profissionais FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: pagamentos
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON public.pagamentos;
CREATE POLICY "Usuários podem ver seus próprios pagamentos"
    ON public.pagamentos FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios pagamentos" ON public.pagamentos;
CREATE POLICY "Usuários podem criar seus próprios pagamentos"
    ON public.pagamentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON public.pagamentos;
CREATE POLICY "Usuários podem atualizar seus próprios pagamentos"
    ON public.pagamentos FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos" ON public.pagamentos;
CREATE POLICY "Usuários podem deletar seus próprios pagamentos"
    ON public.pagamentos FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------
-- Políticas: recebimentos
-- ----------------------------------------
DROP POLICY IF EXISTS "Usuários podem ver seus próprios recebimentos" ON public.recebimentos;
CREATE POLICY "Usuários podem ver seus próprios recebimentos"
    ON public.recebimentos FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios recebimentos" ON public.recebimentos;
CREATE POLICY "Usuários podem criar seus próprios recebimentos"
    ON public.recebimentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios recebimentos" ON public.recebimentos;
CREATE POLICY "Usuários podem atualizar seus próprios recebimentos"
    ON public.recebimentos FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios recebimentos" ON public.recebimentos;
CREATE POLICY "Usuários podem deletar seus próprios recebimentos"
    ON public.recebimentos FOR DELETE
    USING (auth.uid() = user_id);

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
-- ✅ SCHEMA COMPLETO INSTALADO COM SUCESSO!
-- ================================================================================
--
-- Próximos passos:
-- 1. Configure o bucket "comprovantes" no Supabase Storage
--    - Acesse: Storage > Create Bucket
--    - Nome: comprovantes
--    - Public: Yes (para URLs públicas)
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg, image/png, application/pdf
--
-- 2. Configure as políticas do bucket:
--    - SELECT: auth.uid() não pode ser null (usuários autenticados)
--    - INSERT: auth.uid() não pode ser null (usuários autenticados)
--    - DELETE: auth.uid() não pode ser null (usuários autenticados)
--
-- 3. Atualize o arquivo .env com as credenciais:
--    NEXT_PUBLIC_SUPABASE_URL=https://blietvjzchjrzbmkitha.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
--
-- ================================================================================
