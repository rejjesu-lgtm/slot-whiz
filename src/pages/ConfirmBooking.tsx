import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Clock, User, MapPin, Phone, Loader2, Heart, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Tables<"bookings"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const bookingId = searchParams.get("id");

  // Ensure component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

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
      // Check if Supabase is available
      if (!supabase) {
        setError("Database connection error. Please refresh the page.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        console.error("Error fetching booking:", fetchError);
        setError("Booking not found. It may have expired or been cancelled.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Booking not found");
        setLoading(false);
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

  // Always show something, even if React hasn't fully initialized
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--gradient-hero)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-hero)] flex items-center justify-center relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="text-center relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[var(--gradient-hero)] relative overflow-hidden py-12 px-4">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        {/* Header */}
        <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50 shadow-[var(--shadow-soft)] mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="relative">
                <Heart className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Mathru Bakthi Sharathasthalam
                </h1>
              </div>
            </div>
            <a href="tel:+919094257006" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105">
              <Phone className="h-4 w-4" />
              <span className="font-semibold hidden sm:inline">+91 90942 57006</span>
            </a>
          </div>
        </header>

        <div className="max-w-2xl mx-auto relative z-10">
          <Card className="border-2 border-destructive/20 shadow-[var(--shadow-elevated)] backdrop-blur-xl bg-[var(--gradient-card)]">
            <CardHeader className="text-center bg-gradient-to-br from-destructive/10 to-destructive/5">
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-3xl font-bold text-destructive">
                Booking Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-lg">
                  {error || "The booking you're looking for could not be found."}
                </p>
                <p className="text-sm text-muted-foreground font-semibold">
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
                  className="px-8 bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300"
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
    <div className="min-h-screen bg-[var(--gradient-hero)] relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50 shadow-[var(--shadow-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="relative">
              <Heart className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Mathru Bakthi Sharathasthalam
              </h1>
            </div>
          </div>
          <a href="tel:+919094257006" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105">
            <Phone className="h-4 w-4" />
            <span className="font-semibold hidden sm:inline">+91 90942 57006</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 relative">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 animate-slide-in-from-top">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full mb-6 border border-primary/20 backdrop-blur-sm shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300">
            <Sparkles className="h-4 w-4 text-primary animate-glow" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Booking Confirmation</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-glow">Review Your Booking</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Please verify your details and confirm to proceed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="max-w-3xl mx-auto animate-slide-in-from-bottom">
          <Card className="bg-[var(--gradient-card)] backdrop-blur-xl rounded-3xl shadow-[var(--shadow-elevated)] border border-border/50 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="relative bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 px-8 py-10 md:px-10 border-b border-border/50 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary animate-glow" />
                <Sparkles className="h-5 w-5 text-accent animate-float" />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Booking Details
              </CardTitle>
              <p className="text-center text-muted-foreground text-base">Review your information below</p>
            </CardHeader>

            <CardContent className="p-8 md:p-10 space-y-6 relative">
              <div className="grid gap-4">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/80 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Full Name</p>
                    <p className="text-lg font-bold text-foreground">{booking.user_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/80 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Address</p>
                    <p className="text-lg font-bold text-foreground">{booking.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/80 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Phone Number</p>
                    <p className="text-lg font-bold text-foreground">{booking.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/80 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Date</p>
                    <p className="text-lg font-bold text-foreground">
                      {new Date(booking.booking_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/80 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Time Slot</p>
                    <p className="text-lg font-bold text-foreground">{getSlotLabel(booking.slot_key)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-2xl p-6 backdrop-blur-sm shadow-[var(--shadow-soft)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Click "Confirm Booking" to finalize your reservation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive payment details via WhatsApp after confirmation
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold border-2 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300"
                  onClick={handleDecline}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  Cancel Booking
                </Button>
                <Button
                  className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105"
                  onClick={handleConfirm}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
