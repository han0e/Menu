-- Add language column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS language text DEFAULT 'ko';
