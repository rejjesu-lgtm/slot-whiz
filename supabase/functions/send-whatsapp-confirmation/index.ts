import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  name: string;
  phone: string;
  date: string;
  slot: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, date, slot }: WhatsAppRequest = await req.json();

    console.log('WhatsApp confirmation request:', { name, phone, date, slot });

    // Get WhatsApp API credentials from environment
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!whatsappToken || !whatsappPhoneId) {
      console.error('WhatsApp credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'WhatsApp not configured',
          message: 'Please add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID secrets'
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const slotLabels: Record<string, string> = {
      morning: '6AM - 10AM',
      afternoon: '11AM - 3PM',
      evening: '4PM - 7PM',
    };

    const slotTime = slotLabels[slot] || slot;
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format phone number (remove + if present, WhatsApp API expects it without +)
    const formattedPhone = phone.replace(/^\+/, '');

    const message = `Hello ${name}! 👋\n\nYour slot booking is pending confirmation:\n\n📅 Date: ${formattedDate}\n⏰ Time: ${slotTime}\n\nPlease reply "CONFIRM" to this message within 12 hours to secure your booking.\n\nThank you!`;

    // Send WhatsApp message using Cloud API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      return new Response(
        JSON.stringify({ 
          error: 'WhatsApp send failed',
          details: whatsappData 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('WhatsApp message sent successfully:', whatsappData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: whatsappData.messages?.[0]?.id 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-whatsapp-confirmation:', error);
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
