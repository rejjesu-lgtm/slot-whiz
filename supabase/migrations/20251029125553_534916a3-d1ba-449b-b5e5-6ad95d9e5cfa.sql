-- Create bookings table for slot management
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  booking_date DATE NOT NULL,
  slot_key TEXT NOT NULL CHECK (slot_key IN ('morning', 'afternoon', 'evening')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('available', 'pending', 'booked', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmation_timestamp TIMESTAMPTZ,
  whatsapp_sent_at TIMESTAMPTZ,
  UNIQUE(booking_date, slot_key)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view bookings (to check availability)
CREATE POLICY "Anyone can view bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (true);

-- Allow anyone to insert bookings (public booking form)
CREATE POLICY "Anyone can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (true);

-- Allow updates only for confirmation
CREATE POLICY "Anyone can update bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_bookings_date_slot ON public.bookings(booking_date, slot_key);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;