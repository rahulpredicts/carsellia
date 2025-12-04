import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Car, 
  Calculator, 
  LogOut, 
  Users, 
  Shield, 
  Database,
  Package,
  MapPin,
  FileDown,
  BookOpen,
  Settings,
  User,
  Truck,
  ClipboardList,
  Store,
  ShoppingCart,
  Handshake,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAdmin, isDataAnalyst, isTransportation, isScraper, isSupervisor, isManager, isDataRole, isDealerRole } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Admin navigation - Full access to all features including User Management
  const adminNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield },
    { href: "/user-management", label: "User Management", icon: Users },
    { href: "/dealer-portal", label: "B2B Dealer Portal", icon: Store },
    { href: "/dealer-mediation", label: "B2B Mediation", icon: ArrowRightLeft },
    { href: "/inventory", label: "All Inventory", icon: Package },
    { href: "/appraisal", label: "Appraise", icon: Calculator },
    { href: "/export", label: "Export Calculator", icon: FileDown },
    { href: "/transport", label: "Transport Calculator", icon: Truck },
    { href: "/transport-dashboard", label: "Transport Operations", icon: ClipboardList },
    { href: "/transport-orders", label: "Transport Orders", icon: Package },
    { href: "/upload", label: "Add Vehicles", icon: PlusCircle },
    { href: "/canadian-retail", label: "Canadian Retail", icon: MapPin },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Data Analyst navigation - Can upload, delete, publish cars; NO appraisal access
  const dataAnalystNavItems = [
    { href: "/data-analyst", label: "Data Analyst Hub", icon: Database },
    { href: "/inventory", label: "All Inventory", icon: Package },
    { href: "/upload", label: "Add Vehicles", icon: PlusCircle },
    { href: "/canadian-retail", label: "Canadian Retail", icon: MapPin },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
  ];

  // Scraper navigation - Submit data, view own submissions
  const scraperNavItems = [
    { href: "/data-analyst", label: "Submissions", icon: Database },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
  ];

  // Supervisor navigation - Review scraper submissions
  const supervisorNavItems = [
    { href: "/data-analyst", label: "Review Queue", icon: ClipboardList },
    { href: "/inventory", label: "All Inventory", icon: Package },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
  ];

  // Manager navigation - Final approval, user management
  const managerNavItems = [
    { href: "/data-analyst", label: "Manager Dashboard", icon: Database },
    { href: "/inventory", label: "All Inventory", icon: Package },
    { href: "/upload", label: "Add Vehicles", icon: PlusCircle },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
  ];

  // Transportation Team navigation - Transport operations, quotes, orders
  const transportationNavItems = [
    { href: "/transport-dashboard", label: "Transport Dashboard", icon: Truck },
    { href: "/transport", label: "Quote Calculator", icon: Calculator },
    { href: "/transport-orders", label: "Orders", icon: ClipboardList },
    { href: "/inventory", label: "All Inventory", icon: Package },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
  ];

  // Dealer navigation - B2B Portal, Appraisal, inventory viewing, pricing, comparables; NO upload/delete
  const dealerNavItems = [
    { href: "/dealer-portal", label: "B2B Portal", icon: Store },
    { href: "/appraisal", label: "Vehicle Appraisal", icon: Calculator },
    { href: "/export", label: "Export Calculator", icon: FileDown },
    { href: "/transport", label: "Transport Quote", icon: Truck },
    { href: "/canadian-retail", label: "Canadian Retail", icon: MapPin },
    { href: "/reference", label: "Market Trends", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : 
    isScraper ? scraperNavItems : 
    isSupervisor ? supervisorNavItems : 
    isManager ? managerNavItems : 
    isDataAnalyst ? dataAnalystNavItems : 
    isTransportation ? transportationNavItems :
    isDealerRole ? dealerNavItems :
    dealerNavItems;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 md:min-h-screen flex-shrink-0 flex flex-col">
        {/* Header with Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white p-2 rounded-lg bg-theme-accent">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none text-white">Carsellia</h2>
              <p className="text-xs text-slate-400 mt-1">
                {isAdmin ? 'Admin Panel' : 
                 isScraper ? 'Data Scraper' : 
                 isSupervisor ? 'Supervisor' : 
                 isManager ? 'Manager' : 
                 isDataAnalyst ? 'Data Analyst' : 
                 isTransportation ? 'Transport Team' : 
                 'Dealer Portal'}
              </p>
            </div>
          </div>
          
          {/* Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-slate-700 transition-colors hover:border-theme-accent">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-white bg-theme-accent">
                      {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end">
                <DropdownMenuLabel className="text-white">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.firstName || 'User'}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem 
                  className="text-red-400 focus:bg-red-900/50 focus:text-red-300"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* User Role Badge */}
        {user && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-yellow-400" />
              ) : isScraper ? (
                <Database className="w-4 h-4 text-cyan-400" />
              ) : isSupervisor ? (
                <ClipboardList className="w-4 h-4 text-green-400" />
              ) : isManager ? (
                <Users className="w-4 h-4 text-purple-400" />
              ) : isDataAnalyst ? (
                <Database className="w-4 h-4 text-purple-400" />
              ) : isTransportation ? (
                <Truck className="w-4 h-4 text-orange-400" />
              ) : (
                <Users className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-sm text-slate-300 capitalize">{user.role?.replace('_', ' ')}</span>
            </div>
          </div>
        )}
        
        {/* Navigation Links - Scrollable */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-theme-accent text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button - Fixed at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 shrink-0">
          <Button
            variant="destructive"
            className="w-full justify-center bg-red-600 hover:bg-red-700 text-white font-medium"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
