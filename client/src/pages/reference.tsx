import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Globe, 
  MapPin, 
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
  Target,
  Truck,
  CloudSnow,
  Sun,
  Clock,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Car,
  BarChart3,
  ThermometerSnowflake,
  Leaf,
  Umbrella,
  MapPinned,
  Shield,
  Search
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { MarketTrendsLoadingOverlay } from "@/components/MarketTrendsRPMGauge";
import { AnimatePresence } from "framer-motion";

interface MarketTrends {
  region: string;
  provinceCode: string;
  postalCodeArea?: string;
  lastUpdated: string;
  marketOverview: {
    demandIndex: number;
    avgMarketPrice: number;
    topSegment: string;
    season: string;
    nationalAvgDaysToSell: number;
  };
  trendingVehicles: { rank: number; vehicle: string; segment: string; trend: string; avgPrice: number; daysToSell: number }[];
  segmentTrends: { segment: string; marketShare: number; trend: string; avgPrice: number; demandLevel: string }[];
  yearPriceTrends: { year: number; avgPrice: number; changeFromPrevious: string }[];
  acquisitionTargets: { vehicle: string; reason: string; confidence: number }[];
  avoidList: { vehicle: string; reason: string; riskLevel: string }[];
  marketFactors: { type: string; title: string; impact: string; impactPercent: number; positive: boolean; detail: string }[];
  provincialHeatmap: { province: string; name: string; demandIndex: number; avgPrice: number; topSegment: string; trend: string }[];
  demandForecast: { week: string; demand: number; label: string }[];
  exportOpportunity: { cadUsdRate: number; trend: string; margin: string; topExportVehicles: string[]; recommendation: string };
  aiVerdict: { summary: string; recommendations: string[]; marketCondition: string; riskLevel: string };
}

const PROVINCES = [
  { code: "ON", name: "Ontario" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "MB", name: "Manitoba" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland & Labrador" },
  { code: "PE", name: "Prince Edward Island" },
];

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
};

const getSeasonIcon = (season: string) => {
  switch (season) {
    case "Winter": return <ThermometerSnowflake className="w-4 h-4" />;
    case "Spring": return <Leaf className="w-4 h-4" />;
    case "Summer": return <Sun className="w-4 h-4" />;
    case "Fall": return <Umbrella className="w-4 h-4" />;
    default: return <Sun className="w-4 h-4" />;
  }
};

export default function ReferencePage() {
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [appliedProvince, setAppliedProvince] = useState<string>("");
  const [appliedPostalCode, setAppliedPostalCode] = useState<string>("");

  const { data: trends, isLoading, isFetching, refetch } = useQuery<MarketTrends>({
    queryKey: ["/api/market-intelligence", appliedProvince, appliedPostalCode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedProvince) params.append("province", appliedProvince);
      if (appliedPostalCode) params.append("postalCode", appliedPostalCode);
      const url = `/api/market-intelligence${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch market trends");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleApplyFilters = () => {
    setAppliedProvince(selectedProvince);
    setAppliedPostalCode(postalCode.toUpperCase().replace(/\s/g, ''));
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const getFactorIcon = (type: string) => {
    switch (type) {
      case "weather": return <CloudSnow className="w-5 h-5" />;
      case "economy": return <DollarSign className="w-5 h-5" />;
      case "supply": return <Truck className="w-5 h-5" />;
      case "seasonal": return <Sun className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const showLoading = isLoading || isFetching;

  const segmentChartData = trends?.segmentTrends.map(s => ({
    name: s.segment.replace("Full-Size ", "").replace("Mid-Size ", ""),
    share: s.marketShare,
    color: s.demandLevel === "Very High" ? "#22c55e" : s.demandLevel === "High" ? "#3b82f6" : s.demandLevel === "Moderate" ? "#f59e0b" : "#ef4444"
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <AnimatePresence>
        {showLoading && <MarketTrendsLoadingOverlay loadingText="Loading Market Trends..." />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Canadian Market Trends
              </h1>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Globe className="w-3 h-3 mr-1" />
                Independent Data
              </Badge>
            </div>
            {trends && (
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {trends.region} {trends.postalCodeArea ? `(${trends.postalCodeArea})` : ""} • {trends.marketOverview.season} Season • Updated {new Date(trends.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={showLoading}
            className="bg-slate-800 hover:bg-slate-700 text-white"
            data-testid="button-refresh-trends"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${showLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-slate-400 text-sm mb-2 block">Province</Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white" data-testid="select-province">
                    <SelectValue placeholder="Select province..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all" className="text-white hover:bg-slate-800">All Canada</SelectItem>
                    {PROVINCES.map(p => (
                      <SelectItem key={p.code} value={p.code} className="text-white hover:bg-slate-800">
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-slate-400 text-sm mb-2 block">Postal Code (for local trends)</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  placeholder="e.g. M5V, L4K, V6B..."
                  className="bg-slate-900 border-slate-700 text-white uppercase"
                  maxLength={6}
                  data-testid="input-postal-code"
                />
              </div>
              <Button 
                onClick={handleApplyFilters}
                disabled={showLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6"
                data-testid="button-apply-filters"
              >
                <Search className="w-4 h-4 mr-2" />
                Get Trends
              </Button>
            </div>
            {(appliedProvince || appliedPostalCode) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <span>Showing trends for:</span>
                {appliedProvince && appliedProvince !== "all" && (
                  <Badge className="bg-violet-500/20 text-violet-400">
                    {PROVINCES.find(p => p.code === appliedProvince)?.name || appliedProvince}
                  </Badge>
                )}
                {appliedPostalCode && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    Postal: {appliedPostalCode}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {trends && (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-6 pr-4">
              <div className="grid lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-violet-900/40 to-slate-900 border-violet-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Market Demand Index</span>
                      <Activity className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold text-white">{trends.marketOverview.demandIndex}</p>
                      <span className="text-slate-500">/100</span>
                    </div>
                    <Progress value={trends.marketOverview.demandIndex} className="h-2 mt-2" />
                    <p className="text-xs text-slate-500 mt-2">
                      {trends.marketOverview.demandIndex > 70 ? "Strong buyer activity" : trends.marketOverview.demandIndex > 50 ? "Moderate activity" : "Soft market"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Avg. Market Price</span>
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(trends.marketOverview.avgMarketPrice)}</p>
                    <p className="text-xs text-slate-500 mt-1">{trends.region} average</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Top Segment</span>
                      <Car className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-white">{trends.marketOverview.topSegment}</p>
                    <p className="text-xs text-slate-500 mt-1">Highest demand in region</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Avg. Days to Sell</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-white">{trends.marketOverview.nationalAvgDaysToSell}</p>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">National</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Canada-wide benchmark</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-emerald-900/30 to-slate-900 border-emerald-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                      <Target className="w-4 h-4" />
                      Best Acquisitions Now
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Top vehicles to buy based on current market conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trends.acquisitionTargets.map((target, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-emerald-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-medium text-sm">{target.vehicle}</p>
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                              {target.confidence}% conf
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs">{target.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/30 to-slate-900 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      Avoid or Wholesale
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                      Vehicles with lower demand in current market
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trends.avoidList.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-red-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-medium text-sm">{item.vehicle}</p>
                            <Badge className={item.riskLevel === "High" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"} variant="outline">
                              {item.riskLevel} Risk
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-400" />
                      Trending Vehicles in Canada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {trends.trendingVehicles.slice(0, 6).map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                              #{v.rank}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{v.vehicle}</p>
                              <p className="text-slate-500 text-xs">{v.segment} • {v.daysToSell}d avg</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={v.trend.startsWith("+") ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                              {v.trend}
                            </Badge>
                            <p className="text-slate-400 text-xs mt-1">{formatCurrency(v.avgPrice)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Export Opportunity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">CAD/USD Rate</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold text-white">${trends.exportOpportunity.cadUsdRate}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Margin Potential</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400">{trends.exportOpportunity.margin}</Badge>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">{trends.exportOpportunity.recommendation}</p>
                    <div className="flex flex-wrap gap-1">
                      {trends.exportOpportunity.topExportVehicles.map((v, i) => (
                        <Badge key={i} variant="outline" className="bg-slate-900/50 border-slate-600 text-slate-300 text-xs">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      Segment Market Share
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={segmentChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 30]} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            formatter={(value: number) => [`${value}%`, 'Market Share']}
                          />
                          <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                            {segmentChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Market Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {trends.marketFactors.map((factor, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${factor.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {getFactorIcon(factor.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white text-sm font-medium truncate">{factor.title}</p>
                              <Badge className={factor.positive ? "bg-emerald-500/20 text-emerald-400 flex-shrink-0" : "bg-red-500/20 text-red-400 flex-shrink-0"}>
                                {factor.impactPercent > 0 ? '+' : ''}{factor.impactPercent}%
                              </Badge>
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5">{factor.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-violet-400" />
                    Provincial Market Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {trends.provincialHeatmap.map((p, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${p.province === trends.provinceCode ? 'bg-violet-500/20 border-violet-500/40' : 'bg-slate-900/50 border-slate-700 hover:border-violet-500/30'}`}
                        onClick={() => {
                          setSelectedProvince(p.province);
                          setAppliedProvince(p.province);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-bold text-sm">{p.province}</span>
                          <span className={`text-xs ${p.demandIndex > 70 ? 'text-emerald-400' : p.demandIndex > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {p.demandIndex}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs truncate">{p.topSegment}</p>
                        <p className="text-slate-500 text-xs">{formatCurrency(p.avgPrice)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-900/30 to-slate-900 border-violet-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-violet-400">
                      <Brain className="w-4 h-4" />
                      Market Intelligence Summary
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getSeasonIcon(trends.marketOverview.season)}
                      <Badge className={
                        trends.aiVerdict.marketCondition === "Strong" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        trends.aiVerdict.marketCondition === "Moderate" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {trends.aiVerdict.marketCondition} Market
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">{trends.aiVerdict.summary}</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {trends.aiVerdict.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-400 p-2 rounded-lg bg-slate-900/30">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Shield className="w-3 h-3" />
                      <span>Independent market data • Not connected to your inventory</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>Based on Canadian market patterns and seasonal trends</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
