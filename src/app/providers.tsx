"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface Ingredient {
  id: string;
  text: string;
  icon: string;
}

export interface CookResult {
  title: string;
  premise: string;
  plotPoints: string[];
  atmosphere: string;
  secretSauce: string;
  complexity: number;
}

interface AppContextType {
  ingredients: Ingredient[];
  addIngredient: (text: string) => void;
  removeIngredient: (id: string) => void;
  prompt: string;
  setPrompt: (val: string) => void;
  cookResult: CookResult | null;
  setCookResult: (result: CookResult | null) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

const ICONS = [
  "auto_awesome",
  "vpn_key",
  "person",
  "dark_mode",
  "map",
  "swords",
  "diamond",
  "bolt",
  "psychology",
  "forest",
  "water_drop",
  "local_fire_department",
];

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: "default-1", text: "어두운 숲", icon: "auto_awesome" },
  { id: "default-2", text: "비밀의 열쇠", icon: "vpn_key" },
  { id: "default-3", text: "말없는 주인공", icon: "person" },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    if (typeof window === "undefined") return DEFAULT_INGREDIENTS;
    try {
      const saved = localStorage.getItem("fridge-writer-ingredients");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0)
          return parsed as Ingredient[];
      }
    } catch {
      // Invalid localStorage data
    }
    return DEFAULT_INGREDIENTS;
  });
  const [prompt, setPromptState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("fridge-writer-prompt") || "";
    } catch {
      return "";
    }
  });
  const [cookResult, setCookResult] = useState<CookResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "fridge-writer-ingredients",
      JSON.stringify(ingredients)
    );
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem("fridge-writer-prompt", prompt);
  }, [prompt]);

  const addIngredient = useCallback((text: string) => {
    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
    setIngredients((prev) => [
      ...prev,
      { id: Date.now().toString(), text, icon },
    ]);
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setPrompt = useCallback((val: string) => {
    setPromptState(val);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ingredients,
        addIngredient,
        removeIngredient,
        prompt,
        setPrompt,
        cookResult,
        setCookResult,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
