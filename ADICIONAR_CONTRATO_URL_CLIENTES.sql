-- Adiciona coluna contrato_url na tabela clientes
-- Execute este script no Supabase SQL Editor

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS contrato_url TEXT DEFAULT NULL;
