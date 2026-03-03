"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ── Types ──

export interface Ingredient {
  id: string;
  text: string;
  icon: string;
}

export type CookMode = "prep" | "mealkit" | "fullcook";

export type WritingStyle =
  | "balanced"
  | "lyrical"
  | "noir"
  | "classic";

export interface CookResult {
  mode: CookMode;
  title: string;
  premise?: string;
  keywords?: string[];
  plotPoints?: string[];
  atmosphere?: string;
  secretSauce?: string;
  synopsis?: string;
  complexity: number;
}

export interface Memo {
  id: string;
  text: string;
  createdAt: number;
}

export interface CookbookEntry {
  id: string;
  result: CookResult;
  ingredients: Ingredient[];
  prompt: string;
  createdAt: number;
}

interface AppContextType {
  // Ingredients (kitchen)
  ingredients: Ingredient[];
  addIngredient: (text: string) => void;
  removeIngredient: (id: string) => void;
  // Prompt (kitchen)
  prompt: string;
  setPrompt: (val: string) => void;
  // Cook mode
  cookMode: CookMode;
  setCookMode: (mode: CookMode) => void;
  writingStyle: WritingStyle;
  setWritingStyle: (style: WritingStyle) => void;
  // Cook result
  cookResult: CookResult | null;
  setCookResult: (result: CookResult | null) => void;
  // Loading
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  // Memos (pantry)
  memos: Memo[];
  addMemo: (text: string) => void;
  removeMemo: (id: string) => void;
  updateMemo: (id: string, text: string) => void;
  useAsIngredient: (memo: Memo) => void;
  // Cookbook
  cookbook: CookbookEntry[];
  addToCookbook: () => void;
  removeFromCookbook: (id: string) => void;
}

// ── Constants ──

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

// ── Helpers ──

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as T;
      return parsed as T;
    }
  } catch {
    // Invalid localStorage data
  }
  return fallback;
}

function writeLS(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Context ──

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Kitchen state
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = readLS<Ingredient[]>("fridge-writer-ingredients", []);
    return saved.length > 0 ? saved : DEFAULT_INGREDIENTS;
  });
  const [prompt, setPromptState] = useState<string>(() =>
    readLS<string>("fridge-writer-prompt", "")
  );
  const [cookMode, setCookModeState] = useState<CookMode>(() =>
    readLS<CookMode>("fridge-writer-cookmode", "mealkit")
  );
  const [writingStyle, setWritingStyleState] = useState<WritingStyle>(() =>
    readLS<WritingStyle>("fridge-writer-writingstyle", "balanced")
  );
  const [cookResult, setCookResult] = useState<CookResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pantry memos
  const [memos, setMemos] = useState<Memo[]>(() =>
    readLS<Memo[]>("fridge-writer-memos", [])
  );

  // Cookbook
  const [cookbook, setCookbook] = useState<CookbookEntry[]>(() =>
    readLS<CookbookEntry[]>("fridge-writer-cookbook", [])
  );

  // ── Persistence ──
  useEffect(() => {
    writeLS("fridge-writer-ingredients", ingredients);
  }, [ingredients]);

  useEffect(() => {
    writeLS("fridge-writer-prompt", prompt);
  }, [prompt]);

  useEffect(() => {
    writeLS("fridge-writer-cookmode", cookMode);
  }, [cookMode]);

  useEffect(() => {
    writeLS("fridge-writer-writingstyle", writingStyle);
  }, [writingStyle]);

  useEffect(() => {
    writeLS("fridge-writer-memos", memos);
  }, [memos]);

  useEffect(() => {
    writeLS("fridge-writer-cookbook", cookbook);
  }, [cookbook]);

  // ── Ingredient actions ──
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

  const setCookMode = useCallback((mode: CookMode) => {
    setCookModeState(mode);
  }, []);

  const setWritingStyle = useCallback((style: WritingStyle) => {
    setWritingStyleState(style);
  }, []);

  // ── Memo actions ──
  const addMemo = useCallback((text: string) => {
    setMemos((prev) => [
      { id: Date.now().toString(), text, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const removeMemo = useCallback((id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMemo = useCallback((id: string, text: string) => {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));
  }, []);

  const useAsIngredient = useCallback((memo: Memo) => {
    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
    setIngredients((prev) => [
      ...prev,
      { id: `memo-${memo.id}-${Date.now()}`, text: memo.text, icon },
    ]);
  }, []);

  // ── Cookbook actions ──
  const addToCookbook = useCallback(() => {
    setCookResult((currentResult) => {
      if (!currentResult) return currentResult;
      setCookbook((prev) => [
        {
          id: Date.now().toString(),
          result: currentResult,
          ingredients: ingredients,
          prompt: prompt,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      return currentResult;
    });
  }, [ingredients, prompt]);

  const removeFromCookbook = useCallback((id: string) => {
    setCookbook((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ingredients,
        addIngredient,
        removeIngredient,
        prompt,
        setPrompt,
        cookMode,
        setCookMode,
        writingStyle,
        setWritingStyle,
        cookResult,
        setCookResult,
        isLoading,
        setIsLoading,
        memos,
        addMemo,
        removeMemo,
        updateMemo,
        useAsIngredient,
        cookbook,
        addToCookbook,
        removeFromCookbook,
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
