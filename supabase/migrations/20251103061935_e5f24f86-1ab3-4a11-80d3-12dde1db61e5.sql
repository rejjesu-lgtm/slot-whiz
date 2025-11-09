-- Fix security warning by dropping trigger first, then function, then recreating with proper search_path
DROP TRIGGER IF EXISTS update_bookings_last_modified ON public.bookings;
DROP FUNCTION IF EXISTS update_last_modified();

CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_bookings_last_modified
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_last_modified();