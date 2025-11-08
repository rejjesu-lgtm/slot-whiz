import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Settings, Calendar, Lock, Shield } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  slot_key: string;
  user_name: string;
  phone_number: string;
  address: string;
  status: string;
  admin_override: boolean;
  admin_notes: string | null;
  last_modified_by: string | null;
  last_modified_at: string | null;
  created_at: string;
}

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

export default function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    fetchBookings();
    fetchSettings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string, override: boolean) => {
    if (!adminName) {
      toast.error("Please enter your admin name");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          admin_override: override,
          admin_notes: adminNotes,
          last_modified_by: adminName,
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking updated successfully");
      fetchBookings();
      setSelectedBooking(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const updateSetting = async (settingKey: string, newValue: string) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ setting_value: newValue })
        .eq("setting_key", settingKey);

      if (error) throw error;

      toast.success("Setting updated successfully");
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
      toast.error("Failed to update setting");
    }
  };

  const getSlotLabel = (key: string) => {
    const labels: Record<string, string> = {
      morning: "1st Slot (6AM - 10AM)",
      afternoon: "2nd Slot (11AM - 3PM)",
      evening: "3rd Slot (4PM - 7PM)",
    };
    return labels[key] || key;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* System Settings */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>System Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold">{setting.setting_key}</Label>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  {setting.setting_value === "true" || setting.setting_value === "false" ? (
                    <Switch
                      checked={setting.setting_value === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting(setting.setting_key, checked ? "true" : "false")
                      }
                    />
                  ) : (
                    <Input
                      value={setting.setting_value}
                      onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                      className="w-48"
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Admin Name */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="adminName">Your Admin Name</Label>
            <Input
              id="adminName"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Enter your name for audit trail"
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>All Bookings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bookings found</p>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Booking ID:</span>
                            <span className="text-sm font-mono">{booking.id.slice(0, 8)}</span>
                          </div>
                          <p className="text-sm">
                            <span className="font-semibold">Name:</span> {booking.user_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Phone:</span> {booking.phone_number}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Address:</span> {booking.address}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Date:</span>{" "}
                            {format(new Date(booking.booking_date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Time Slot:</span> {getSlotLabel(booking.slot_key)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Status:</span>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.admin_override && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                Override
                              </span>
                            )}
                          </div>
                          {booking.admin_notes && (
                            <div className="bg-muted p-2 rounded">
                              <p className="text-xs font-semibold">Admin Notes:</p>
                              <p className="text-xs">{booking.admin_notes}</p>
                            </div>
                          )}
                          {booking.last_modified_by && (
                            <p className="text-xs text-muted-foreground">
                              Last modified by {booking.last_modified_by} on{" "}
                              {booking.last_modified_at &&
                                format(new Date(booking.last_modified_at), "MMM d, yyyy HH:mm")}
                            </p>
                          )}

                          <div className="pt-2 space-y-2">
                            <Label htmlFor={`status-${booking.id}`}>Change Status</Label>
                            <Select
                              onValueChange={(value) => {
                                setSelectedBooking(booking);
                                updateBookingStatus(booking.id, value, true);
                              }}
                            >
                              <SelectTrigger id={`status-${booking.id}`}>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="space-y-1">
                              <Label htmlFor={`notes-${booking.id}`}>Admin Notes</Label>
                              <Textarea
                                id={`notes-${booking.id}`}
                                value={selectedBooking?.id === booking.id ? adminNotes : booking.admin_notes || ""}
                                onChange={(e) => {
                                  setSelectedBooking(booking);
                                  setAdminNotes(e.target.value);
                                }}
                                placeholder="Add notes about this booking..."
                                rows={2}
                              />
                            </div>

                            {selectedBooking?.id === booking.id && adminNotes && (
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, booking.status, true)}
                              >
                                Save Notes
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
