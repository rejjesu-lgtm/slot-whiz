import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { SlotCard } from "@/components/SlotCard";
import { BookingModal } from "@/components/BookingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Heart, Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const SLOTS = [
  {
    key: "morning",
    time: "6AM - 1PM",
    label: "1st Slot",
  },
  {
    key: "afternoon",
    time: "7AM - 2PM",
    label: "2nd Slot",
  },
] as const;

type Booking = Tables<"bookings">;

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingSystemEnabled, setBookingSystemEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const dateString = useMemo(() => selectedDate.toISOString().split("T")[0], [selectedDate]);

  const checkSystemSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["booking_system_enabled", "maintenance_mode"]);

      if (error) throw error;

      const bookingEnabled = data?.find((setting) => setting.setting_key === "booking_system_enabled");
      const maintenance = data?.find((setting) => setting.setting_key === "maintenance_mode");

      if (bookingEnabled) setBookingSystemEnabled(bookingEnabled.setting_value === "true");
      if (maintenance) setMaintenanceMode(maintenance.setting_value === "true");
    } catch (error) {
      console.error("Error checking system settings:", error);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", dateString);

      if (error) throw error;

      setBookings(data ?? []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  const subscribeToBookings = useCallback(() => {
    const channel = supabase
      .channel(`bookings-${dateString}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${dateString}`,
        },
        () => {
          void fetchBookings();
        },
      )
      .subscribe();

    return channel;
  }, [dateString, fetchBookings]);

  useEffect(() => {
    void checkSystemSettings();
  }, [checkSystemSettings]);

  useEffect(() => {
    void fetchBookings();
    const channel = subscribeToBookings();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings, subscribeToBookings]);

  const handleSlotClick = (slotKey: string) => {
    if (maintenanceMode) {
      toast.error("System is currently under maintenance. Please try again later.");
      return;
    }
    if (!bookingSystemEnabled) {
      toast.error("Booking system is currently disabled. Please contact admin.");
      return;
    }
    const booking = bookings.find(b => b.slot_key === slotKey);
    if (!booking || booking.status === "expired") {
      setSelectedSlot(slotKey);
      setIsModalOpen(true);
    } else {
      toast.info("This slot is already booked or pending confirmation");
    }
  };
  const getSlotStatus = (slotKey: string) => {
    const bookingForSlot = bookings.find((entry) => entry.slot_key === slotKey);
    if (!bookingForSlot || bookingForSlot.status === "expired") return "available";
    return bookingForSlot.status;
  };
  const getBookingTimestamp = (slotKey: string) => {
    const bookingForSlot = bookings.find((entry) => entry.slot_key === slotKey);
    return bookingForSlot?.whatsapp_sent_at ?? undefined;
  };
  const expireBooking = async () => {
    try {
      await supabase.functions.invoke("expire-bookings");
      await fetchBookings();
    } catch (error) {
      console.error("Error expiring bookings:", error);
    }
  };
  return <div className="min-h-screen bg-[var(--gradient-hero)] relative overflow-hidden">
      {/* Maintenance Banner */}
      {maintenanceMode && <div className="bg-destructive text-destructive-foreground py-3 px-4 text-center font-semibold sticky top-0 z-50">
          ⚠️ System is currently under maintenance. Booking functionality is disabled.
        </div>}

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{
      animationDelay: '1s'
    }} />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50 shadow-[var(--shadow-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
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
        <div className="text-center mb-16 md:mb-20 animate-slide-in-from-top">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full mb-6 border border-primary/20 backdrop-blur-sm shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300">
            <Sparkles className="h-4 w-4 text-primary animate-glow" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Chennai's Premier Srashtam Services</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-glow">Hindu Sharatham Booking</span>
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 mb-3 font-light">
            Sacred Ceremonies, Served with Compassion
          </p>
          
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-lg text-muted-foreground">Traditional Hindu ancestral services with modern convenience.</p>
            <p className="text-base text-muted-foreground">
              Chennai-based • NRI-friendly • Compassionate care when it matters most
            </p>
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-[var(--gradient-card)] backdrop-blur-xl rounded-3xl shadow-[var(--shadow-elevated)] border border-border/50 overflow-hidden animate-slide-in-from-bottom relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 px-8 py-10 md:px-10 border-b border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CalendarDays className="h-8 w-8 text-primary animate-float" />
              <Sparkles className="h-5 w-5 text-accent animate-glow" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Book Your Sacred Ceremony
            </h3>
            <p className="text-center text-muted-foreground text-base">Choose your preferred date and time slot</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-10 relative">
            {/* Calendar Section */}
            <div className="animate-slide-in-from-left space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-12 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                <h4 className="text-xl font-bold text-foreground">Select Date</h4>
              </div>
              <div className="flex justify-center bg-gradient-to-br from-secondary/50 to-secondary/30 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
                <Calendar mode="single" selected={selectedDate} onSelect={date => date && setSelectedDate(date)} disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))} className="rounded-md" />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="animate-slide-in-from-right space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-12 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                <h4 className="text-xl font-bold text-foreground">Available Slots</h4>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-primary/20 shadow-[var(--shadow-soft)]">
                <p className="text-base font-semibold text-foreground mb-2">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">Choose your preferred time</p>
              </div>

              {loading ? <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div> : <div className="space-y-3">
                  {SLOTS.map(slot => {
                const status = getSlotStatus(slot.key);
                const timestamp = getBookingTimestamp(slot.key);
                return <SlotCard key={slot.key} slotKey={slot.key} time={slot.time} label={slot.label} status={status} onClick={() => handleSlotClick(slot.key)} loading={loading} pendingTimestamp={timestamp} onExpire={expireBooking} />;
              })}
                </div>}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center max-w-4xl mx-auto animate-slide-in-from-bottom">
          <div className="bg-[var(--gradient-card)] backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[var(--shadow-elevated)] border border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                  <Phone className="h-8 w-8 text-primary animate-float" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Need Assistance?
              </h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our compassionate team is here to guide you through the sacred ceremony booking process and answer all your questions.
              </p>
              <Button onClick={() => window.location.href = 'tel:+919094257006'} className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105 text-lg px-8 py-6" size="lg">
                <Phone className="h-5 w-5" />
                Call +91 90942 57006
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal isOpen={isModalOpen} onClose={() => {
      setIsModalOpen(false);
      setSelectedSlot(null);
    }} slotKey={selectedSlot || ""} selectedDate={selectedDate} onSuccess={fetchBookings} />
    </div>;
};
export default Index;