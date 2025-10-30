import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { SlotCard } from "@/components/SlotCard";
import { BookingModal } from "@/components/BookingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const SLOTS = [
  { key: "morning", time: "6AM - 10AM", label: "Morning Slot" },
  { key: "afternoon", time: "11AM - 3PM", label: "Afternoon Slot" },
  { key: "evening", time: "4PM - 7PM", label: "Evening Slot" },
];

interface Booking {
  id: string;
  slot_key: string;
  status: string;
  user_name: string;
}

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    subscribeToBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", dateStr);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBookings = () => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    
    const channel = supabase
      .channel(`bookings-${dateStr}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${dateStr}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSlotClick = (slotKey: string) => {
    const booking = bookings.find((b) => b.slot_key === slotKey);
    if (!booking || booking.status === "expired") {
      setSelectedSlot(slotKey);
      setIsModalOpen(true);
    } else {
      toast.info("This slot is already booked or pending confirmation");
    }
  };

  const getSlotStatus = (slotKey: string) => {
    const booking = bookings.find((b) => b.slot_key === slotKey);
    if (!booking || booking.status === "expired") return "available";
    return booking.status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-[var(--shadow-card)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">PITRU KARMA</h1>
              <p className="text-xs text-muted-foreground">पितृकर्मा मार्गः मोक्षाय</p>
            </div>
          </div>
          <a 
            href="tel:+919003073491" 
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Phone className="h-5 w-5" />
            <span className="font-semibold hidden sm:inline">+91 90030 73491</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4 border border-primary/20">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Chennai's Most Trusted After-Death Care</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            The Path to <span className="text-primary">Moksha</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 mb-2">
            Guided with Tradition, Served with Empathy
          </p>
          <p className="text-base text-primary/70 font-semibold mb-6">
            पितृकर्मा मार्गः मोक्षाय
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
            Full-service Hindu funeral and ritual management. Chennai-based. NRI-friendly.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compassionate care when it matters most.
          </p>
        </div>

        {/* Booking Section */}
        <div className="bg-card rounded-2xl shadow-[var(--shadow-elevated)] border border-border overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-6 py-8 md:px-8 border-b border-border">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Book Your Ritual Slot
            </h3>
            <p className="text-muted-foreground">
              Select a date and choose your preferred time slot for the ceremony
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Calendar Section */}
            <div className="animate-in fade-in slide-in-from-left duration-700 delay-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded"></div>
                <h4 className="text-lg font-semibold text-foreground">Select Date</h4>
              </div>
              <div className="flex justify-center bg-secondary/30 rounded-xl p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md"
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="animate-in fade-in slide-in-from-right duration-700 delay-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded"></div>
                <h4 className="text-lg font-semibold text-foreground">Available Time Slots</h4>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Select your preferred time for the ritual ceremony
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {SLOTS.map((slot) => {
                    const status = getSlotStatus(slot.key);
                    return (
                      <SlotCard
                        key={slot.key}
                        slotKey={slot.key}
                        time={slot.time}
                        label={slot.label}
                        status={status}
                        onClick={() => handleSlotClick(slot.key)}
                        loading={loading}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          <div className="bg-card rounded-xl p-6 md:p-8 shadow-[var(--shadow-card)] border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Need Assistance?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our team is available to help you with booking and answer any questions about the ritual ceremonies.
            </p>
            <Button 
              onClick={() => window.location.href = 'tel:+919003073491'}
              className="gap-2"
              size="lg"
            >
              <Phone className="h-4 w-4" />
              Call +91 90030 73491
            </Button>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        slotKey={selectedSlot || ""}
        selectedDate={selectedDate}
        onSuccess={fetchBookings}
      />
    </div>
  );
};

export default Index;
