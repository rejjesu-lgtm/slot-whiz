import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running booking expiry check...');

    // Calculate 12 hours ago
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - 12);
    const expiryTimeStr = expiryTime.toISOString();

    console.log('Expiry time:', expiryTimeStr);

    // Find all pending bookings older than 12 hours
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('whatsapp_sent_at', expiryTimeStr);

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredBookings?.length || 0} expired bookings`);

    if (expiredBookings && expiredBookings.length > 0) {
      // Update all expired bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('whatsapp_sent_at', expiryTimeStr);

      if (updateError) {
        console.error('Error updating expired bookings:', updateError);
        throw updateError;
      }

      console.log(`Successfully expired ${expiredBookings.length} bookings`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expired_count: expiredBookings?.length || 0,
        message: `Expired ${expiredBookings?.length || 0} pending bookings`
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in expire-bookings:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
