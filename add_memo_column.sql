-- Add memo column to orders table for adding notes to histories
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS memo text;
