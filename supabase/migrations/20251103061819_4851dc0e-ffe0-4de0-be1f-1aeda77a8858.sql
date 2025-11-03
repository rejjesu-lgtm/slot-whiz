-- Create admin_settings table to control booking system
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (for checking if booking system is enabled)
CREATE POLICY "Anyone can view admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Only allow updates (no inserts/deletes to preserve data integrity)
CREATE POLICY "Anyone can update admin settings"
ON public.admin_settings
FOR UPDATE
USING (true);

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
  ('booking_system_enabled', 'true', 'Controls whether the booking system accepts new bookings'),
  ('maintenance_mode', 'false', 'Put the entire system in maintenance mode'),
  ('admin_phone', '9003073491', 'Admin contact phone number')
ON CONFLICT (setting_key) DO NOTHING;

-- Add an admin_override column to bookings table to allow manual status changes
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS admin_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS last_modified_by text,
ADD COLUMN IF NOT EXISTS last_modified_at timestamp with time zone;

-- Create trigger to update last_modified_at
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_last_modified
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_last_modified();

-- Add policy to allow anyone to insert bookings
CREATE POLICY "Anyone can create bookings with admin override"
ON public.bookings
FOR INSERT
WITH CHECK (true);