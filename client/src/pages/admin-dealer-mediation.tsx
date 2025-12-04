import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Store,
  Car,
  DollarSign,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface InterestRequest {
  id: number;
  buyerDealerId: number;
  sellerDealerId: number;
  inventoryId: number;
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  buyerDealerName?: string;
  sellerDealerName?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  sellingPrice?: number;
  buyBudget?: number;
}

interface DealerInfo {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface InventoryItem {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  sellingPrice: number;
  buyBudget: number;
  dealerId: number;
  dealerName?: string;
  condition?: string;
  kilometers?: number;
}

export default function AdminDealerMediationPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<InterestRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "facilitate">("approve");
  
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: interestRequests = [], isLoading: loadingRequests } = useQuery<InterestRequest[]>({
    queryKey: ["/api/admin/dealer/interest-requests"],
  });

  const { data: allInventory = [], isLoading: loadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/dealer/inventory"],
  });

  const { data: dealers = [], isLoading: loadingDealers } = useQuery<DealerInfo[]>({
    queryKey: ["/api/admin/dealers"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNotes }: { requestId: number; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/dealer/interest-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dealer/interest-requests"] });
      toast({ title: "Updated", description: "Interest request has been updated" });
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredRequests = interestRequests.filter((req) => {
    const matchesSearch = 
      req.buyerDealerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.sellerDealerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vehicleMake?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = interestRequests.filter(r => r.status === "pending").length;
  const approvedCount = interestRequests.filter(r => r.status === "admin_approved").length;
  const completedCount = interestRequests.filter(r => r.status === "completed").length;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Pending Review", icon: <Clock className="w-3 h-3" /> },
      admin_approved: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Admin Approved", icon: <CheckCircle className="w-3 h-3" /> },
      seller_accepted: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Seller Accepted", icon: <CheckCircle className="w-3 h-3" /> },
      seller_declined: { color: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "Seller Declined", icon: <XCircle className="w-3 h-3" /> },
      completed: { color: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30", label: "Deal Completed", icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", label: "Cancelled", icon: <XCircle className="w-3 h-3" /> },
    };
    const c = config[status] || config.pending;
    return (
      <Badge variant="outline" className={`${c.color} flex items-center gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const handleAction = (request: InterestRequest, type: "approve" | "reject" | "facilitate") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes(request.adminNotes || "");
    setActionDialogOpen(true);
  };

  const executeAction = () => {
    if (!selectedRequest) return;
    
    let newStatus = "";
    switch (actionType) {
      case "approve":
        newStatus = "admin_approved";
        break;
      case "reject":
        newStatus = "cancelled";
        break;
      case "facilitate":
        newStatus = "completed";
        break;
    }
    
    updateRequestMutation.mutate({
      requestId: selectedRequest.id,
      status: newStatus,
      adminNotes: adminNotes,
    });
  };

  const getPriceAlignment = (sellingPrice?: number, buyBudget?: number) => {
    if (!sellingPrice || !buyBudget) return null;
    const diff = ((sellingPrice - buyBudget) / sellingPrice) * 100;
    if (diff <= 5) return { label: "Excellent Match", color: "text-emerald-400", icon: <TrendingUp className="w-4 h-4" /> };
    if (diff <= 15) return { label: "Good Match", color: "text-blue-400", icon: <TrendingUp className="w-4 h-4" /> };
    if (diff <= 25) return { label: "Moderate Gap", color: "text-amber-400", icon: <AlertTriangle className="w-4 h-4" /> };
    return { label: "Large Gap", color: "text-rose-400", icon: <AlertTriangle className="w-4 h-4" /> };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              B2B Dealer Mediation
            </h1>
            <p className="text-slate-400 mt-1">Review and facilitate dealer-to-dealer transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                  <p className="text-xs text-slate-400">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{approvedCount}</p>
                  <p className="text-xs text-slate-400">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completedCount}</p>
                  <p className="text-xs text-slate-400">Deals Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Store className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{allInventory.length}</p>
                  <p className="text-xs text-slate-400">Listed Vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="requests" className="data-[state=active]:bg-slate-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Interest Requests
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700">
              <Car className="w-4 h-4 mr-2" />
              All Inventory
            </TabsTrigger>
            <TabsTrigger value="dealers" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Dealers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by dealer or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                  data-testid="input-search-requests"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700" data-testid="select-status-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="admin_approved">Approved</SelectItem>
                  <SelectItem value="seller_accepted">Seller Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                  <p>No interest requests found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const alignment = getPriceAlignment(request.sellingPrice, request.buyBudget);
                  return (
                    <Card key={request.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors" data-testid={`card-request-${request.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/20">
                                <Car className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">
                                  {request.vehicleYear} {request.vehicleMake} {request.vehicleModel}
                                </h3>
                                <p className="text-xs text-slate-400">Request #{request.id}</p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <Store className="w-4 h-4 text-emerald-400" />
                                  <span className="text-xs font-medium text-emerald-400">SELLER</span>
                                </div>
                                <p className="font-medium text-white">{request.sellerDealerName || "Unknown Dealer"}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <DollarSign className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-slate-300">Asking: ${request.sellingPrice?.toLocaleString() || "N/A"}</span>
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <Store className="w-4 h-4 text-blue-400" />
                                  <span className="text-xs font-medium text-blue-400">BUYER</span>
                                </div>
                                <p className="font-medium text-white">{request.buyerDealerName || "Unknown Dealer"}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <DollarSign className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-slate-300">Budget: ${request.buyBudget?.toLocaleString() || "N/A"}</span>
                                </div>
                              </div>
                            </div>

                            {alignment && (
                              <div className={`flex items-center gap-2 ${alignment.color}`}>
                                {alignment.icon}
                                <span className="text-sm font-medium">{alignment.label}</span>
                                {request.sellingPrice && request.buyBudget && (
                                  <span className="text-xs text-slate-400">
                                    (Gap: ${(request.sellingPrice - request.buyBudget).toLocaleString()})
                                  </span>
                                )}
                              </div>
                            )}

                            {request.message && (
                              <div className="p-2 rounded bg-slate-900/50 border border-slate-700">
                                <p className="text-xs text-slate-400 mb-1">Buyer's Message:</p>
                                <p className="text-sm text-slate-300">{request.message}</p>
                              </div>
                            )}

                            {request.adminNotes && (
                              <div className="p-2 rounded bg-violet-900/30 border border-violet-700/50">
                                <p className="text-xs text-violet-400 mb-1">Admin Notes:</p>
                                <p className="text-sm text-slate-300">{request.adminNotes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(request, "approve")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  data-testid={`button-approve-${request.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(request, "reject")}
                                  className="border-rose-600 text-rose-400 hover:bg-rose-600/10"
                                  data-testid={`button-reject-${request.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {(request.status === "admin_approved" || request.status === "seller_accepted") && (
                              <Button
                                size="sm"
                                onClick={() => handleAction(request, "facilitate")}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                                data-testid={`button-facilitate-${request.id}`}
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-1" />
                                Facilitate Deal
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              data-testid={`button-view-${request.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  All Dealer Inventory
                </CardTitle>
                <CardDescription>View all vehicles listed by dealers with full pricing visibility</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInventory ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : allInventory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Car className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No inventory items found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-700">
                        <tr>
                          <th className="text-left py-3 px-4 text-slate-400">Vehicle</th>
                          <th className="text-left py-3 px-4 text-slate-400">Dealer</th>
                          <th className="text-left py-3 px-4 text-slate-400">VIN</th>
                          <th className="text-right py-3 px-4 text-slate-400">Selling Price</th>
                          <th className="text-right py-3 px-4 text-slate-400">Buy Budget</th>
                          <th className="text-left py-3 px-4 text-slate-400">Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {allInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-700/30" data-testid={`row-inventory-${item.id}`}>
                            <td className="py-3 px-4 text-white font-medium">
                              {item.year} {item.make} {item.model}
                            </td>
                            <td className="py-3 px-4 text-slate-300">{item.dealerName || `Dealer #${item.dealerId}`}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-xs">{item.vin}</td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                              ${item.sellingPrice?.toLocaleString() || "—"}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-400 font-medium">
                              ${item.buyBudget?.toLocaleString() || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {item.condition || "N/A"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dealers">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  Registered Dealers
                </CardTitle>
                <CardDescription>View dealer accounts and their contact information</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDealers ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : dealers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No dealers found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dealers.map((dealer) => (
                      <div key={dealer.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700" data-testid={`card-dealer-${dealer.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {dealer.name?.[0]?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{dealer.name}</h3>
                            <p className="text-xs text-slate-400">ID: {dealer.id}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {dealer.email && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Mail className="w-4 h-4 text-slate-500" />
                              {dealer.email}
                            </div>
                          )}
                          {dealer.phone && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <Phone className="w-4 h-4 text-slate-500" />
                              {dealer.phone}
                            </div>
                          )}
                          {dealer.address && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4 text-slate-500" />
                              {dealer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {actionType === "approve" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {actionType === "reject" && <XCircle className="w-5 h-5 text-rose-400" />}
                {actionType === "facilitate" && <ArrowRightLeft className="w-5 h-5 text-violet-400" />}
                {actionType === "approve" && "Approve Interest Request"}
                {actionType === "reject" && "Reject Interest Request"}
                {actionType === "facilitate" && "Facilitate Deal"}
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">Vehicle:</p>
                  <p className="font-medium text-white">
                    {selectedRequest.vehicleYear} {selectedRequest.vehicleMake} {selectedRequest.vehicleModel}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
                    <p className="text-xs text-emerald-400 mb-1">Seller's Price</p>
                    <p className="font-bold text-emerald-300">${selectedRequest.sellingPrice?.toLocaleString() || "N/A"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-700/50">
                    <p className="text-xs text-blue-400 mb-1">Buyer's Budget</p>
                    <p className="font-bold text-blue-300">${selectedRequest.buyBudget?.toLocaleString() || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    className="bg-slate-800 border-slate-700"
                    data-testid="textarea-admin-notes"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={updateRequestMutation.isPending}
                className={
                  actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" :
                  actionType === "reject" ? "bg-rose-600 hover:bg-rose-700" :
                  "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                }
                data-testid="button-confirm-action"
              >
                {updateRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {actionType === "approve" && "Approve Request"}
                {actionType === "reject" && "Reject Request"}
                {actionType === "facilitate" && "Mark Deal Complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
