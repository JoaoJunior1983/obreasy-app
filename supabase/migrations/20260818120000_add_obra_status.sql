-- Obras podem ser concluídas sem serem excluídas: mantêm histórico e ficam
-- consultáveis/editáveis, mas param de contar prazo e de gerar aviso de atraso.
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'em_andamento';
ALTER TABLE public.obras DROP CONSTRAINT IF EXISTS obras_status_check;
ALTER TABLE public.obras ADD CONSTRAINT obras_status_check CHECK (status IN ('em_andamento','concluida'));
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS concluida_em timestamptz;
