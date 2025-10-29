import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { SlotCard } from "@/components/SlotCard";
import { BookingModal } from "@/components/BookingModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Book Your Slot
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a date and choose your preferred time slot
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Calendar Section */}
          <Card className="p-6 shadow-[var(--shadow-card)] border-border/50 backdrop-blur-sm animate-in fade-in slide-in-from-left duration-700">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Select a Date
            </h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-lg"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </Card>

          {/* Selected Date Info */}
          <Card className="p-6 shadow-[var(--shadow-card)] border-border/50 backdrop-blur-sm animate-in fade-in slide-in-from-right duration-700">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Booking Details
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Selected Date</p>
                <p className="text-xl font-semibold text-primary">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status Legend:</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Booked</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Slots Section */}
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">
            Available Time Slots
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SLOTS.map((slot, index) => (
              <SlotCard
                key={slot.key}
                slotKey={slot.key}
                time={slot.time}
                label={slot.label}
                status={getSlotStatus(slot.key)}
                onClick={() => handleSlotClick(slot.key)}
                loading={loading}
                delay={index * 100}
              />
            ))}
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
