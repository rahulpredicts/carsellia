import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeColor = "blue" | "green" | "purple" | "red" | "orange";

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  accentClasses: {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    gradient: string;
    gradientHover: string;
    ring: string;
    bgSubtle: string;
  };
}

const themeColorMap: Record<ThemeColor, ThemeContextType["accentClasses"]> = {
  blue: {
    bg: "bg-blue-600",
    bgHover: "hover:bg-blue-700",
    text: "text-blue-400",
    border: "border-blue-500",
    gradient: "from-blue-600 to-cyan-600",
    gradientHover: "hover:from-blue-700 hover:to-cyan-700",
    ring: "ring-blue-500",
    bgSubtle: "bg-blue-500/20",
  },
  green: {
    bg: "bg-emerald-600",
    bgHover: "hover:bg-emerald-700",
    text: "text-emerald-400",
    border: "border-emerald-500",
    gradient: "from-emerald-600 to-teal-600",
    gradientHover: "hover:from-emerald-700 hover:to-teal-700",
    ring: "ring-emerald-500",
    bgSubtle: "bg-emerald-500/20",
  },
  purple: {
    bg: "bg-purple-600",
    bgHover: "hover:bg-purple-700",
    text: "text-purple-400",
    border: "border-purple-500",
    gradient: "from-purple-600 to-violet-600",
    gradientHover: "hover:from-purple-700 hover:to-violet-700",
    ring: "ring-purple-500",
    bgSubtle: "bg-purple-500/20",
  },
  red: {
    bg: "bg-red-600",
    bgHover: "hover:bg-red-700",
    text: "text-red-400",
    border: "border-red-500",
    gradient: "from-red-600 to-rose-600",
    gradientHover: "hover:from-red-700 hover:to-rose-700",
    ring: "ring-red-500",
    bgSubtle: "bg-red-500/20",
  },
  orange: {
    bg: "bg-orange-600",
    bgHover: "hover:bg-orange-700",
    text: "text-orange-400",
    border: "border-orange-500",
    gradient: "from-orange-600 to-amber-600",
    gradientHover: "hover:from-orange-700 hover:to-amber-700",
    ring: "ring-orange-500",
    bgSubtle: "bg-orange-500/20",
  },
};

const cssVariableMap: Record<ThemeColor, Record<string, string>> = {
  blue: {
    "--accent-50": "239 246 255",
    "--accent-100": "219 234 254",
    "--accent-200": "191 219 254",
    "--accent-300": "147 197 253",
    "--accent-400": "96 165 250",
    "--accent-500": "59 130 246",
    "--accent-600": "37 99 235",
    "--accent-700": "29 78 216",
    "--accent-800": "30 64 175",
    "--accent-900": "30 58 138",
  },
  green: {
    "--accent-50": "236 253 245",
    "--accent-100": "209 250 229",
    "--accent-200": "167 243 208",
    "--accent-300": "110 231 183",
    "--accent-400": "52 211 153",
    "--accent-500": "16 185 129",
    "--accent-600": "5 150 105",
    "--accent-700": "4 120 87",
    "--accent-800": "6 95 70",
    "--accent-900": "6 78 59",
  },
  purple: {
    "--accent-50": "250 245 255",
    "--accent-100": "243 232 255",
    "--accent-200": "233 213 255",
    "--accent-300": "216 180 254",
    "--accent-400": "192 132 252",
    "--accent-500": "168 85 247",
    "--accent-600": "147 51 234",
    "--accent-700": "126 34 206",
    "--accent-800": "107 33 168",
    "--accent-900": "88 28 135",
  },
  red: {
    "--accent-50": "254 242 242",
    "--accent-100": "254 226 226",
    "--accent-200": "254 202 202",
    "--accent-300": "252 165 165",
    "--accent-400": "248 113 113",
    "--accent-500": "239 68 68",
    "--accent-600": "220 38 38",
    "--accent-700": "185 28 28",
    "--accent-800": "153 27 27",
    "--accent-900": "127 29 29",
  },
  orange: {
    "--accent-50": "255 247 237",
    "--accent-100": "255 237 213",
    "--accent-200": "254 215 170",
    "--accent-300": "253 186 116",
    "--accent-400": "251 146 60",
    "--accent-500": "249 115 22",
    "--accent-600": "234 88 12",
    "--accent-700": "194 65 12",
    "--accent-800": "154 52 18",
    "--accent-900": "124 45 18",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("carsellia-theme-color");
      if (saved && saved in themeColorMap) {
        return saved as ThemeColor;
      }
    }
    return "blue";
  });

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem("carsellia-theme-color", color);
  };

  useEffect(() => {
    const root = document.documentElement;
    const cssVars = cssVariableMap[themeColor];
    
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.setAttribute("data-theme", themeColor);
  }, [themeColor]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        setThemeColor,
        accentClasses: themeColorMap[themeColor],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
