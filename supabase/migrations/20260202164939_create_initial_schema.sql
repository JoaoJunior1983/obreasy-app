-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de obras
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nome_cliente TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('construcao', 'reforma')),
    area NUMERIC NOT NULL,
    localizacao JSONB NOT NULL,
    orcamento NUMERIC,
    valor_contratado NUMERIC,
    data_inicio DATE,
    data_termino DATE,
    criada_em TIMESTAMPTZ DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    categoria TEXT NOT NULL,
    data DATE NOT NULL,
    forma_pagamento TEXT,
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
    observacao TEXT,
    criada_em TIMESTAMPTZ DEFAULT NOW(),
    atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de profissionais
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
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    valor NUMERIC NOT NULL,
    data DATE NOT NULL,
    forma_pagamento TEXT NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de recebimentos
CREATE TABLE IF NOT EXISTS public.recebimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    valor NUMERIC NOT NULL,
    data DATE NOT NULL,
    forma_pagamento TEXT NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_obras_user_id ON public.obras(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_obra_id ON public.despesas(obra_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON public.profissionais(user_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_obra_id ON public.profissionais(obra_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_obra_id ON public.pagamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_user_id ON public.recebimentos(user_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_obra_id ON public.recebimentos(obra_id);

-- Criar políticas de RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para obras
CREATE POLICY "Usuários podem ver suas próprias obras"
    ON public.obras FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias obras"
    ON public.obras FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias obras"
    ON public.obras FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias obras"
    ON public.obras FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para despesas
CREATE POLICY "Usuários podem ver suas próprias despesas"
    ON public.despesas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias despesas"
    ON public.despesas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias despesas"
    ON public.despesas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias despesas"
    ON public.despesas FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para profissionais
CREATE POLICY "Usuários podem ver seus próprios profissionais"
    ON public.profissionais FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios profissionais"
    ON public.profissionais FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios profissionais"
    ON public.profissionais FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios profissionais"
    ON public.profissionais FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver seus próprios pagamentos"
    ON public.pagamentos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios pagamentos"
    ON public.pagamentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios pagamentos"
    ON public.pagamentos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios pagamentos"
    ON public.pagamentos FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para recebimentos
CREATE POLICY "Usuários podem ver seus próprios recebimentos"
    ON public.recebimentos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios recebimentos"
    ON public.recebimentos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios recebimentos"
    ON public.recebimentos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios recebimentos"
    ON public.recebimentos FOR DELETE
    USING (auth.uid() = user_id);

-- Criar funções para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obras_updated_at
    BEFORE UPDATE ON public.obras
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_updated_at
    BEFORE UPDATE ON public.despesas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON public.profissionais
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at
    BEFORE UPDATE ON public.pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
