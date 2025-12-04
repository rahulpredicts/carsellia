import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Plus, 
  Search, 
  Car,
  DollarSign,
  Tag,
  TrendingUp,
  ShoppingCart,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Store,
  Handshake,
  Send,
  Target,
  FileText,
  History,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

interface DealerInventoryItem {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  vin?: string;
  kilometers?: number;
  color?: string;
  condition?: string;
  askingPrice?: string;
  listOnMarketplace: boolean;
  status: string;
  photos?: string[];
  createdAt: string;
}

interface MarketplaceListing {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  kilometers?: number;
  color?: string;
  condition?: string;
  photos?: string[];
  source: string;
}

interface InterestRequest {
  id: string;
  targetType: string;
  offeredPrice?: string;
  message?: string;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppraisalHistory {
  id: string;
  make: string;
  model: string;
  year: number;
  sellingPrice: string;
  buyBudget: string;
  listedOnMarketplace: boolean;
  createdAt: string;
}

export default function DealerPortalPage() {
  const { user, isAdmin, isDealerAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<MarketplaceListing | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<DealerInventoryItem[]>({
    queryKey: ['/api/dealer/inventory'],
  });

  const { data: marketplace = [], isLoading: marketplaceLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/dealer/marketplace'],
  });

  const { data: interests = [], isLoading: interestsLoading } = useQuery<InterestRequest[]>({
    queryKey: ['/api/dealer/interests'],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/dealer/notifications'],
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['/api/dealer/notifications/count'],
  });

  const { data: appraisals = [] } = useQuery<AppraisalHistory[]>({
    queryKey: ['/api/dealer/appraisals'],
  });

  const expressInterestMutation = useMutation({
    mutationFn: async (data: { targetType: string; targetId: string; offeredPrice?: string; message?: string }) => {
      return apiRequest('POST', '/api/dealer/interest', data);
    },
    onSuccess: () => {
      toast({ title: "Interest Submitted", description: "The platform admin will contact you shortly." });
      setShowInterestDialog(false);
      setSelectedVehicle(null);
      setInterestMessage('');
      setOfferedPrice('');
      queryClient.invalidateQueries({ queryKey: ['/api/dealer/interests'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit interest request", variant: "destructive" });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/dealer/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dealer/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dealer/notifications/count'] });
    },
  });

  const inventoryStats = {
    total: inventory.length,
    available: inventory.filter(i => i.status === 'available').length,
    listed: inventory.filter(i => i.listOnMarketplace).length,
    sold: inventory.filter(i => i.status === 'sold').length,
  };

  const handleExpressInterest = (vehicle: MarketplaceListing) => {
    setSelectedVehicle(vehicle);
    setShowInterestDialog(true);
  };

  const submitInterest = () => {
    if (!selectedVehicle) return;
    expressInterestMutation.mutate({
      targetType: 'dealer_listing',
      targetId: selectedVehicle.id,
      offeredPrice: offeredPrice || undefined,
      message: interestMessage || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-600">Available</Badge>;
      case 'sold':
        return <Badge className="bg-purple-600">Sold</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case 'admin_contacted':
        return <Badge className="bg-blue-600">Admin Contacted</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'declined':
        return <Badge className="bg-red-600">Declined</Badge>;
      default:
        return <Badge className="bg-slate-600">{status}</Badge>;
    }
  };

  const filteredInventory = inventory.filter(item =>
    `${item.make} ${item.model} ${item.year}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMarketplace = marketplace.filter(item =>
    `${item.make} ${item.model} ${item.year}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              <Store className="w-8 h-8 text-blue-400" />
              B2B Dealer Portal
            </h1>
            <p className="text-slate-400">Trade vehicles privately with other dealers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="relative border-slate-600"
              onClick={() => setActiveTab('notifications')}
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount.count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount.count}
                </span>
              )}
            </Button>
            <Link href="/appraisal">
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-appraisal">
                <Plus className="w-4 h-4 mr-2" />
                New Appraisal
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600" data-testid="tab-dashboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-blue-600" data-testid="tab-inventory">
              <Package className="w-4 h-4 mr-2" />
              My Inventory
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-blue-600" data-testid="tab-marketplace">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-blue-600" data-testid="tab-interests">
              <Handshake className="w-4 h-4 mr-2" />
              My Interests
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              Appraisal History
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 relative" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount.count > 0 && (
                <span className="ml-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount.count}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">My Vehicles</p>
                      <p className="text-3xl font-bold text-white" data-testid="stat-total-vehicles">{inventoryStats.total}</p>
                    </div>
                    <Car className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Listed on Marketplace</p>
                      <p className="text-3xl font-bold text-green-400" data-testid="stat-listed">{inventoryStats.listed}</p>
                    </div>
                    <Eye className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Marketplace Vehicles</p>
                      <p className="text-3xl font-bold text-purple-400" data-testid="stat-marketplace">{marketplace.length}</p>
                    </div>
                    <Store className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Active Interests</p>
                      <p className="text-3xl font-bold text-yellow-400" data-testid="stat-interests">{interests.filter(i => i.status === 'pending').length}</p>
                    </div>
                    <Handshake className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-900/40 to-slate-800 border-green-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <Tag className="w-6 h-6" />
                    Sell Your Vehicles
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    List vehicles for sale in the B2B marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm mb-4">
                    Add vehicles from appraisals to your inventory. Choose to list them on the marketplace where other dealers can express interest.
                  </p>
                  <Link href="/appraisal">
                    <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-appraise-vehicle">
                      <FileText className="w-4 h-4 mr-2" />
                      Appraise & List Vehicle
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/40 to-slate-800 border-blue-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <ShoppingCart className="w-6 h-6" />
                    Find Vehicles to Buy
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Browse the marketplace for partner dealer vehicles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm mb-4">
                    Prices are hidden for privacy. Express interest to have our admin facilitate the transaction.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('marketplace')} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-browse-marketplace"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            </div>

            {appraisals.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    Recent Appraisals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appraisals.slice(0, 5).map(appraisal => (
                      <div key={appraisal.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="font-medium">{appraisal.year} {appraisal.make} {appraisal.model}</p>
                          <p className="text-sm text-slate-400">
                            Sell: ${parseFloat(appraisal.sellingPrice).toLocaleString()} | Buy Budget: ${parseFloat(appraisal.buyBudget).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {appraisal.listedOnMarketplace && (
                            <Badge className="bg-green-600">Listed</Badge>
                          )}
                          <span className="text-sm text-slate-400">
                            {new Date(appraisal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search your inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                  data-testid="input-search-inventory"
                />
              </div>
              <Link href="/appraisal">
                <Button className="bg-green-600 hover:bg-green-700" data-testid="button-add-vehicle">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </Link>
            </div>

            {inventoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No vehicles in your inventory yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Start by appraising and adding vehicles.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInventory.map(item => (
                  <Card key={item.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                            <Car className="w-8 h-8 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{item.year} {item.make} {item.model}</p>
                            {item.trim && <p className="text-sm text-slate-400">{item.trim}</p>}
                            {item.kilometers && (
                              <p className="text-sm text-slate-400">{item.kilometers.toLocaleString()} km</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">
                              ${item.askingPrice ? parseFloat(item.askingPrice).toLocaleString() : 'N/A'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(item.status)}
                              {item.listOnMarketplace ? (
                                <Badge className="bg-blue-600 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Listed
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-600 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Private
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-300">Privacy Protected Marketplace</p>
                  <p className="text-sm text-blue-200/70">
                    Prices and dealer identities are hidden. Express interest in a vehicle and our admin team will facilitate the transaction.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
                data-testid="input-search-marketplace"
              />
            </div>

            {marketplaceLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : filteredMarketplace.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No vehicles available in the marketplace.</p>
                  <p className="text-sm text-slate-500 mt-1">Check back later for new listings.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarketplace.map(item => (
                  <Card key={item.id} className="bg-slate-800 border-slate-700 hover:border-blue-600/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="w-full h-32 bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                        <Car className="w-12 h-12 text-slate-500" />
                      </div>
                      <p className="font-bold text-lg">{item.year} {item.make} {item.model}</p>
                      {item.trim && <p className="text-sm text-slate-400">{item.trim}</p>}
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                        {item.kilometers && <span>{item.kilometers.toLocaleString()} km</span>}
                        {item.color && <span>• {item.color}</span>}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge className="bg-slate-700 text-slate-300">
                          {item.source}
                        </Badge>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleExpressInterest(item)}
                          data-testid={`button-interest-${item.id}`}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Express Interest
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            {interestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : interests.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Handshake className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No interest requests yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Browse the marketplace to express interest in vehicles.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {interests.map(interest => (
                  <Card key={interest.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Interest Request</p>
                          <p className="text-sm text-slate-400">
                            {interest.targetType === 'dealer_listing' ? 'Partner Dealer Vehicle' : 'Inventory Vehicle'}
                          </p>
                          {interest.offeredPrice && (
                            <p className="text-sm text-green-400 mt-1">
                              Offered: ${parseFloat(interest.offeredPrice).toLocaleString()}
                            </p>
                          )}
                          {interest.message && (
                            <p className="text-sm text-slate-400 mt-1">"{interest.message}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(interest.status)}
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(interest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {appraisals.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No appraisals yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Start by appraising a vehicle.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appraisals.map(appraisal => (
                  <Card key={appraisal.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{appraisal.year} {appraisal.make} {appraisal.model}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-400">
                              Sell Price: ${parseFloat(appraisal.sellingPrice).toLocaleString()}
                            </span>
                            <span className="text-blue-400">
                              Buy Budget: ${parseFloat(appraisal.buyBudget).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {appraisal.listedOnMarketplace ? (
                            <Badge className="bg-green-600">Listed on Marketplace</Badge>
                          ) : (
                            <Badge className="bg-slate-600">Private</Badge>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(appraisal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No notifications yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.isRead && markNotificationReadMutation.mutate(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-blue-600/20' : 'bg-slate-700'}`}>
                            <Bell className={`w-4 h-4 ${!notification.isRead ? 'text-blue-400' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-400">{notification.message}</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Express Interest</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Your Offer (Optional)</Label>
              <Input
                type="number"
                placeholder="Enter your offer amount"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="bg-slate-700 border-slate-600"
                data-testid="input-offered-price"
              />
              <p className="text-xs text-slate-400 mt-1">
                The seller won't see this directly - our admin will use it to negotiate.
              </p>
            </div>
            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Add any additional details or questions..."
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                className="bg-slate-700 border-slate-600"
                data-testid="input-interest-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitInterest} 
              disabled={expressInterestMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-submit-interest"
            >
              {expressInterestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
