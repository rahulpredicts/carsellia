import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function useGlobalLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within GlobalLoaderProvider");
  }
  return context;
}

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");

  const showLoader = useCallback((message: string = "Processing...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoaderContext.Provider value={{ isLoading, loadingMessage, showLoader, hideLoader }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-2xl">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">{loadingMessage}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}
