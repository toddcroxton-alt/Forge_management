-- Seed Data for FORGE_MANAGER

-- Clear existing data if re-running
TRUNCATE TABLE public.print_jobs CASCADE;
TRUNCATE TABLE public.filaments CASCADE;
TRUNCATE TABLE public.printers CASCADE;

-- Insert Printers
INSERT INTO public.printers (id, brand, model, status, nozzle_temp, bed_temp, fan_speed)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Bambu Lab', 'X1-Carbon', 'idle', 0, 0, 0),
    ('22222222-2222-2222-2222-222222222222', 'Bambu Lab', 'P1S', 'printing', 220, 60, 80),
    ('33333333-3333-3333-3333-333333333333', 'Prusa Research', 'MK4', 'idle', 0, 0, 0),
    ('44444444-4444-4444-4444-444444444444', 'Creality', 'Ender 3 V3', 'offline', 0, 0, 0),
    ('55555555-5555-5555-5555-555555555555', 'Voron Design', 'V2.4', 'maintenance', 0, 0, 0);

-- Insert Filaments
INSERT INTO public.filaments (id, brand, name, material_type, color_hex, sku, rrp, weight_total_g, weight_remaining_g, reorder_url)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Polymaker', 'PolyLite Indigo Purple', 'PLA', '#4B0082', 'PM-PLA-IND-01', 24.99, 1000, 850, 'https://polymaker.com/polylite-pla/'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sunlu', 'High Speed Silk Rainbow', 'PLA', 'linear-gradient(90deg, red, yellow, green, blue)', 'SUN-PLA-RBW-01', 27.99, 1000, 200, 'https://www.sunlu.com/products/silk-rainbow-pla'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'eSUN', 'Matte Black', 'PETG', '#202020', 'ES-PETG-BLK-01', 22.50, 1000, 540, 'https://www.esun3d.net/products/epetg-matte'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Prusament', 'Galaxy Silver', 'PLA', '#A9A9A9', 'PRU-PLA-GS-01', 29.99, 1000, 950, 'https://www.prusa3d.com/category/prusament/'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Hatchbox', 'True Red', 'ABS', '#FF0000', 'HB-ABS-RED-01', 21.99, 1000, 100, 'https://www.hatchbox3d.com/products/abs');

-- Insert Print Jobs
INSERT INTO public.print_jobs (id, job_name, printer_id, filament_id, status, progress, net_usage_g, cost)
VALUES
    ('99999999-9999-9999-9999-999999999999', 'Titan_Housing_V2', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'printing', 68.4, 150, NULL),
    ('88888888-8888-8888-8888-888888888888', 'NRL Phone Stand', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pending', 0, 75, NULL);
