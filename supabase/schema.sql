-- PostgreSQL Schema for FORGE_MANAGER

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Printers Table
CREATE TABLE IF NOT EXISTS public.printers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'printing', 'maintenance', 'offline'
    nozzle_temp INTEGER DEFAULT 0,
    bed_temp INTEGER DEFAULT 0,
    fan_speed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Filaments Table
CREATE TABLE IF NOT EXISTS public.filaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    material_type TEXT NOT NULL, -- 'PLA', 'PETG', 'ABS', 'ASA', 'TPU', etc.
    color_hex TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    rrp NUMERIC(10, 2) NOT NULL,
    weight_total_g NUMERIC(10, 2) NOT NULL DEFAULT 1000,
    weight_remaining_g NUMERIC(10, 2) NOT NULL DEFAULT 1000,
    reorder_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Print Jobs Table
CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL,
    printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
    filament_id UUID REFERENCES public.filaments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'printing', 'completed', 'failed', 'cancelled'
    progress NUMERIC(5, 2) DEFAULT 0,
    net_usage_g NUMERIC(10, 2),
    cost NUMERIC(10, 2),
    margin NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Setup RLS (Row Level Security) - basic permissive setup for this phase
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to printers" ON public.printers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to filaments" ON public.filaments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to print_jobs" ON public.print_jobs FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access to printers" ON public.printers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access to filaments" ON public.filaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access to print_jobs" ON public.print_jobs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to printers" ON public.printers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access to filaments" ON public.filaments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access to print_jobs" ON public.print_jobs FOR UPDATE USING (true);
