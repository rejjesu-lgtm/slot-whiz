import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  address: z.string().trim().min(5, "Please enter a valid address").max(500, "Address too long"),
  phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number"),
});

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotKey: string;
  selectedDate: Date;
  onSuccess: () => void;
}

export const BookingModal = ({
  isOpen,
  onClose,
  slotKey,
  selectedDate,
  onSuccess,
}: BookingModalProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!userId) {
      toast.error("Please sign in to make a booking");
      navigate("/auth");
      onClose();
      return;
    }
    
    // Validate form
    try {
      bookingSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Check if slot is still available
      const { data: existing } = await supabase
        .from("bookings")
        .select("status")
        .eq("booking_date", dateStr)
        .eq("slot_key", slotKey)
        .single();

      if (existing && existing.status !== "expired") {
        toast.error("This slot has already been booked");
        onClose();
        return;
      }

      // Create or update booking
      const bookingData = {
        user_id: userId,
        user_name: formData.name.trim(),
        address: formData.address.trim(),
        phone_number: formData.phone.trim(),
        booking_date: dateStr,
        slot_key: slotKey,
        status: "pending",
        whatsapp_sent_at: new Date().toISOString(),
      };

      let bookingId: string;

      if (existing) {
        const { data: updated, error: updateError } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("booking_date", dateStr)
          .eq("slot_key", slotKey)
          .select("id")
          .single();
        
        if (updateError) throw updateError;
        bookingId = updated.id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("bookings")
          .insert([bookingData])
          .select("id")
          .single();
        
        if (insertError) throw insertError;
        bookingId = inserted.id;
      }

      // Generate confirmation link
      const confirmLink = `${window.location.origin}/confirm?id=${bookingId}`;

      const slotLabels: Record<string, string> = {
        morning: "1st Slot (6AM - 1PM)",
        afternoon: "2nd Slot (7AM - 2PM)",
      };

      const slotTime = slotLabels[slotKey] || slotKey;
      const formattedDate = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const message = `Hi, I want to confirm my booking for the ${slotTime} on ${formattedDate}. Please click to confirm: ${confirmLink}`;
      const whatsappUrl = `https://wa.me/+919094257006?text=${encodeURIComponent(message)}`;

      toast.success("Redirecting to WhatsApp...");

      // Redirect to WhatsApp (works better on mobile than window.open)
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 500);

      setFormData({ name: "", address: "", phone: "" });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSlotLabel = () => {
    const labels: Record<string, string> = {
      morning: "1st Slot (6AM - 1PM)",
      afternoon: "2nd Slot (7AM - 2PM)",
    };
    return labels[slotKey] || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-card/95 border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Book Your Slot</DialogTitle>
          <DialogDescription className="text-base">
            {getSlotLabel()} on{" "}
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              maxLength={100}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, City, State"
              required
              maxLength={500}
              rows={3}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
              required
              maxLength={20}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
            <p className="text-sm text-foreground">
              📱 You'll receive a WhatsApp confirmation message. Please confirm within 12 hours to
              secure your booking.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Slot"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
