import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Shield, LogOut, Filter, Pencil, Check, X } from "lucide-react";
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
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBooking, setEditedBooking] = useState<Partial<Booking>>({});
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Set up real-time subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to access admin panel");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setCheckingAuth(false);
      fetchBookings();
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Authentication error");
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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

  const startEditing = (booking: Booking) => {
    setEditingId(booking.id);
    setEditedBooking({
      user_name: booking.user_name,
      phone_number: booking.phone_number,
      address: booking.address,
      booking_date: booking.booking_date,
      slot_key: booking.slot_key,
      status: booking.status,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedBooking({});
  };

  const saveEditing = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          ...editedBooking,
          admin_override: true,
          last_modified_by: "Admin",
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking updated successfully");
      setEditingId(null);
      setEditedBooking({});
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
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

  const filteredBookings = bookings.filter((booking) => {
    const matchesDate = !dateFilter || booking.booking_date === dateFilter;
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFilter">Filter by Date</Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="statusFilter">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="statusFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Input
                              value={editedBooking.user_name || ""}
                              onChange={(e) =>
                                setEditedBooking({ ...editedBooking, user_name: e.target.value })
                              }
                              className="h-8"
                            />
                          ) : (
                            booking.user_name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Input
                              value={editedBooking.phone_number || ""}
                              onChange={(e) =>
                                setEditedBooking({ ...editedBooking, phone_number: e.target.value })
                              }
                              className="h-8"
                            />
                          ) : (
                            booking.phone_number
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Input
                              value={editedBooking.address || ""}
                              onChange={(e) =>
                                setEditedBooking({ ...editedBooking, address: e.target.value })
                              }
                              className="h-8"
                            />
                          ) : (
                            <span className="line-clamp-2" title={booking.address}>
                              {booking.address}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Input
                              type="date"
                              value={editedBooking.booking_date || ""}
                              onChange={(e) =>
                                setEditedBooking({ ...editedBooking, booking_date: e.target.value })
                              }
                              className="h-8"
                            />
                          ) : (
                            format(new Date(booking.booking_date), "MMM d, yyyy")
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Select
                              value={editedBooking.slot_key || ""}
                              onValueChange={(value) =>
                                setEditedBooking({ ...editedBooking, slot_key: value })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="afternoon">Afternoon</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getSlotLabel(booking.slot_key)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === booking.id ? (
                            <Select
                              value={editedBooking.status || ""}
                              onValueChange={(value) =>
                                setEditedBooking({ ...editedBooking, status: value })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === booking.id ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEditing(booking.id)}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(booking)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
