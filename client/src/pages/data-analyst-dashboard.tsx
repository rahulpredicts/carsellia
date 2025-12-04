import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, BarChart3, Database, CheckCircle2, AlertCircle, Loader2, 
  Search, Eye, X, Check, Send, AlertTriangle, Clock, Users, 
  FileText, Link, Car, DollarSign, Gauge, MapPin, RefreshCw,
  ChevronDown, ChevronRight, Filter, ArrowUpDown, FileSpreadsheet,
  Globe, Sparkles, ScanLine, Trash2, Plus, Copy, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { decodeVIN } from "@/lib/nhtsa";

interface DataSubmission {
  id: string;
  scraperId: string;
  sourceUrl: string | null;
  carMake: string;
  carModel: string;
  year: number;
  trim: string | null;
  kilometers: number;
  price: number;
  location: string | null;
  province: string | null;
  color: string | null;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  drivetrain: string | null;
  vin: string | null;
  images: string[] | null;
  notes: string | null;
  status: string;
  flaggedFields: string[] | null;
  flagReason: string | null;
  autoFlags: Record<string, string> | null;
  supervisorId: string | null;
  supervisorApprovedAt: string | null;
  managerId: string | null;
  managerApprovedAt: string | null;
  uploadedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewLog {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerRole: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  comments: string | null;
  flaggedFields: string[] | null;
  createdAt: string;
}

interface SubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "QC", name: "Quebec" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "MB", name: "Manitoba" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland" },
  { code: "PE", name: "PEI" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_supervisor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending_manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  uploaded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending_supervisor: "Pending Review",
  pending_manager: "Pending Final Approval",
  approved: "Approved",
  rejected: "Rejected",
  uploaded: "Uploaded",
};

const POPULAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ford", "GMC", 
  "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln", 
  "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", 
  "Toyota", "Volkswagen", "Volvo"
];

const COLORS = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Beige", "Gold", "Orange", "Yellow", "Purple", "Other"];
const BODY_TYPES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Wagon", "Convertible", "Crossover"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "Other"];
const FUEL_TYPES = ["Gasoline", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "Other"];
const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Salvage"];

export default function DataAnalystDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("submissions");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DataSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<string>("");
  const [reviewComments, setReviewComments] = useState("");
  const [flaggedFields, setFlaggedFields] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Enhanced submission form state
  const [submitTab, setSubmitTab] = useState("manual");
  const [vinSearch, setVinSearch] = useState("");
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [urlExtract, setUrlExtract] = useState("");
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Bulk upload state
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [aiParseText, setAiParseText] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{success: number; failed: number; items: any[]}>({ success: 0, failed: 0, items: [] });
  
  const [formData, setFormData] = useState({
    sourceUrl: "",
    carfaxUrl: "",
    carMake: "",
    carModel: "",
    year: new Date().getFullYear(),
    trim: "",
    kilometers: 0,
    price: 0,
    location: "",
    province: "ON",
    color: "",
    transmission: "",
    fuelType: "",
    bodyType: "",
    drivetrain: "",
    vin: "",
    stockNumber: "",
    condition: "",
    engineSize: "",
    engineCylinders: "",
    notes: "",
  });

  const userRole = user?.role || "";
  const isDataRole = ["scraper", "supervisor", "manager", "admin"].includes(userRole);

  const { data: stats } = useQuery<SubmissionStats>({
    queryKey: ["/api/data-analyst/stats"],
    enabled: isDataRole,
  });

  const { data: mySubmissions = [] } = useQuery<DataSubmission[]>({
    queryKey: ["/api/data-analyst/my-submissions"],
    enabled: userRole === "scraper",
  });

  const { data: pendingSupervisor = [] } = useQuery<DataSubmission[]>({
    queryKey: ["/api/data-analyst/supervisor/pending"],
    enabled: ["supervisor", "manager", "admin"].includes(userRole),
  });

  const { data: pendingManager = [] } = useQuery<DataSubmission[]>({
    queryKey: ["/api/data-analyst/manager/pending"],
    enabled: ["manager", "admin"].includes(userRole),
  });

  const { data: allSubmissions = [] } = useQuery<DataSubmission[]>({
    queryKey: ["/api/data-analyst/submissions"],
    enabled: ["supervisor", "manager", "admin"].includes(userRole),
  });

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/data-analyst/submissions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Submission created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] });
      setShowSubmitDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const supervisorReviewMutation = useMutation({
    mutationFn: async ({ id, action, comments, flaggedFields }: any) => {
      const res = await apiRequest("POST", `/api/data-analyst/supervisor/review/${id}`, { action, comments, flaggedFields });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] });
      setShowReviewDialog(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const managerReviewMutation = useMutation({
    mutationFn: async ({ id, action, comments }: any) => {
      const res = await apiRequest("POST", `/api/data-analyst/manager/review/${id}`, { action, comments });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] });
      setShowReviewDialog(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ submissionIds, action, comments }: any) => {
      const res = await apiRequest("POST", "/api/data-analyst/manager/bulk-action", { submissionIds, action, comments });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bulk Action Complete", description: `${data.success} successful, ${data.failed} failed` });
      queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] });
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      sourceUrl: "",
      carfaxUrl: "",
      carMake: "",
      carModel: "",
      year: new Date().getFullYear(),
      trim: "",
      kilometers: 0,
      price: 0,
      location: "",
      province: "ON",
      color: "",
      transmission: "",
      fuelType: "",
      bodyType: "",
      drivetrain: "",
      vin: "",
      stockNumber: "",
      condition: "",
      engineSize: "",
      engineCylinders: "",
      notes: "",
    });
    setVinSearch("");
    setUrlExtract("");
    setShowAdvanced(false);
  };

  const handleVinDecode = useCallback(async () => {
    if (!vinSearch || vinSearch.length < 11) {
      toast({ title: "Invalid VIN", description: "Please enter a valid VIN (at least 11 characters)", variant: "destructive" });
      return;
    }
    
    setIsDecodingVin(true);
    try {
      const result = await decodeVIN(vinSearch);
      
      if (result.error) {
        toast({ title: "VIN Decode Error", description: result.error, variant: "destructive" });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        vin: result.vin,
        carMake: result.make || prev.carMake,
        carModel: result.model || prev.carModel,
        year: parseInt(result.year || "") || prev.year,
        trim: result.trim || prev.trim,
        bodyType: result.bodyClass || prev.bodyType,
        transmission: result.transmission || prev.transmission,
        fuelType: result.fuelType || prev.fuelType,
        drivetrain: result.driveType || prev.drivetrain,
        engineCylinders: result.engineCylinders || prev.engineCylinders,
        engineSize: result.engineDisplacement || prev.engineSize,
      }));
      
      toast({ title: "VIN Decoded", description: `Found: ${result.year} ${result.make} ${result.model}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to decode VIN", variant: "destructive" });
    } finally {
      setIsDecodingVin(false);
    }
  }, [vinSearch, toast]);

  const handleUrlExtract = useCallback(async () => {
    if (!urlExtract) {
      toast({ title: "Invalid URL", description: "Please enter a valid listing URL", variant: "destructive" });
      return;
    }
    
    setIsExtractingUrl(true);
    try {
      const response = await fetch('/api/scrape/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlExtract }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract from URL');
      }
      
      const data = await response.json();
      
      if (data.vehicle) {
        setFormData(prev => ({
          ...prev,
          sourceUrl: urlExtract,
          carMake: data.vehicle.make || prev.carMake,
          carModel: data.vehicle.model || prev.carModel,
          year: data.vehicle.year || prev.year,
          trim: data.vehicle.trim || prev.trim,
          price: data.vehicle.price || prev.price,
          kilometers: data.vehicle.kilometers || prev.kilometers,
          vin: data.vehicle.vin || prev.vin,
          color: data.vehicle.color || prev.color,
          transmission: data.vehicle.transmission || prev.transmission,
          fuelType: data.vehicle.fuelType || prev.fuelType,
          bodyType: data.vehicle.bodyType || prev.bodyType,
        }));
        toast({ title: "Extracted", description: `Found vehicle data from URL` });
      } else {
        toast({ title: "No Data", description: "Could not extract vehicle data from URL", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to extract from URL. Try entering manually.", variant: "destructive" });
    } finally {
      setIsExtractingUrl(false);
    }
  }, [urlExtract, toast]);

  const handleBulkCsvSubmit = useCallback(async () => {
    if (!bulkCsvText.trim()) {
      toast({ title: "No Data", description: "Please paste CSV data", variant: "destructive" });
      return;
    }
    
    const lines = bulkCsvText.trim().split('\n');
    if (lines.length < 2) {
      toast({ title: "Invalid CSV", description: "CSV must have at least a header row and one data row", variant: "destructive" });
      return;
    }
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const vehicles = [];
    const validationErrors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const vehicle: any = { rowNum: i + 1 };
      
      headers.forEach((header, index) => {
        const value = values[index] || "";
        if (header.includes('make')) vehicle.carMake = value;
        else if (header.includes('model')) vehicle.carModel = value;
        else if (header.includes('year')) vehicle.year = parseInt(value) || 0;
        else if (header.includes('trim')) vehicle.trim = value;
        else if (header.includes('price')) vehicle.price = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        else if (header.includes('km') || header.includes('kilometer') || header.includes('mileage')) vehicle.kilometers = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        else if (header.includes('vin')) vehicle.vin = value;
        else if (header.includes('color') || header.includes('colour')) vehicle.color = value;
        else if (header.includes('transmission')) vehicle.transmission = value;
        else if (header.includes('fuel')) vehicle.fuelType = value;
        else if (header.includes('body')) vehicle.bodyType = value;
        else if (header.includes('province')) vehicle.province = value;
        else if (header.includes('location') || header.includes('city')) vehicle.location = value;
      });
      
      // Validate required fields
      const errors: string[] = [];
      if (!vehicle.carMake) errors.push('make');
      if (!vehicle.carModel) errors.push('model');
      if (!vehicle.year || vehicle.year < 1990) errors.push('year');
      if (!vehicle.price || vehicle.price <= 0) errors.push('price');
      if (!vehicle.kilometers && vehicle.kilometers !== 0) errors.push('kilometers');
      
      if (errors.length > 0) {
        validationErrors.push(`Row ${i + 1}: Missing ${errors.join(', ')}`);
        vehicle.validationError = errors.join(', ');
      }
      
      vehicles.push(vehicle);
    }
    
    if (vehicles.length === 0) {
      toast({ title: "No Valid Data", description: "No vehicles found in CSV", variant: "destructive" });
      return;
    }
    
    // Show validation warnings but continue with valid rows
    const validVehicles = vehicles.filter(v => !v.validationError);
    if (validVehicles.length === 0) {
      toast({ title: "All Rows Invalid", description: `${validationErrors.length} rows have validation errors. Check required fields.`, variant: "destructive" });
      setBulkResults({ success: 0, failed: vehicles.length, items: vehicles.map(v => ({ ...v, status: 'failed', error: v.validationError || 'Invalid data' })) });
      return;
    }
    
    setBulkProgress(0);
    let success = 0, failed = 0;
    const results: any[] = [];
    
    // Add skipped rows first
    vehicles.filter(v => v.validationError).forEach(v => {
      failed++;
      results.push({ ...v, status: 'failed', error: v.validationError });
    });
    
    // Submit valid rows
    for (let i = 0; i < validVehicles.length; i++) {
      const v = validVehicles[i];
      try {
        // Only send valid fields to backend
        await apiRequest("POST", "/api/data-analyst/submissions", {
          sourceUrl: null,
          carMake: v.carMake,
          carModel: v.carModel,
          year: v.year,
          trim: v.trim || null,
          kilometers: v.kilometers,
          price: v.price,
          location: v.location || null,
          province: v.province || null,
          color: v.color || null,
          transmission: v.transmission || null,
          fuelType: v.fuelType || null,
          bodyType: v.bodyType || null,
          drivetrain: null,
          vin: v.vin || null,
          notes: null,
        });
        success++;
        results.push({ ...v, status: 'success' });
      } catch (error: any) {
        failed++;
        results.push({ ...v, status: 'failed', error: error.message || 'Server error' });
      }
      setBulkProgress(Math.round(((i + 1) / validVehicles.length) * 100));
    }
    
    setBulkResults({ success, failed, items: results });
    queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] });
    toast({ 
      title: "Bulk Upload Complete", 
      description: `${success} successful, ${failed} failed${validationErrors.length > 0 ? ` (${validationErrors.length} validation errors)` : ''}` 
    });
  }, [bulkCsvText, queryClient, toast]);

  const handleAiParse = useCallback(async () => {
    if (!aiParseText.trim()) {
      toast({ title: "No Text", description: "Please paste vehicle text to parse", variant: "destructive" });
      return;
    }
    
    setIsAiParsing(true);
    try {
      const response = await fetch('/api/ai/parse-vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiParseText }),
      });
      
      if (!response.ok) throw new Error('AI parsing failed');
      
      const data = await response.json();
      
      if (data.vehicles && data.vehicles.length > 0) {
        const vehicle = data.vehicles[0];
        setFormData(prev => ({
          ...prev,
          carMake: vehicle.make || prev.carMake,
          carModel: vehicle.model || prev.carModel,
          year: vehicle.year || prev.year,
          trim: vehicle.trim || prev.trim,
          price: vehicle.price || prev.price,
          kilometers: vehicle.kilometers || prev.kilometers,
          vin: vehicle.vin || prev.vin,
          color: vehicle.color || prev.color,
        }));
        setSubmitTab("manual");
        toast({ title: "Parsed", description: `Found ${data.vehicles.length} vehicle(s). First one loaded into form.` });
      } else {
        toast({ title: "No Vehicles Found", description: "Could not parse vehicle data from text", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "AI parsing failed. Try entering manually.", variant: "destructive" });
    } finally {
      setIsAiParsing(false);
    }
  }, [aiParseText, toast]);

  const handleSubmit = () => {
    if (!formData.carMake || !formData.carModel || !formData.year || !formData.kilometers || !formData.price) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    // Only send fields the backend expects
    const submissionData = {
      sourceUrl: formData.sourceUrl || null,
      carMake: formData.carMake,
      carModel: formData.carModel,
      year: formData.year,
      trim: formData.trim || null,
      kilometers: formData.kilometers,
      price: formData.price,
      location: formData.location || null,
      province: formData.province || null,
      color: formData.color || null,
      transmission: formData.transmission || null,
      fuelType: formData.fuelType || null,
      bodyType: formData.bodyType || null,
      drivetrain: formData.drivetrain || null,
      vin: formData.vin || null,
      notes: formData.notes || null,
    };
    
    createSubmissionMutation.mutate(submissionData);
  };

  const handleReview = () => {
    if (!selectedSubmission || !reviewAction) return;
    
    if (selectedSubmission.status === "pending_supervisor") {
      supervisorReviewMutation.mutate({
        id: selectedSubmission.id,
        action: reviewAction,
        comments: reviewComments,
        flaggedFields,
      });
    } else if (selectedSubmission.status === "pending_manager") {
      managerReviewMutation.mutate({
        id: selectedSubmission.id,
        action: reviewAction,
        comments: reviewComments,
      });
    }
  };

  const openReviewDialog = (submission: DataSubmission) => {
    setSelectedSubmission(submission);
    setReviewAction("");
    setReviewComments("");
    setFlaggedFields([]);
    setShowReviewDialog(true);
  };

  const filteredSubmissions = useMemo(() => {
    let subs = userRole === "scraper" ? mySubmissions : allSubmissions;
    
    if (filterStatus !== "all") {
      subs = subs.filter(s => s.status === filterStatus);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      subs = subs.filter(s => 
        s.carMake.toLowerCase().includes(query) ||
        s.carModel.toLowerCase().includes(query) ||
        s.vin?.toLowerCase().includes(query) ||
        String(s.year).includes(query)
      );
    }
    
    return subs;
  }, [userRole, mySubmissions, allSubmissions, filterStatus, searchQuery]);

  if (!isDataRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Database className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">Data Analyst role required (Scraper, Supervisor, or Manager)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Data Analyst Dashboard</h1>
            <p className="text-slate-400 mt-1">
              {userRole === "scraper" && "Submit and track your vehicle data entries"}
              {userRole === "supervisor" && "Review and approve scraper submissions"}
              {userRole === "manager" && "Final approval and database upload management"}
              {userRole === "admin" && "Full access to all data analyst functions"}
            </p>
          </div>
          <Badge className="text-sm px-3 py-1 bg-blue-600">{userRole.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
                </div>
                <X className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Total</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            {(userRole === "scraper" || userRole === "admin") && (
              <TabsTrigger value="submissions" data-testid="tab-submissions">My Submissions</TabsTrigger>
            )}
            {["supervisor", "manager", "admin"].includes(userRole) && (
              <TabsTrigger value="review" data-testid="tab-review">
                Review Queue
                {(userRole === "supervisor" ? pendingSupervisor.length : pendingManager.length) > 0 && (
                  <Badge className="ml-2 bg-red-500">{userRole === "supervisor" ? pendingSupervisor.length : pendingManager.length}</Badge>
                )}
              </TabsTrigger>
            )}
            {["manager", "admin"].includes(userRole) && (
              <TabsTrigger value="all" data-testid="tab-all">All Submissions</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 w-64"
                    data-testid="input-search"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_supervisor">Pending Review</SelectItem>
                    <SelectItem value="pending_manager">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setShowSubmitDialog(true)} 
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-new-submission"
              >
                <Upload className="w-4 h-4 mr-2" /> New Submission
              </Button>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-xs text-slate-400">Vehicle</th>
                      <th className="text-left p-3 text-xs text-slate-400">Year</th>
                      <th className="text-left p-3 text-xs text-slate-400">Price</th>
                      <th className="text-left p-3 text-xs text-slate-400">KMs</th>
                      <th className="text-left p-3 text-xs text-slate-400">Status</th>
                      <th className="text-left p-3 text-xs text-slate-400">Submitted</th>
                      <th className="text-left p-3 text-xs text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => (
                      <tr key={sub.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                        <td className="p-3">
                          <div className="font-medium">{sub.carMake} {sub.carModel}</div>
                          {sub.trim && <div className="text-xs text-slate-400">{sub.trim}</div>}
                        </td>
                        <td className="p-3">{sub.year}</td>
                        <td className="p-3">${sub.price.toLocaleString()}</td>
                        <td className="p-3">{sub.kilometers.toLocaleString()} km</td>
                        <td className="p-3">
                          <Badge className={`${STATUS_COLORS[sub.status]} border`}>
                            {STATUS_LABELS[sub.status] || sub.status}
                          </Badge>
                          {sub.autoFlags && Object.keys(sub.autoFlags).length > 0 && (
                            <AlertTriangle className="inline-block w-4 h-4 ml-2 text-amber-400" />
                          )}
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openReviewDialog(sub)}
                            data-testid={`button-view-${sub.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No submissions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {userRole === "supervisor" ? "Pending Supervisor Review" : "Pending Manager Approval"}
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr>
                      {["manager", "admin"].includes(userRole) && (
                        <th className="p-3 w-10">
                          <Checkbox
                            checked={selectedIds.length === (userRole === "supervisor" ? pendingSupervisor : pendingManager).length}
                            onCheckedChange={(checked) => {
                              const items = userRole === "supervisor" ? pendingSupervisor : pendingManager;
                              setSelectedIds(checked ? items.map(s => s.id) : []);
                            }}
                          />
                        </th>
                      )}
                      <th className="text-left p-3 text-xs text-slate-400">Vehicle</th>
                      <th className="text-left p-3 text-xs text-slate-400">Details</th>
                      <th className="text-left p-3 text-xs text-slate-400">Price / KMs</th>
                      <th className="text-left p-3 text-xs text-slate-400">Flags</th>
                      <th className="text-left p-3 text-xs text-slate-400">Submitted</th>
                      <th className="text-left p-3 text-xs text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(userRole === "supervisor" ? pendingSupervisor : pendingManager).map(sub => (
                      <tr key={sub.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                        {["manager", "admin"].includes(userRole) && (
                          <td className="p-3">
                            <Checkbox
                              checked={selectedIds.includes(sub.id)}
                              onCheckedChange={(checked) => {
                                setSelectedIds(prev => checked ? [...prev, sub.id] : prev.filter(id => id !== sub.id));
                              }}
                            />
                          </td>
                        )}
                        <td className="p-3">
                          <div className="font-medium">{sub.carMake} {sub.carModel}</div>
                          <div className="text-xs text-slate-400">{sub.year} {sub.trim}</div>
                        </td>
                        <td className="p-3 text-sm">
                          <div>{sub.province} • {sub.transmission}</div>
                          <div className="text-slate-400">{sub.vin || "No VIN"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">${sub.price.toLocaleString()}</div>
                          <div className="text-sm text-slate-400">{sub.kilometers.toLocaleString()} km</div>
                        </td>
                        <td className="p-3">
                          {sub.autoFlags && Object.keys(sub.autoFlags).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(sub.autoFlags).map(([field, reason]) => (
                                <Badge key={field} className="bg-amber-500/20 text-amber-400 text-xs">
                                  {field}: {reason}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">None</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setReviewAction("approve");
                                setShowReviewDialog(true);
                              }}
                              data-testid={`button-approve-${sub.id}`}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setReviewAction("reject");
                                setShowReviewDialog(true);
                              }}
                              data-testid={`button-reject-${sub.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReviewDialog(sub)}
                              data-testid={`button-details-${sub.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(userRole === "supervisor" ? pendingSupervisor : pendingManager).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No pending submissions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
              {["manager", "admin"].includes(userRole) && selectedIds.length > 0 && (
                <div className="p-4 border-t border-slate-700 flex items-center gap-4">
                  <span className="text-sm text-slate-400">{selectedIds.length} selected</span>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => bulkActionMutation.mutate({ submissionIds: selectedIds, action: "approve" })}
                    disabled={bulkActionMutation.isPending}
                  >
                    Bulk Approve
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => bulkActionMutation.mutate({ submissionIds: selectedIds, action: "upload" })}
                    disabled={bulkActionMutation.isPending}
                  >
                    Bulk Upload
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search all submissions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_supervisor">Pending Review</SelectItem>
                  <SelectItem value="pending_manager">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/data-analyst"] })}
                className="border-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-900 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-xs text-slate-400">Vehicle</th>
                      <th className="text-left p-3 text-xs text-slate-400">Year</th>
                      <th className="text-left p-3 text-xs text-slate-400">Price</th>
                      <th className="text-left p-3 text-xs text-slate-400">KMs</th>
                      <th className="text-left p-3 text-xs text-slate-400">Status</th>
                      <th className="text-left p-3 text-xs text-slate-400">Submitted</th>
                      <th className="text-left p-3 text-xs text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => (
                      <tr key={sub.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                        <td className="p-3">
                          <div className="font-medium">{sub.carMake} {sub.carModel}</div>
                          {sub.trim && <div className="text-xs text-slate-400">{sub.trim}</div>}
                        </td>
                        <td className="p-3">{sub.year}</td>
                        <td className="p-3">${sub.price.toLocaleString()}</td>
                        <td className="p-3">{sub.kilometers.toLocaleString()} km</td>
                        <td className="p-3">
                          <Badge className={`${STATUS_COLORS[sub.status]} border`}>
                            {STATUS_LABELS[sub.status] || sub.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openReviewDialog(sub)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={(open) => { setShowSubmitDialog(open); if (!open) { resetForm(); setBulkResults({ success: 0, failed: 0, items: [] }); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Vehicles</DialogTitle>
            <p className="text-sm text-slate-400">Add new inventory manually, in bulk via CSV, or by scraping documents.</p>
          </DialogHeader>
          
          <Tabs value={submitTab} onValueChange={setSubmitTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-900 border-b border-slate-700 w-full justify-start rounded-none px-0">
              <TabsTrigger value="manual" className="data-[state=active]:bg-slate-800 rounded-none px-4" data-testid="tab-manual-entry">
                <FileText className="w-4 h-4 mr-2" /> Manual Entry
              </TabsTrigger>
              <TabsTrigger value="bulk-csv" className="data-[state=active]:bg-slate-800 rounded-none px-4" data-testid="tab-bulk-csv">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Bulk CSV
              </TabsTrigger>
              <TabsTrigger value="url-import" className="data-[state=active]:bg-slate-800 rounded-none px-4" data-testid="tab-url-import">
                <Globe className="w-4 h-4 mr-2" /> URL Import
              </TabsTrigger>
              <TabsTrigger value="bulk-urls" className="data-[state=active]:bg-slate-800 rounded-none px-4" data-testid="tab-bulk-urls">
                <Link className="w-4 h-4 mr-2" /> Bulk URLs
              </TabsTrigger>
              <TabsTrigger value="ai-parser" className="data-[state=active]:bg-slate-800 rounded-none px-4" data-testid="tab-ai-parser">
                <Sparkles className="w-4 h-4 mr-2" /> AI Parser
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 p-4">
              <TabsContent value="manual" className="m-0 space-y-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Vehicle Details</CardTitle>
                    <CardDescription className="text-xs">Enter all vehicle information manually.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-xs font-medium text-slate-400">Search Existing Vehicle</CardTitle>
                        <CardDescription className="text-xs">Search by VIN or Stock Number to auto-fill the form.</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-400 mb-1">Search by VIN</Label>
                            <div className="flex gap-2">
                              <Input
                                value={vinSearch}
                                onChange={e => setVinSearch(e.target.value.toUpperCase())}
                                placeholder="e.g. 1HGCM82633A123456"
                                className="bg-slate-900 border-slate-700 text-sm font-mono"
                                maxLength={17}
                                data-testid="input-vin-search"
                              />
                              <Button 
                                onClick={handleVinDecode} 
                                disabled={isDecodingVin || !vinSearch}
                                className="bg-blue-600 hover:bg-blue-700"
                                data-testid="button-search-vin"
                              >
                                {isDecodingVin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 mb-1">Search by Stock Number</Label>
                            <div className="flex gap-2">
                              <Input
                                value={formData.stockNumber}
                                onChange={e => setFormData({ ...formData, stockNumber: e.target.value })}
                                placeholder="Enter Stock #"
                                className="bg-slate-900 border-slate-700 text-sm"
                                data-testid="input-stock-search"
                              />
                              <Button variant="outline" className="border-slate-700">
                                <Search className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-xs font-medium text-slate-400">Extract from Listing URL</CardTitle>
                        <CardDescription className="text-xs">Paste a vehicle listing URL to automatically extract vehicle details.</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex gap-2">
                          <Input
                            value={urlExtract}
                            onChange={e => setUrlExtract(e.target.value)}
                            placeholder="Paste vehicle listing URL (e.g., https://example.com/listing/12345)"
                            className="bg-slate-900 border-slate-700 text-sm"
                            data-testid="input-url-extract"
                          />
                          <Button 
                            onClick={handleUrlExtract} 
                            disabled={isExtractingUrl || !urlExtract}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid="button-extract-url"
                          >
                            {isExtractingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400">VIN</Label>
                        <Input
                          value={formData.vin}
                          onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                          placeholder="e.g. 1HGCM82..."
                          className="bg-slate-900 border-slate-700 text-sm font-mono"
                          maxLength={17}
                          data-testid="input-vin"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Stock Number</Label>
                        <Input
                          value={formData.stockNumber}
                          onChange={e => setFormData({ ...formData, stockNumber: e.target.value })}
                          placeholder="Stock #"
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-stock-number"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Condition</Label>
                        <Select value={formData.condition} onValueChange={val => setFormData({ ...formData, condition: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-condition">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Year *</Label>
                        <Input
                          type="number"
                          value={formData.year}
                          onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-year"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400">Make *</Label>
                        <Select value={formData.carMake} onValueChange={val => setFormData({ ...formData, carMake: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-make">
                            <SelectValue placeholder="Select Make" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                            {POPULAR_MAKES.map(make => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Model *</Label>
                        <Input
                          value={formData.carModel}
                          onChange={e => setFormData({ ...formData, carModel: e.target.value })}
                          placeholder="e.g. Camry"
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-model"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Trim</Label>
                        <Input
                          value={formData.trim}
                          onChange={e => setFormData({ ...formData, trim: e.target.value })}
                          placeholder="e.g. LE, XLE, SR5"
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-trim"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400">Color</Label>
                        <Select value={formData.color} onValueChange={val => setFormData({ ...formData, color: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-color">
                            <SelectValue placeholder="Select Color" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Price ($) *</Label>
                        <Input
                          type="number"
                          value={formData.price || ""}
                          onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                          placeholder="$0"
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-price"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Kilometers *</Label>
                        <Input
                          type="number"
                          value={formData.kilometers || ""}
                          onChange={e => setFormData({ ...formData, kilometers: parseInt(e.target.value) || 0 })}
                          placeholder="Kms"
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-kilometers"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Transmission</Label>
                        <Select value={formData.transmission} onValueChange={val => setFormData({ ...formData, transmission: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-transmission">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400">Fuel Type</Label>
                        <Select value={formData.fuelType} onValueChange={val => setFormData({ ...formData, fuelType: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-fuel">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Body Type</Label>
                        <Select value={formData.bodyType} onValueChange={val => setFormData({ ...formData, bodyType: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-body">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Province</Label>
                        <Select value={formData.province} onValueChange={val => setFormData({ ...formData, province: val })}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm" data-testid="select-province">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {PROVINCES.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                        {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Engine & Features (Advanced)
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-slate-400">Drivetrain</Label>
                            <Select value={formData.drivetrain} onValueChange={val => setFormData({ ...formData, drivetrain: val })}>
                              <SelectTrigger className="bg-slate-900 border-slate-700 text-sm">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {DRIVETRAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Engine Size (L)</Label>
                            <Input
                              value={formData.engineSize}
                              onChange={e => setFormData({ ...formData, engineSize: e.target.value })}
                              placeholder="e.g. 2.5"
                              className="bg-slate-900 border-slate-700 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Cylinders</Label>
                            <Input
                              value={formData.engineCylinders}
                              onChange={e => setFormData({ ...formData, engineCylinders: e.target.value })}
                              placeholder="e.g. 4, 6, 8"
                              className="bg-slate-900 border-slate-700 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-400">Location</Label>
                            <Input
                              value={formData.location}
                              onChange={e => setFormData({ ...formData, location: e.target.value })}
                              placeholder="City name"
                              className="bg-slate-900 border-slate-700 text-sm"
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400">Listing URL</Label>
                        <Input
                          value={formData.sourceUrl}
                          onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                          placeholder="https://..."
                          className="bg-slate-900 border-slate-700 text-sm"
                          data-testid="input-listing-url"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">CarFax URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.carfaxUrl}
                            onChange={e => setFormData({ ...formData, carfaxUrl: e.target.value })}
                            placeholder="https://..."
                            className="bg-slate-900 border-slate-700 text-sm"
                            data-testid="input-carfax-url"
                          />
                          <Button variant="outline" size="sm" className="border-slate-700 text-xs">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-400">Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional vehicle details..."
                        className="bg-slate-900 border-slate-700 text-sm resize-none h-20"
                        data-testid="input-notes"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk-csv" className="m-0 space-y-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Bulk CSV Upload</CardTitle>
                    <CardDescription className="text-xs">Paste CSV data with headers: make, model, year, trim, price, kilometers, vin, color, transmission, fuel, body, province, location</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={bulkCsvText}
                      onChange={e => setBulkCsvText(e.target.value)}
                      placeholder={`make,model,year,trim,price,kilometers,vin,color
Toyota,Camry,2022,XLE,35000,25000,1HGCM82633A123456,Black
Honda,Civic,2021,EX,28000,30000,,White`}
                      className="bg-slate-800 border-slate-700 font-mono text-xs h-48 resize-none"
                      data-testid="textarea-bulk-csv"
                    />
                    
                    {bulkProgress > 0 && bulkProgress < 100 && (
                      <div className="space-y-2">
                        <Progress value={bulkProgress} className="h-2" />
                        <p className="text-xs text-slate-400">Uploading... {bulkProgress}%</p>
                      </div>
                    )}
                    
                    {bulkResults.items.length > 0 && (
                      <div className="p-3 bg-slate-800 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          Results: <span className="text-green-400">{bulkResults.success} successful</span>, <span className="text-red-400">{bulkResults.failed} failed</span>
                        </p>
                        <ScrollArea className="h-32">
                          {bulkResults.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs py-1">
                              {item.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-red-400" />}
                              <span>{item.carMake} {item.carModel} {item.year}</span>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setBulkCsvText(""); setBulkResults({ success: 0, failed: 0, items: [] }); }} className="border-slate-700">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                      </Button>
                      <Button onClick={handleBulkCsvSubmit} className="bg-blue-600 hover:bg-blue-700" data-testid="button-bulk-csv-upload">
                        <Upload className="w-4 h-4 mr-2" /> Upload CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="url-import" className="m-0 space-y-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Import from URL</CardTitle>
                    <CardDescription className="text-xs">Paste a vehicle listing URL to automatically extract and populate vehicle details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={urlExtract}
                        onChange={e => setUrlExtract(e.target.value)}
                        placeholder="https://www.autotrader.ca/listing/..."
                        className="bg-slate-800 border-slate-700"
                        data-testid="input-single-url"
                      />
                      <Button 
                        onClick={handleUrlExtract} 
                        disabled={isExtractingUrl || !urlExtract}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-extract-single-url"
                      >
                        {isExtractingUrl ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting...</> : <><Globe className="w-4 h-4 mr-2" /> Extract</>}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">Supported sites: AutoTrader, Kijiji Autos, Carfax, Facebook Marketplace, CarGurus, and more.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk-urls" className="m-0 space-y-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Bulk URL Import</CardTitle>
                    <CardDescription className="text-xs">Paste multiple vehicle listing URLs (one per line) to batch import.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={bulkUrls}
                      onChange={e => setBulkUrls(e.target.value)}
                      placeholder={`https://www.autotrader.ca/listing/123
https://www.autotrader.ca/listing/456
https://www.kijiji.ca/v-cars/789`}
                      className="bg-slate-800 border-slate-700 font-mono text-xs h-48 resize-none"
                      data-testid="textarea-bulk-urls"
                    />
                    <p className="text-xs text-slate-400">
                      {bulkUrls.split('\n').filter(u => u.trim()).length} URLs detected
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setBulkUrls("")} className="border-slate-700">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700" disabled data-testid="button-bulk-urls-import">
                        <Upload className="w-4 h-4 mr-2" /> Import All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-parser" className="m-0 space-y-4">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Vehicle Parser
                    </CardTitle>
                    <CardDescription className="text-xs">Paste any text containing vehicle information and AI will extract the details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={aiParseText}
                      onChange={e => setAiParseText(e.target.value)}
                      placeholder={`Paste vehicle text here, e.g.:

2022 Toyota Camry XLE - $35,000
Only 25,000 km! Excellent condition.
Black exterior, leather interior.
VIN: 1HGCM82633A123456

Or paste multiple vehicles...`}
                      className="bg-slate-800 border-slate-700 text-sm h-48 resize-none"
                      data-testid="textarea-ai-parse"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setAiParseText("")} className="border-slate-700">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                      </Button>
                      <Button 
                        onClick={handleAiParse} 
                        disabled={isAiParsing || !aiParseText}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-ai-parse"
                      >
                        {isAiParsing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Parse with AI</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white">
              <Trash2 className="w-4 h-4 mr-2" /> Clear Form
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-slate-700">
                Cancel
              </Button>
              {submitTab === "manual" && (
                <Button
                  onClick={handleSubmit}
                  disabled={createSubmissionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-to-inventory"
                >
                  {createSubmissionMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Add to Inventory</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission ? `${selectedSubmission.carMake} ${selectedSubmission.carModel} ${selectedSubmission.year}` : "Submission Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Make / Model</p>
                  <p className="font-medium">{selectedSubmission.carMake} {selectedSubmission.carModel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Year / Trim</p>
                  <p className="font-medium">{selectedSubmission.year} {selectedSubmission.trim || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="font-medium text-green-400">${selectedSubmission.price.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Kilometers</p>
                  <p className="font-medium">{selectedSubmission.kilometers.toLocaleString()} km</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="font-medium">{selectedSubmission.location || "-"}, {selectedSubmission.province}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">VIN</p>
                  <p className="font-medium font-mono text-sm">{selectedSubmission.vin || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Transmission</p>
                  <p className="font-medium">{selectedSubmission.transmission || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Status</p>
                  <Badge className={`${STATUS_COLORS[selectedSubmission.status]} border`}>
                    {STATUS_LABELS[selectedSubmission.status]}
                  </Badge>
                </div>
              </div>

              {selectedSubmission.autoFlags && Object.keys(selectedSubmission.autoFlags).length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm font-medium text-amber-400 mb-2">Auto-Detected Issues</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedSubmission.autoFlags).map(([field, reason]) => (
                      <Badge key={field} className="bg-amber-500/20 text-amber-400">
                        {field}: {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.sourceUrl && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Source URL</p>
                  <a href={selectedSubmission.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                    {selectedSubmission.sourceUrl}
                  </a>
                </div>
              )}

              {selectedSubmission.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Notes</p>
                  <p className="text-sm">{selectedSubmission.notes}</p>
                </div>
              )}

              {(selectedSubmission.status === "pending_supervisor" && ["supervisor", "manager", "admin"].includes(userRole)) ||
               (selectedSubmission.status === "pending_manager" && ["manager", "admin"].includes(userRole)) ? (
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <div>
                    <Label className="text-slate-400">Action</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={reviewAction === "approve" ? "default" : "outline"}
                        onClick={() => setReviewAction("approve")}
                        className={reviewAction === "approve" ? "bg-green-600" : "border-slate-700"}
                      >
                        <Check className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant={reviewAction === "reject" ? "destructive" : "outline"}
                        onClick={() => setReviewAction("reject")}
                        className={reviewAction !== "reject" ? "border-slate-700" : ""}
                      >
                        <X className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      {selectedSubmission.status === "pending_manager" && (
                        <>
                          <Button
                            variant={reviewAction === "upload" ? "default" : "outline"}
                            onClick={() => setReviewAction("upload")}
                            className={reviewAction === "upload" ? "bg-purple-600" : "border-slate-700"}
                          >
                            <Upload className="w-4 h-4 mr-2" /> Upload to DB
                          </Button>
                          <Button
                            variant={reviewAction === "send_back" ? "default" : "outline"}
                            onClick={() => setReviewAction("send_back")}
                            className={reviewAction === "send_back" ? "bg-amber-600" : "border-slate-700"}
                          >
                            <Send className="w-4 h-4 mr-2" /> Send Back
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedSubmission.status === "pending_supervisor" && (
                    <div>
                      <Label className="text-slate-400">Flag Fields (optional)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["price", "kilometers", "trim", "year", "vin"].map(field => (
                          <Button
                            key={field}
                            size="sm"
                            variant={flaggedFields.includes(field) ? "default" : "outline"}
                            onClick={() => {
                              setFlaggedFields(prev => 
                                prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
                              );
                            }}
                            className={flaggedFields.includes(field) ? "bg-amber-600" : "border-slate-700"}
                          >
                            {field}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-slate-400">Comments</Label>
                    <Textarea
                      value={reviewComments}
                      onChange={e => setReviewComments(e.target.value)}
                      placeholder="Add comments for the scraper..."
                      className="bg-slate-900 border-slate-700 mt-2"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="border-slate-700">
              Close
            </Button>
            {((selectedSubmission?.status === "pending_supervisor" && ["supervisor", "manager", "admin"].includes(userRole)) ||
              (selectedSubmission?.status === "pending_manager" && ["manager", "admin"].includes(userRole))) && (
              <Button
                onClick={handleReview}
                disabled={!reviewAction || supervisorReviewMutation.isPending || managerReviewMutation.isPending}
                className={
                  reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" :
                  reviewAction === "reject" ? "bg-red-600 hover:bg-red-700" :
                  reviewAction === "upload" ? "bg-purple-600 hover:bg-purple-700" :
                  "bg-amber-600 hover:bg-amber-700"
                }
              >
                {(supervisorReviewMutation.isPending || managerReviewMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Submit Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
