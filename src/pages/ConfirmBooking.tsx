import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, User, MapPin, Phone, Loader2 } from "lucide-react";

export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const bookingId = searchParams.get("id");

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Booking not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          confirmation_timestamp: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Booking confirmed!");

      const slotLabels: Record<string, string> = {
        morning: "6AM - 1PM",
        afternoon: "7AM - 2PM",
      };

      const slotTime = slotLabels[booking.slot_key] || booking.slot_key;
      const formattedDate = new Date(booking.booking_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const paymentUrl = `${window.location.origin}/payment-qr.png`;
      const confirmMessage = `✅ Your booking is confirmed!\n\n📅 Date: ${formattedDate}\n⏰ Time: ${slotTime}\n\n💳 Please proceed with the payment using the QR code:\n${paymentUrl}\n\nThank you for booking with MBSS!`;
      const whatsappUrl = `https://wa.me/send?phone=9003073491&text=${encodeURIComponent(confirmMessage)}`;
      
      window.open(whatsappUrl, "_blank");
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error confirming booking:", error);
      toast.error(error?.message || "Failed to confirm booking. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.info("Booking cancelled");
      navigate("/");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
      navigate("/");
    } finally {
      setProcessing(false);
    }
  };

  const getSlotLabel = (key: string) => {
    const labels: Record<string, string> = {
      morning: "6AM - 1PM",
      afternoon: "7AM - 2PM",
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-br from-primary/10 to-primary/5">
            <CardTitle className="text-3xl font-bold text-primary">
              Confirm Your Booking
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Please review your booking details and confirm
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold text-foreground">{booking.user_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold text-foreground">{booking.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold text-foreground">{booking.phone_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(booking.booking_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Time Slot</p>
                  <p className="font-semibold text-foreground">{getSlotLabel(booking.slot_key)}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                ✓ Click "Yes, Confirm" to finalize your booking and receive payment details
              </p>
              <p className="text-sm text-foreground mt-2">
                ✗ Click "No, Cancel" to cancel this booking and choose another slot
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={handleDecline}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "No, Cancel"
                )}
              </Button>
              <Button
                className="flex-1 h-12 text-base"
                onClick={handleConfirm}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Yes, Confirm"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
