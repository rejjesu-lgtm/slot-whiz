import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, User, MapPin, Phone, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Tables<"bookings"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("id");

  const slotLabels = useMemo<Record<string, string>>(
    () => ({
      morning: "6AM - 1PM",
      afternoon: "7AM - 2PM",
    }),
    [],
  );

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        console.error("Error fetching booking:", fetchError);
        setError("Booking not found. It may have expired or been cancelled.");
        return;
      }

      if (!data) {
        setError("Booking not found");
        return;
      }

      setBooking(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Failed to load booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  const handleConfirm = async () => {
    if (!bookingId || !booking) {
      toast.error("Booking not found");
      return;
    }

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

      const slotTime = slotLabels[booking.slot_key] || booking.slot_key;
      const formattedDate = new Date(booking.booking_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const paymentUrl = `${window.location.origin}/payment-qr.png`;
      const confirmMessage = `✅ Your booking is confirmed!\n\n📅 Date: ${formattedDate}\n⏰ Time: ${slotTime}\n\n💳 Please proceed with the payment using the QR code:\n${paymentUrl}\n\nThank you for booking with MBSS!`;
      const whatsappUrl = `https://wa.me/+919094257006?text=${encodeURIComponent(confirmMessage)}`;
      
      toast.success("Booking confirmed! Redirecting to WhatsApp...");
      
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 500);
    } catch (error: unknown) {
      console.error("Error confirming booking:", error);
      const message = error instanceof Error ? error.message : "Failed to confirm booking. Please try again.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!bookingId) {
      toast.error("Booking not found");
      return;
    }

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

  const getSlotLabel = useCallback(
    (key: string) => slotLabels[key] || key,
    [slotLabels],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-destructive/20 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardTitle className="text-3xl font-bold text-destructive">
                Booking Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  {error || "The booking you're looking for could not be found."}
                </p>
                <p className="text-sm text-muted-foreground">
                  This could happen if:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 text-left max-w-md mx-auto">
                  <li>The booking link is invalid or expired</li>
                  <li>The booking has been cancelled</li>
                  <li>The booking ID is missing from the URL</li>
                </ul>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => navigate("/")}
                  className="px-8"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
