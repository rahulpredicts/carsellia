import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const role = user?.role || '';

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isDealer: role === 'dealer',
    isDealerAdmin: role === 'dealer_admin',
    isDealerStaff: role === 'dealer_staff',
    isDealerRole: ['dealer', 'dealer_admin', 'dealer_staff'].includes(role),
    isDataAnalyst: role === 'data_analyst',
    isTransportation: role === 'transportation',
    isScraper: role === 'scraper',
    isSupervisor: role === 'supervisor',
    isManager: role === 'manager',
    isDataRole: ['scraper', 'supervisor', 'manager', 'data_analyst'].includes(role),
  };
}
