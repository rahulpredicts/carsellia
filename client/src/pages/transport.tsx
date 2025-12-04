import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  MapPin,
  Car,
  Calculator,
  Clock,
  DollarSign,
  Printer,
  Send,
  ChevronRight,
  Package,
  Shield,
  Zap,
  Loader2,
  CheckCircle2,
  Info,
  Calendar,
  Gauge,
  ArrowRight,
  AlertTriangle,
  Snowflake,
  Anchor,
  Mountain,
  ShoppingCart,
  FileText,
  User,
  Phone,
  Mail,
  Upload,
  ClipboardList,
  Building2,
  Gavel,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { decodeVIN } from "@/lib/nhtsa";
import { apiRequest } from "@/lib/queryClient";
import { 
  CANADIAN_PROVINCES, 
  calculateTransportQuote,
  type TransportQuote as ComprehensiveQuote 
} from "@shared/canada-locations";

const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan/Compact", surcharge: 0 },
  { value: "suv", label: "Mid-Size SUV", surcharge: 0 },
  { value: "fullsize_suv", label: "Full-Size SUV", surcharge: 0 },
  { value: "pickup", label: "Pickup Truck", surcharge: 0 },
  { value: "fullsize_truck", label: "Full-Size Truck (F-250+)", surcharge: 0 },
  { value: "luxury", label: "Luxury Vehicle", surcharge: 0 },
  { value: "motorcycle", label: "Motorcycle", surcharge: 0 },
];

const SERVICE_LEVELS = [
  { value: "standard", label: "Standard (3-5 days)", multiplier: 1.0, minPremium: 0, daysMin: 3, daysMax: 5 },
  { value: "expedited", label: "Expedited (+35%)", multiplier: 1.35, minPremium: 75, daysMin: 1, daysMax: 2 },
];

const POPULAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia",
  "Land Rover", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mini",
  "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota",
  "Volkswagen", "Volvo"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 26 }, (_, i) => currentYear - i);

interface QuoteBreakdown {
  distance: number;
  basePrice: number;
  vehicleSurcharge: number;
  nonRunningFee: number;
  enclosedFee: number;
  liftGateFee: number;
  multiVehicleDiscount: number;
  serviceLevelMultiplier: number;
  fuelSurcharge: number;
  subtotal: number;
  total: number;
  estimatedDeliveryMin: Date;
  estimatedDeliveryMax: Date;
  priceBreakdown?: { label: string; amount: number }[];
  hasRemoteSurcharge?: boolean;
  hasFerryCrossing?: boolean;
  hasNorthernSurcharge?: boolean;
}

export default function TransportPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [pickupContactEmail, setPickupContactEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupProvince, setPickupProvince] = useState("");
  const [pickupPostalCode, setPickupPostalCode] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [pickupTimePreference, setPickupTimePreference] = useState("morning");
  
  const [deliveryContactName, setDeliveryContactName] = useState("");
  const [deliveryContactPhone, setDeliveryContactPhone] = useState("");
  const [deliveryContactEmail, setDeliveryContactEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryProvince, setDeliveryProvince] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  
  const [pickupLocationType, setPickupLocationType] = useState<"dealership" | "auction" | "custom">("dealership");
  const [pickupBusinessName, setPickupBusinessName] = useState("");
  const [samePickupLocation, setSamePickupLocation] = useState(true);
  const [usePreviousOrder, setUsePreviousOrder] = useState(false);
  const [selectedPreviousOrder, setSelectedPreviousOrder] = useState<string>("");
  
  const SAVED_LOCATIONS = [
    { id: "adesa-montreal", name: "ADESA Montreal", type: "auction", city: "Montreal", province: "QC", contact: "Auction Dispatch", phone: "(514) 555-0100" },
    { id: "adesa-toronto", name: "ADESA Toronto", type: "auction", city: "Toronto", province: "ON", contact: "Auction Dispatch", phone: "(416) 555-0100" },
    { id: "manheim-toronto", name: "Manheim Toronto", type: "auction", city: "Toronto", province: "ON", contact: "Vehicle Release", phone: "(416) 555-0200" },
    { id: "manheim-montreal", name: "Manheim Montreal", type: "auction", city: "Montreal", province: "QC", contact: "Vehicle Release", phone: "(514) 555-0200" },
  ];
  
  const SAMPLE_PREVIOUS_ORDERS = [
    { id: "prev-1", orderNumber: "TRN-2024-0089", route: "Montreal → Toronto", date: "Nov 28, 2024", pickupContact: "Jean Dupont", pickupPhone: "(514) 555-1234" },
    { id: "prev-2", orderNumber: "TRN-2024-0076", route: "Toronto → Ottawa", date: "Nov 15, 2024", pickupContact: "Mike Smith", pickupPhone: "(416) 555-5678" },
  ];

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      quoteId: string;
      pickupContactName: string;
      pickupContactPhone: string;
      pickupContactEmail: string;
      pickupAddress: string;
      pickupCity: string;
      pickupProvince: string;
      pickupPostalCode: string;
      pickupInstructions: string;
      pickupTimePreference: string;
      deliveryContactName: string;
      deliveryContactPhone: string;
      deliveryContactEmail: string;
      deliveryAddress: string;
      deliveryCity: string;
      deliveryProvince: string;
      deliveryPostalCode: string;
      deliveryInstructions: string;
      estimatedDeliveryDate: string;
    }) => {
      const response = await apiRequest("POST", "/api/transport/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${data.orderNumber} has been confirmed. You can track it in your orders.`,
      });
      setShowOrderModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/transport/orders"] });
      navigate("/transport-orders");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
      });
    },
  });

  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleType, setVehicleType] = useState("sedan");

  const [isRunning, setIsRunning] = useState(true);
  const [isEnclosed, setIsEnclosed] = useState(false);
  const [liftGateRequired, setLiftGateRequired] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(1);
  const [serviceLevel, setServiceLevel] = useState("standard");
  
  const [releaseOrderNumber, setReleaseOrderNumber] = useState("");
  const [isLoadingReleaseOrder, setIsLoadingReleaseOrder] = useState(false);
  const [releaseOrderFile, setReleaseOrderFile] = useState<File | null>(null);

  const pickupCities = useMemo(() => {
    const province = CANADIAN_PROVINCES.find(p => p.code === pickupProvince);
    return province?.cities.map(c => c.name).sort() || [];
  }, [pickupProvince]);
  
  const deliveryCities = useMemo(() => {
    const province = CANADIAN_PROVINCES.find(p => p.code === deliveryProvince);
    return province?.cities.map(c => c.name).sort() || [];
  }, [deliveryProvince]);

  const handleDecodeVin = async () => {
    if (!vehicleVin || vehicleVin.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid 17-character VIN",
        variant: "destructive",
      });
      return;
    }

    setIsDecodingVin(true);
    try {
      const result = await decodeVIN(vehicleVin);
      if (result) {
        if (result.year) setVehicleYear(result.year.toString());
        if (result.make) setVehicleMake(result.make);
        if (result.model) setVehicleModel(result.model);
        
        const bodyClass = result.bodyClass?.toLowerCase() || "";
        const vehicleTypeFromVin = result.vehicleType?.toLowerCase() || "";
        if (bodyClass.includes("motorcycle") || vehicleTypeFromVin.includes("motorcycle")) {
          setVehicleType("motorcycle");
        } else if (bodyClass.includes("suv") || bodyClass.includes("crossover") || bodyClass.includes("sport utility")) {
          setVehicleType("suv");
        } else if (bodyClass.includes("truck") || bodyClass.includes("pickup")) {
          setVehicleType("pickup");
        } else if (bodyClass.includes("sedan") || bodyClass.includes("coupe") || bodyClass.includes("hatchback")) {
          setVehicleType("sedan");
        }

        toast({
          title: "VIN Decoded",
          description: `${result.year} ${result.make} ${result.model}`,
        });
      }
    } catch (error) {
      toast({
        title: "Decode Failed",
        description: "Unable to decode VIN. Please enter vehicle details manually.",
        variant: "destructive",
      });
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleReleaseOrderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setReleaseOrderFile(file);
    setIsLoadingReleaseOrder(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      let foundVin = "";
      let foundYear = "";
      let foundMake = "";
      let foundModel = "";
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        const vinMatch = line.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
        if (vinMatch) {
          foundVin = vinMatch[1].toUpperCase();
        }
        
        if (lowerLine.includes('year:') || lowerLine.includes('year =')) {
          const yearMatch = line.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) foundYear = yearMatch[0];
        }
        
        if (lowerLine.includes('make:') || lowerLine.includes('make =')) {
          const parts = line.split(/[:=]/);
          if (parts.length > 1) foundMake = parts[1].trim();
        }
        
        if (lowerLine.includes('model:') || lowerLine.includes('model =')) {
          const parts = line.split(/[:=]/);
          if (parts.length > 1) foundModel = parts[1].trim();
        }
      }
      
      if (foundVin) {
        setVehicleVin(foundVin);
        const result = await decodeVIN(foundVin);
        if (result) {
          if (result.year) setVehicleYear(result.year.toString());
          if (result.make) setVehicleMake(result.make);
          if (result.model) setVehicleModel(result.model);
          
          toast({
            title: "Release Order Loaded",
            description: `Found ${result.year} ${result.make} ${result.model}`,
          });
        }
      } else if (foundYear || foundMake || foundModel) {
        if (foundYear) setVehicleYear(foundYear);
        if (foundMake) setVehicleMake(foundMake);
        if (foundModel) setVehicleModel(foundModel);
        
        toast({
          title: "Release Order Loaded",
          description: `Found vehicle details from file`,
        });
      } else {
        toast({
          title: "No Vehicle Data Found",
          description: "Could not find VIN or vehicle details in the file. Please enter manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Could not read the release order file.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReleaseOrder(false);
    }
  };

  const handleFetchReleaseOrder = async () => {
    if (!releaseOrderNumber.trim()) {
      toast({
        title: "Order Number Required",
        description: "Please enter a release order number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingReleaseOrder(true);
    
    try {
      const response = await fetch(`/api/transport/release-orders/${releaseOrderNumber.trim()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.vin) setVehicleVin(data.vin);
        if (data.year) setVehicleYear(data.year.toString());
        if (data.make) setVehicleMake(data.make);
        if (data.model) setVehicleModel(data.model);
        if (data.pickupProvince) setPickupProvince(data.pickupProvince);
        if (data.pickupCity) setPickupCity(data.pickupCity);
        if (data.deliveryProvince) setDeliveryProvince(data.deliveryProvince);
        if (data.deliveryCity) setDeliveryCity(data.deliveryCity);
        
        toast({
          title: "Release Order Found",
          description: `Loaded order ${releaseOrderNumber}`,
        });
      } else {
        toast({
          title: "Order Not Found",
          description: "Could not find release order. Please check the number or upload a file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lookup Failed",
        description: "Could not fetch release order. Please try uploading a file instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReleaseOrder(false);
    }
  };

  const comprehensiveQuote = useMemo<ComprehensiveQuote | null>(() => {
    if (!pickupCity || !pickupProvince || !deliveryCity || !deliveryProvince) {
      return null;
    }
    
    const isExpedited = serviceLevel !== "standard";
    
    const result = calculateTransportQuote(
      pickupProvince,
      pickupCity,
      deliveryProvince,
      deliveryCity,
      {
        enclosed: isEnclosed,
        inoperable: !isRunning,
        expedited: isExpedited,
        vehicleCount: vehicleCount
      }
    );
    
    return result;
  }, [pickupCity, pickupProvince, deliveryCity, deliveryProvince, isEnclosed, isRunning, serviceLevel, vehicleCount]);

  const quote = useMemo<QuoteBreakdown | null>(() => {
    if (!comprehensiveQuote) {
      return null;
    }

    const distance = comprehensiveQuote.roadDistanceKm;
    const basePrice = comprehensiveQuote.basePrice;

    const vehicleTypeData = VEHICLE_TYPES.find((v) => v.value === vehicleType);
    const vehicleSurcharge = (vehicleTypeData?.surcharge || 0) * vehicleCount;

    const nonRunningFee = comprehensiveQuote.inoperableCharge;
    const liftGateFee = 0;
    const enclosedFee = comprehensiveQuote.enclosedCharge;
    const fuelSurcharge = comprehensiveQuote.fuelSurcharge;

    const total = comprehensiveQuote.totalPrice;

    const today = new Date();
    const daysMin = comprehensiveQuote.estimatedDays;
    const daysMax = comprehensiveQuote.estimatedDays + 2;
    
    const estimatedDeliveryMin = new Date(today);
    estimatedDeliveryMin.setDate(today.getDate() + daysMin);
    
    const estimatedDeliveryMax = new Date(today);
    estimatedDeliveryMax.setDate(today.getDate() + daysMax);

    return {
      distance,
      basePrice,
      vehicleSurcharge,
      nonRunningFee,
      enclosedFee,
      liftGateFee,
      multiVehicleDiscount: 0,
      serviceLevelMultiplier: 1.0,
      fuelSurcharge,
      subtotal: total,
      total: Math.round(total),
      estimatedDeliveryMin,
      estimatedDeliveryMax,
      priceBreakdown: comprehensiveQuote.priceBreakdown,
      hasRemoteSurcharge: comprehensiveQuote.remoteCharge > 0,
      hasFerryCrossing: comprehensiveQuote.ferryCharge > 0,
      hasNorthernSurcharge: comprehensiveQuote.northernCharge > 0,
    };
  }, [
    comprehensiveQuote, vehicleType, vehicleCount
  ]);

  const handleRequestQuote = async () => {
    if (!quote) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in pickup and delivery locations",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteData = {
        pickupCity,
        pickupProvince,
        deliveryCity,
        deliveryProvince,
        distanceKm: quote.distance.toString(),
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vehicleType,
        vehicleVin: vehicleVin || null,
        isRunning,
        isEnclosed,
        liftGateRequired,
        vehicleCount,
        serviceLevel,
        basePrice: quote.basePrice.toFixed(2),
        surcharges: (quote.vehicleSurcharge + quote.nonRunningFee + quote.enclosedFee + quote.liftGateFee + quote.fuelSurcharge).toFixed(2),
        discount: quote.multiVehicleDiscount.toFixed(2),
        totalPrice: quote.total.toFixed(2),
      };

      const response = await fetch("/api/transport/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        throw new Error("Failed to save quote");
      }

      const savedQuote = await response.json();
      setSavedQuoteId(savedQuote.id);
      setShowOrderModal(true);

      toast({
        title: "Transport Order Created!",
        description: `Order #${savedQuote.quoteNumber} - Please confirm pickup details.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderTransport = () => {
    if (!savedQuoteId) {
      toast({
        title: "Quote Required",
        description: "Please save a quote first before placing an order.",
        variant: "destructive",
      });
      return;
    }
    setShowOrderModal(true);
  };

  const handleConfirmOrder = () => {
    if (!savedQuoteId || !quote) return;
    
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (!pickupContactName || !pickupContactPhone) {
      toast({
        title: "Pickup Contact Required",
        description: "Please provide pickup contact name and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryContactName || !deliveryContactPhone) {
      toast({
        title: "Delivery Contact Required",
        description: "Please provide delivery contact name and phone number.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      quoteId: savedQuoteId,
      pickupContactName,
      pickupContactPhone,
      pickupContactEmail,
      pickupAddress,
      pickupCity,
      pickupProvince,
      pickupPostalCode,
      pickupInstructions,
      pickupTimePreference,
      deliveryContactName,
      deliveryContactPhone,
      deliveryContactEmail,
      deliveryAddress,
      deliveryCity,
      deliveryProvince,
      deliveryPostalCode,
      deliveryInstructions,
      estimatedDeliveryDate: quote.estimatedDeliveryMax.toISOString().split('T')[0],
    });
  };

  const handlePrintQuote = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Transportation Estimate</h1>
            <p className="text-slate-400">Calculate vehicle transport costs across Canada</p>
          </div>
        </div>

        {/* Competitive Advantage Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-green-600/20 rounded-xl border border-blue-500/30">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
            <div className="flex items-center gap-2 text-blue-300">
              <Truck className="w-4 h-4" />
              <span>Own Fleet</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <DollarSign className="w-4 h-4" />
              <span>Direct Pricing</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300">
              <MapPin className="w-4 h-4" />
              <span>Real-Time Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <Zap className="w-4 h-4" />
              <span>1-Day & 2-Day Rush</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <Shield className="w-4 h-4" />
              <span>Fully Insured</span>
            </div>
          </div>
        </div>

        {/* Popular Routes Quick Reference */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700 py-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-amber-400" />
              Popular Quebec-Ontario Routes (Click for Instant Quote)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { from: "Montreal", fromProv: "QC", to: "Toronto", toProv: "ON", price: 426 },
                { from: "Montreal", fromProv: "QC", to: "Ottawa", toProv: "ON", price: 176 },
                { from: "Quebec City", fromProv: "QC", to: "Toronto", toProv: "ON", price: 583 },
                { from: "Toronto", fromProv: "ON", to: "Montreal", toProv: "QC", price: 426 },
                { from: "Ottawa", fromProv: "ON", to: "Toronto", toProv: "ON", price: 369 },
                { from: "Montreal", fromProv: "QC", to: "Hamilton", toProv: "ON", price: 468 },
                { from: "Montreal", fromProv: "QC", to: "London", toProv: "ON", price: 545 },
                { from: "Toronto", fromProv: "ON", to: "Calgary", toProv: "AB", price: 1947 },
              ].map((route, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="flex flex-col h-auto py-2 px-3 border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-left"
                  onClick={() => {
                    setPickupProvince(route.fromProv);
                    setPickupCity(route.from);
                    setDeliveryProvince(route.toProv);
                    setDeliveryCity(route.to);
                  }}
                  data-testid={`button-popular-route-${idx}`}
                >
                  <span className="text-xs text-slate-400 truncate w-full">{route.from} → {route.to}</span>
                  <span className="text-sm font-semibold text-green-400">${route.price}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Pickup Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-400">Province</Label>
                        <Select
                          value={pickupProvince}
                          onValueChange={(value) => {
                            setPickupProvince(value);
                            setPickupCity("");
                          }}
                          data-testid="select-pickup-province"
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-pickup-province">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {CANADIAN_PROVINCES.map((prov) => (
                              <SelectItem key={prov.code} value={prov.code}>
                                {prov.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-400">City</Label>
                        <Select
                          value={pickupCity}
                          onValueChange={setPickupCity}
                          disabled={!pickupProvince}
                          data-testid="select-pickup-city"
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-pickup-city">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Delivery Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-400">Province</Label>
                        <Select
                          value={deliveryProvince}
                          onValueChange={(value) => {
                            setDeliveryProvince(value);
                            setDeliveryCity("");
                          }}
                          data-testid="select-delivery-province"
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-delivery-province">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {CANADIAN_PROVINCES.map((prov) => (
                              <SelectItem key={prov.code} value={prov.code}>
                                {prov.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-400">City</Label>
                        <Select
                          value={deliveryCity}
                          onValueChange={setDeliveryCity}
                          disabled={!deliveryProvince}
                          data-testid="select-delivery-city"
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-delivery-city">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {quote && (
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                          {quote.distance.toLocaleString()} km
                        </Badge>
                        <span className="text-slate-400 text-sm">
                          {pickupCity}, {pickupProvince}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400 text-sm">
                          {deliveryCity}, {deliveryProvince}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Tiered pricing applied
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                  Quick Import (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-slate-400">Release Order Number</Label>
                    <div className="flex gap-2">
                      <Input
                        value={releaseOrderNumber}
                        onChange={(e) => setReleaseOrderNumber(e.target.value)}
                        placeholder="Enter release order #"
                        className="bg-slate-800 border-slate-600 text-white"
                        data-testid="input-release-order"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleFetchReleaseOrder}
                        disabled={isLoadingReleaseOrder || !releaseOrderNumber.trim()}
                        className="shrink-0"
                        data-testid="button-fetch-release-order"
                      >
                        {isLoadingReleaseOrder ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Fetch"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Enter a release order number to auto-fill vehicle details</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-slate-400">Or Upload Release Order File</Label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleReleaseOrderFileUpload}
                        className="hidden"
                        id="release-order-file"
                        data-testid="input-release-order-file"
                      />
                      <label
                        htmlFor="release-order-file"
                        className={cn(
                          "flex items-center justify-center gap-2 w-full p-3 rounded-md border border-dashed cursor-pointer transition-colors",
                          releaseOrderFile
                            ? "border-green-500 bg-green-500/10 text-green-400"
                            : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-blue-500 hover:bg-blue-500/10"
                        )}
                      >
                        {isLoadingReleaseOrder ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : releaseOrderFile ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {releaseOrderFile.name}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Click to upload file
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">Upload .txt or .csv file containing VIN or vehicle info</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-slate-400">Year</Label>
                    <Select value={vehicleYear} onValueChange={setVehicleYear} data-testid="select-vehicle-year">
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-vehicle-year">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-400">Make</Label>
                    <Select value={vehicleMake} onValueChange={setVehicleMake} data-testid="select-vehicle-make">
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-vehicle-make">
                        <SelectValue placeholder="Make" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_MAKES.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-400">Model</Label>
                    <Input
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Enter model"
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-vehicle-model"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">VIN (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={vehicleVin}
                        onChange={(e) => setVehicleVin(e.target.value.toUpperCase())}
                        placeholder="17-character VIN"
                        maxLength={17}
                        className="bg-slate-800 border-slate-600 text-white font-mono"
                        data-testid="input-vehicle-vin"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleDecodeVin}
                        disabled={isDecodingVin || vehicleVin.length !== 17}
                        className="shrink-0"
                        data-testid="button-decode-vin"
                      >
                        {isDecodingVin ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Decode"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Vehicle Type</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType} data-testid="select-vehicle-type">
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-vehicle-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                            {type.surcharge !== 0 && (
                              <span className={cn(
                                "ml-2",
                                type.surcharge > 0 ? "text-amber-500" : "text-green-500"
                              )}>
                                ({type.surcharge > 0 ? "+" : ""}{formatCurrency(type.surcharge)})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Transport Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-lg border border-emerald-700/50">
                    <div className="flex items-center gap-3">
                      <Gauge className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-sm font-medium text-emerald-300">Driveable Only</div>
                        <div className="text-xs text-emerald-400/70">
                          Vehicle must run & drive
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Enclosed Transport</div>
                        <div className="text-xs text-slate-400">
                          {isEnclosed ? "Enclosed (included)" : "Open carrier"}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={isEnclosed}
                      onCheckedChange={setIsEnclosed}
                      data-testid="switch-enclosed"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Lift Gate Required</div>
                        <div className="text-xs text-slate-400">
                          {liftGateRequired ? "Lift gate (included)" : "Not required"}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={liftGateRequired}
                      onCheckedChange={setLiftGateRequired}
                      data-testid="switch-liftgate"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-400 mb-2 block">Number of Vehicles</Label>
                    <Select
                      value={vehicleCount.toString()}
                      onValueChange={(v) => setVehicleCount(parseInt(v))}
                      data-testid="select-vehicle-count"
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-vehicle-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} vehicle{num > 1 ? "s" : ""}
                            {num >= 5 && " (15% max discount)"}
                            {num === 4 && " (12% discount)"}
                            {num === 3 && " (8% discount)"}
                            {num === 2 && " (5% discount)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-400 mb-2 block">Service Level</Label>
                    <Select value={serviceLevel} onValueChange={setServiceLevel} data-testid="select-service-level">
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="trigger-service-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                            {level.multiplier > 1 && (
                              <span className="ml-2 text-amber-500">
                                ({level.multiplier}x)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)] pr-2">
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  Quote Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {quote ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Route Distance</span>
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                          {quote.distance.toLocaleString()} km
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        {pickupCity}, {pickupProvince} → {deliveryCity}, {deliveryProvince}
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="space-y-3" data-testid="quote-breakdown">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Base Price</span>
                        <span className="text-white" data-testid="text-base-price">
                          {formatCurrency(quote.basePrice)}
                        </span>
                      </div>

                      {quote.vehicleSurcharge !== 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Vehicle Type Surcharge</span>
                          <span className={cn(
                            quote.vehicleSurcharge > 0 ? "text-amber-400" : "text-green-400"
                          )} data-testid="text-vehicle-surcharge">
                            {quote.vehicleSurcharge > 0 ? "+" : ""}
                            {formatCurrency(quote.vehicleSurcharge)}
                          </span>
                        </div>
                      )}

                      {quote.nonRunningFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Non-Running Fee</span>
                          <span className="text-amber-400" data-testid="text-nonrunning-fee">
                            +{formatCurrency(quote.nonRunningFee)}
                          </span>
                        </div>
                      )}

                      {quote.enclosedFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Enclosed Transport</span>
                          <span className="text-amber-400" data-testid="text-enclosed-fee">
                            +{formatCurrency(quote.enclosedFee)}
                          </span>
                        </div>
                      )}

                      {quote.liftGateFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Lift Gate</span>
                          <span className="text-amber-400" data-testid="text-liftgate-fee">
                            +{formatCurrency(quote.liftGateFee)}
                          </span>
                        </div>
                      )}

                      {quote.multiVehicleDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Multi-Vehicle Discount</span>
                          <span className="text-green-400" data-testid="text-multivehicle-discount">
                            -{formatCurrency(quote.multiVehicleDiscount)}
                          </span>
                        </div>
                      )}

                      {quote.serviceLevelMultiplier > 1 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Expedited Service</span>
                          <span className="text-amber-400" data-testid="text-service-multiplier">
                            {quote.serviceLevelMultiplier}x
                          </span>
                        </div>
                      )}

                      <Separator className="bg-slate-700" />

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-white" data-testid="text-subtotal">
                          {formatCurrency(quote.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Fuel Surcharge (5%)</span>
                        <span className="text-amber-400" data-testid="text-fuel-surcharge">
                          +{formatCurrency(quote.fuelSurcharge)}
                        </span>
                      </div>

                      <Separator className="bg-slate-700" />

                      {vehicleCount > 1 ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Price Per Vehicle (After Discount)</span>
                            <span className="text-white" data-testid="text-price-per-vehicle">
                              {formatCurrency(quote.total)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Number of Vehicles</span>
                            <span className="text-white" data-testid="text-vehicle-count">× {vehicleCount}</span>
                          </div>
                          <Separator className="bg-slate-700" />
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-white">Total (All Vehicles)</span>
                            <span className="text-2xl font-bold text-blue-400" data-testid="text-total-price">
                              {formatCurrency(quote.total * vehicleCount)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-white">Total</span>
                          <span className="text-2xl font-bold text-blue-400" data-testid="text-total-price">
                            {formatCurrency(quote.total)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">Estimated Delivery</span>
                      </div>
                      <div className="text-sm text-slate-400" data-testid="text-delivery-date">
                        {formatDate(quote.estimatedDeliveryMin)}
                        {quote.estimatedDeliveryMin.getTime() !== quote.estimatedDeliveryMax.getTime() && (
                          <> - {formatDate(quote.estimatedDeliveryMax)}</>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleRequestQuote}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-order-transport"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Order Transport
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePrintQuote}
                        className="w-full"
                        data-testid="button-print-quote"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Quote
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm" data-testid="text-no-quote">
                      Select pickup and delivery locations to calculate quote
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400">
                    <p className="mb-2">
                      <strong className="text-slate-300">Pricing Notes:</strong>
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Minimum charge: $105</li>
                      <li>All vehicle types included at base rate</li>
                      <li>Driveable vehicles only (must run & drive)</li>
                      <li>Enclosed & lift gate included at no extra cost</li>
                      <li>Multi-vehicle discounts: up to 15%</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </ScrollArea>
        </div>
      </div>

      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              Confirm Transport Order
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review your order details and provide contact information for pickup and delivery.
            </DialogDescription>
          </DialogHeader>

          {quote && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Order Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Route:</span>
                    <p className="text-white">{pickupCity}, {pickupProvince} → {deliveryCity}, {deliveryProvince}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Distance:</span>
                    <p className="text-white">{quote.distance.toLocaleString()} km</p>
                  </div>
                  {vehicleYear && vehicleMake && (
                    <div>
                      <span className="text-slate-400">Vehicle:</span>
                      <p className="text-white">{vehicleYear} {vehicleMake} {vehicleModel}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Estimated Delivery:</span>
                    <p className="text-white">{formatDate(quote.estimatedDeliveryMin)} - {formatDate(quote.estimatedDeliveryMax)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  {vehicleCount > 1 && (
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                      <span>Price per vehicle:</span>
                      <span>{formatCurrency(quote.total)}</span>
                    </div>
                  )}
                  {vehicleCount > 1 && (
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                      <span>Number of vehicles:</span>
                      <span>× {vehicleCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-400">{formatCurrency(quote.total * vehicleCount)}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {vehicleCount > 1 && (
                <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <Label className="text-amber-300 font-medium mb-3 block flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Are all {vehicleCount} vehicles at the same pickup location?
                  </Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={samePickupLocation ? "default" : "outline"}
                      className={samePickupLocation ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600"}
                      onClick={() => setSamePickupLocation(true)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Yes, same location
                    </Button>
                    <Button
                      type="button"
                      variant={!samePickupLocation ? "default" : "outline"}
                      className={!samePickupLocation ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600"}
                      onClick={() => setSamePickupLocation(false)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      No, different locations
                    </Button>
                  </div>
                  {!samePickupLocation && (
                    <p className="text-xs text-amber-400/70 mt-2">
                      We'll contact you to coordinate pickup from multiple locations.
                    </p>
                  )}
                </div>
              )}

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Pickup Location Type
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={usePreviousOrder ? "default" : "outline"}
                      className={usePreviousOrder ? "bg-violet-600 hover:bg-violet-700 h-7 text-xs" : "border-slate-600 h-7 text-xs"}
                      onClick={() => setUsePreviousOrder(!usePreviousOrder)}
                    >
                      <History className="w-3 h-3 mr-1" />
                      Use Previous Order
                    </Button>
                  </div>
                </div>

                {usePreviousOrder ? (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Select Previous Order</Label>
                    <Select value={selectedPreviousOrder} onValueChange={(val) => {
                      setSelectedPreviousOrder(val);
                      const order = SAMPLE_PREVIOUS_ORDERS.find(o => o.id === val);
                      if (order) {
                        setPickupContactName(order.pickupContact);
                        setPickupContactPhone(order.pickupPhone);
                      }
                    }}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Select a previous order..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_PREVIOUS_ORDERS.map(order => (
                          <SelectItem key={order.id} value={order.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{order.orderNumber}</span>
                              <span>-</span>
                              <span>{order.route}</span>
                              <span className="text-slate-500 text-xs">({order.date})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={pickupLocationType === "dealership" ? "default" : "outline"}
                        className={pickupLocationType === "dealership" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600"}
                        onClick={() => setPickupLocationType("dealership")}
                      >
                        <Building2 className="w-3 h-3 mr-1" />
                        Dealership
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={pickupLocationType === "auction" ? "default" : "outline"}
                        className={pickupLocationType === "auction" ? "bg-amber-600 hover:bg-amber-700" : "border-slate-600"}
                        onClick={() => setPickupLocationType("auction")}
                      >
                        <Gavel className="w-3 h-3 mr-1" />
                        Auction House
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={pickupLocationType === "custom" ? "default" : "outline"}
                        className={pickupLocationType === "custom" ? "bg-slate-600 hover:bg-slate-700" : "border-slate-600"}
                        onClick={() => setPickupLocationType("custom")}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Custom Location
                      </Button>
                    </div>

                    {pickupLocationType === "auction" && (
                      <div>
                        <Label className="text-slate-400 mb-2 block">Select Auction House</Label>
                        <Select value={pickupBusinessName} onValueChange={(val) => {
                          setPickupBusinessName(val);
                          const location = SAVED_LOCATIONS.find(l => l.id === val);
                          if (location) {
                            setPickupContactName(location.contact);
                            setPickupContactPhone(location.phone);
                            setPickupProvince(location.province);
                            setPickupCity(location.city);
                          }
                        }}>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select an auction house..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SAVED_LOCATIONS.filter(l => l.type === "auction").map(loc => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name} ({loc.city}, {loc.province})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pickupBusinessName && SAVED_LOCATIONS.find(l => l.id === pickupBusinessName) && (
                          <div className="mt-2 p-2 bg-slate-700/50 rounded text-xs text-slate-300">
                            Pickup: {SAVED_LOCATIONS.find(l => l.id === pickupBusinessName)?.name} - {SAVED_LOCATIONS.find(l => l.id === pickupBusinessName)?.city}, {SAVED_LOCATIONS.find(l => l.id === pickupBusinessName)?.province}
                          </div>
                        )}
                      </div>
                    )}

                    {pickupLocationType === "dealership" && (
                      <div>
                        <Label className="text-slate-400 mb-2 block">Dealership Name</Label>
                        <Input
                          value={pickupBusinessName}
                          onChange={(e) => setPickupBusinessName(e.target.value)}
                          placeholder="Enter dealership name"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Pickup Contact
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-400">Contact Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={pickupContactName}
                          onChange={(e) => setPickupContactName(e.target.value)}
                          placeholder="Full name"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-pickup-contact-name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={pickupContactPhone}
                          onChange={(e) => setPickupContactPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-pickup-contact-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={pickupContactEmail}
                          onChange={(e) => setPickupContactEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-pickup-contact-email"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Street Address *</Label>
                      <Input
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="123 Main Street"
                        className="bg-slate-800 border-slate-600 text-white"
                        data-testid="input-pickup-address"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-slate-400">City *</Label>
                        <Input
                          value={pickupCity}
                          onChange={(e) => setPickupCity(e.target.value)}
                          placeholder="Toronto"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-pickup-city"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Province *</Label>
                        <Input
                          value={pickupProvince}
                          onChange={(e) => setPickupProvince(e.target.value)}
                          placeholder="ON"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-pickup-province"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Postal Code</Label>
                        <Input
                          value={pickupPostalCode}
                          onChange={(e) => setPickupPostalCode(e.target.value)}
                          placeholder="M5V 1A1"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-pickup-postal"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Preferred Time</Label>
                      <Select value={pickupTimePreference} onValueChange={setPickupTimePreference}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                          <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-400">Special Instructions</Label>
                      <Textarea
                        value={pickupInstructions}
                        onChange={(e) => setPickupInstructions(e.target.value)}
                        placeholder="Gate code, parking instructions, etc."
                        className="bg-slate-800 border-slate-600 text-white resize-none"
                        rows={2}
                        data-testid="input-pickup-instructions"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    Delivery Contact
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-400">Contact Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={deliveryContactName}
                          onChange={(e) => setDeliveryContactName(e.target.value)}
                          placeholder="Full name"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-delivery-contact-name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={deliveryContactPhone}
                          onChange={(e) => setDeliveryContactPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-delivery-contact-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={deliveryContactEmail}
                          onChange={(e) => setDeliveryContactEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="bg-slate-800 border-slate-600 text-white pl-10"
                          data-testid="input-delivery-contact-email"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Street Address *</Label>
                      <Input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="456 Delivery Street"
                        className="bg-slate-800 border-slate-600 text-white"
                        data-testid="input-delivery-address"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-slate-400">City *</Label>
                        <Input
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="Montreal"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-delivery-city"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Province *</Label>
                        <Input
                          value={deliveryProvince}
                          onChange={(e) => setDeliveryProvince(e.target.value)}
                          placeholder="QC"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-delivery-province"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Postal Code</Label>
                        <Input
                          value={deliveryPostalCode}
                          onChange={(e) => setDeliveryPostalCode(e.target.value)}
                          placeholder="H2Y 1C6"
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-delivery-postal"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400">Special Instructions</Label>
                      <Textarea
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Gate code, parking instructions, etc."
                        className="bg-slate-800 border-slate-600 text-white resize-none"
                        rows={2}
                        data-testid="input-delivery-instructions"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="flex items-start gap-3 p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-1"
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                  I accept the terms and conditions. I understand that by placing this order, I am agreeing to the quoted price and estimated delivery timeframe. Cancellations may be subject to fees.
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowOrderModal(false)}
              className="border-slate-600"
              data-testid="button-cancel-order"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmOrder}
              disabled={createOrderMutation.isPending || !termsAccepted}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-order"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
