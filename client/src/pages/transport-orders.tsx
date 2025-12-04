import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Plus,
  Search,
  X,
  Eye,
  UserPlus,
  RefreshCw,
  MapPin,
  ArrowRight,
  Calendar,
  Truck,
  Users,
  MoreHorizontal,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface TransportOrder {
  id: string;
  orderNumber: string;
  quoteId: string;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  pickupDate: string | null;
  estimatedDeliveryDate: string | null;
  driverId: string | null;
  truckId: string | null;
  status: string;
  paymentStatus: string;
  paymentAmount: string | null;
  createdAt: string;
  quote?: {
    id: string;
    quoteNumber: string;
    pickupCity: string;
    pickupProvince: string;
    deliveryCity: string;
    deliveryProvince: string;
    vehicleYear: number | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    totalPrice: string | null;
  };
}

const ORDER_STATUS_STEPS = ["booked", "assigned", "picked_up", "in_transit", "delivered", "completed"];

const getStatusProgress = (status: string): number => {
  const index = ORDER_STATUS_STEPS.indexOf(status);
  if (index === -1) return 0;
  return ((index + 1) / ORDER_STATUS_STEPS.length) * 100;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "booked", label: "Booked" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "booked":
      return <Badge className="bg-slate-600 hover:bg-slate-700">Booked</Badge>;
    case "assigned":
      return <Badge className="bg-blue-600 hover:bg-blue-700">Assigned</Badge>;
    case "picked_up":
      return <Badge className="bg-purple-600 hover:bg-purple-700">Picked Up</Badge>;
    case "in_transit":
      return <Badge className="bg-cyan-600 hover:bg-cyan-700">In Transit</Badge>;
    case "delivered":
      return <Badge className="bg-green-600 hover:bg-green-700">Delivered</Badge>;
    case "completed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-600 hover:bg-red-700">Cancelled</Badge>;
    default:
      return <Badge className="bg-slate-600 hover:bg-slate-700">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-600 hover:bg-amber-700">Pending</Badge>;
    case "paid":
      return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
    case "refunded":
      return <Badge className="bg-red-600 hover:bg-red-700">Refunded</Badge>;
    default:
      return <Badge className="bg-slate-600 hover:bg-slate-700">{status}</Badge>;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function TransportOrdersPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin, isTransportation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/transport/orders", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all" 
        ? `/api/transport/orders?status=${statusFilter}` 
        : "/api/transport/orders";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const filteredOrders = useMemo(() => {
    return (orders as TransportOrder[]).filter((order) => {
      const matchesSearch =
        searchTerm === "" ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pickupContactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quote?.vehicleMake?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quote?.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateFrom =
        dateFrom === "" || (order.createdAt && new Date(order.createdAt) >= new Date(dateFrom));

      const matchesDateTo =
        dateTo === "" || (order.createdAt && new Date(order.createdAt) <= new Date(dateTo));

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchTerm, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const orderStats = useMemo(() => {
    const orderList = orders as TransportOrder[];
    return {
      total: orderList.length,
      booked: orderList.filter(o => o.status === 'booked').length,
      inTransit: orderList.filter(o => o.status === 'in_transit' || o.status === 'picked_up').length,
      delivered: orderList.filter(o => o.status === 'delivered').length,
      completed: orderList.filter(o => o.status === 'completed').length,
    };
  }, [orders]);

  const handleViewOrder = (orderId: string) => {
    toast({
      title: "View Order",
      description: `Viewing order details for ${orderId}`,
    });
  };

  const handleAssignDriver = (orderId: string) => {
    toast({
      title: "Assign Driver",
      description: `Opening driver assignment for ${orderId}`,
    });
  };

  const handleUpdateStatus = (orderId: string) => {
    toast({
      title: "Update Status",
      description: `Opening status update for ${orderId}`,
    });
  };

  const handleNewOrder = () => {
    navigate('/transport');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading transport orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" data-testid="text-page-title">
                Transport Orders
              </h1>
              <p className="text-slate-400">
                Manage and track all transport orders
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-600"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNewOrder}
              data-testid="button-new-order"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{orderStats.total}</p>
                  <p className="text-xs text-slate-400">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{orderStats.booked}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/20 rounded-lg">
                  <Truck className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{orderStats.inTransit}</p>
                  <p className="text-xs text-slate-400">In Transit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{orderStats.delivered}</p>
                  <p className="text-xs text-slate-400">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{orderStats.completed}</p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-slate-400 mb-1 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by order # or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-600 text-white"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="w-[180px]">
                <label className="text-sm text-slate-400 mb-1 block">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  data-testid="select-status"
                >
                  <SelectTrigger
                    className="bg-slate-900 border-slate-600 text-white"
                    data-testid="trigger-status"
                  >
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[160px]">
                <label className="text-sm text-slate-400 mb-1 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                  data-testid="input-date-from"
                />
              </div>

              <div className="w-[160px]">
                <label className="text-sm text-slate-400 mb-1 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                  data-testid="input-date-to"
                />
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700" data-testid="card-orders-table">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Orders ({filteredOrders.length})
            </CardTitle>
            <CardDescription>
              All transport orders and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div
                className="text-center py-12"
                data-testid="empty-state"
              >
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No Orders Found
                </h3>
                <p className="text-slate-500 mb-4">
                  {hasActiveFilters
                    ? "No orders match your current filters. Try adjusting your search criteria."
                    : "There are no transport orders yet. Create your first order to get started."}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="button-clear-filters-empty"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/30">
                      <TableHead className="text-slate-300">Order #</TableHead>
                      <TableHead className="text-slate-300">Quote #</TableHead>
                      <TableHead className="text-slate-300">Pickup Location</TableHead>
                      <TableHead className="text-slate-300">Delivery Location</TableHead>
                      <TableHead className="text-slate-300">Vehicle</TableHead>
                      <TableHead className="text-slate-300">Pickup Date</TableHead>
                      <TableHead className="text-slate-300">Est. Delivery</TableHead>
                      <TableHead className="text-slate-300">Driver</TableHead>
                      <TableHead className="text-slate-300">Truck</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Payment</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-slate-700 hover:bg-slate-700/30"
                        data-testid={`row-order-${order.id}`}
                      >
                        <TableCell>
                          <button
                            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                            onClick={() => handleViewOrder(order.id)}
                            data-testid={`link-order-${order.id}`}
                          >
                            {order.orderNumber}
                          </button>
                        </TableCell>
                        <TableCell
                          className="text-slate-400"
                          data-testid={`text-quote-${order.id}`}
                        >
                          {order.quote?.quoteNumber || `Q-${order.quoteId?.slice(0,8) || 'N/A'}`}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span data-testid={`text-pickup-${order.id}`}>
                              {order.quote?.pickupCity || 'N/A'}, {order.quote?.pickupProvince || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span data-testid={`text-delivery-${order.id}`}>
                              {order.quote?.deliveryCity || 'N/A'}, {order.quote?.deliveryProvince || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-slate-300"
                          data-testid={`text-vehicle-${order.id}`}
                        >
                          {order.quote?.vehicleYear && order.quote?.vehicleMake 
                            ? `${order.quote.vehicleYear} ${order.quote.vehicleMake} ${order.quote.vehicleModel || ''}`.trim()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div
                            className="flex items-center gap-1"
                            data-testid={`text-pickup-date-${order.id}`}
                          >
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {order.pickupDate ? formatDate(order.pickupDate) : 'TBD'}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div
                            className="flex items-center gap-1"
                            data-testid={`text-est-delivery-${order.id}`}
                          >
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : 'TBD'}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {order.driverId ? (
                            <div
                              className="flex items-center gap-1"
                              data-testid={`text-driver-${order.id}`}
                            >
                              <Users className="w-3 h-3 text-slate-400" />
                              Driver #{order.driverId.slice(0,6)}
                            </div>
                          ) : (
                            <span
                              className="text-slate-500 italic"
                              data-testid={`text-driver-unassigned-${order.id}`}
                            >
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {order.truckId ? (
                            <div
                              className="flex items-center gap-1"
                              data-testid={`text-truck-${order.id}`}
                            >
                              <Truck className="w-3 h-3 text-slate-400" />
                              TRK-{order.truckId.slice(0,4)}
                            </div>
                          ) : (
                            <span
                              className="text-slate-500 italic"
                              data-testid={`text-truck-unassigned-${order.id}`}
                            >
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${order.id}`}>
                          <div className="space-y-1">
                            {getStatusBadge(order.status as any)}
                            <Progress value={getStatusProgress(order.status)} className="h-1 w-16" />
                          </div>
                        </TableCell>
                        <TableCell data-testid={`badge-payment-${order.id}`}>
                          {getPaymentStatusBadge(order.paymentStatus as any)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                data-testid={`button-actions-${order.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                onClick={() => handleViewOrder(order.id)}
                                className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                data-testid={`menu-view-${order.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {(isAdmin || isTransportation) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleAssignDriver(order.id)}
                                    className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                    data-testid={`menu-assign-driver-${order.id}`}
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Assign Driver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id)}
                                    className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                    data-testid={`menu-update-status-${order.id}`}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Update Status
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
