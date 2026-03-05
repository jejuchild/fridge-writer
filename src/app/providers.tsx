"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  CookMode,
  WritingStyle,
  Ingredient,
  CookResult,
  PersonalizationHints,
} from "./types";

export type {
  CookMode,
  WritingStyle,
  Ingredient,
  CookResult,
  PersonalizationHints,
} from "./types";

export interface Memo {
  id: string;
  text: string;
  createdAt: number;
}

export interface CookSessionSnapshot {
  ingredientsUsed: Ingredient[];
  promptUsed: string;
  modeUsed: CookMode;
  styleUsed: WritingStyle;
  seasonings: string[];
  createdAt: number;
}

export const STORAGE_KEYS = {
  INGREDIENTS: "fridge-writer-ingredients",
  PROMPT: "fridge-writer-prompt",
  COOK_MODE: "fridge-writer-cookmode",
  WRITING_STYLE: "fridge-writer-writingstyle",
  COOK_RESULT: "fridge-writer-cookresult",
  ACTIVE_SESSION: "fridge-writer-active-session",
  INGREDIENT_LIBRARY: "fridge-writer-ingredient-library",
  MEMOS: "fridge-writer-memos",
  COOKBOOK: "fridge-writer-cookbook",
} as const;

export interface CookbookEntry {
  id: string;
  result: CookResult;
  ingredients: Ingredient[];
  prompt: string;
  style?: WritingStyle;
  seasonings?: string[];
  createdAt: number;
}

interface AppContextType {
  ingredients: Ingredient[];
  ingredientLibrary: string[];
  addIngredient: (text: string) => void;
  addIngredientFromLibrary: (text: string) => void;
  removeIngredient: (id: string) => void;
  prompt: string;
  setPrompt: (val: string) => void;
  cookMode: CookMode;
  setCookMode: (mode: CookMode) => void;
  writingStyle: WritingStyle;
  setWritingStyle: (style: WritingStyle) => void;
  cookResult: CookResult | null;
  setCookResult: (result: CookResult | null) => void;
  activeSession: CookSessionSnapshot | null;
  prepareCookSession: (payload: {
    ingredientsUsed: Ingredient[];
    promptUsed: string;
    modeUsed: CookMode;
    styleUsed: WritingStyle;
  }) => void;
  addSeasoningToSession: (seasoning: string) => void;
  personalizationHints: PersonalizationHints;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  memos: Memo[];
  addMemo: (text: string) => void;
  removeMemo: (id: string) => void;
  updateMemo: (id: string, text: string) => void;
  useAsIngredient: (memo: Memo) => void;
  cookbook: CookbookEntry[];
  addToCookbook: () => void;
  removeFromCookbook: (id: string) => void;
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

const STOPWORDS = new Set([
  "그리고",
  "그러나",
  "하지만",
  "그녀",
  "그는",
  "이야기",
  "장면",
  "사람",
  "정도",
  "에서",
  "으로",
]);

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCookMode(value: unknown): CookMode {
  return value === "prep" || value === "mealkit" || value === "fullcook"
    ? value
    : "mealkit";
}

function normalizeWritingStyle(value: unknown): WritingStyle {
  return value === "balanced" ||
    value === "lyrical" ||
    value === "noir" ||
    value === "classic"
    ? value
    : "balanced";
}

function buildPersonalization(
  memos: Memo[],
  cookbook: CookbookEntry[]
): PersonalizationHints {
  const corpus = [
    ...memos.map((m) => m.text),
    ...cookbook.map((e) => e.result.title),
    ...cookbook.map((e) => e.result.premise || ""),
    ...cookbook.map((e) => e.result.synopsis || ""),
  ].join(" ");

  const words = corpus.match(/[가-힣]{2,}/g) || [];
  const counts = new Map<string, number>();
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  const preferredKeywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  const memoHighlights = memos.slice(0, 3).map((m) => m.text);
  const referencePhrases = cookbook
    .slice(0, 3)
    .map((e) => e.result.premise || e.result.title)
    .filter(Boolean);

  return { preferredKeywords, memoHighlights, referencePhrases };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = readLS<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, []);
    return saved.length > 0 ? saved : DEFAULT_INGREDIENTS;
  });

  const [ingredientLibrary, setIngredientLibrary] = useState<string[]>(() => {
    const saved = readLS<string[]>(STORAGE_KEYS.INGREDIENT_LIBRARY, []);
    if (saved.length > 0) return saved;
    return DEFAULT_INGREDIENTS.map((i) => i.text);
  });

  const [prompt, setPromptState] = useState<string>(() =>
    readLS<string>(STORAGE_KEYS.PROMPT, "")
  );

  const [cookMode, setCookModeState] = useState<CookMode>(() =>
    normalizeCookMode(readLS<unknown>(STORAGE_KEYS.COOK_MODE, "mealkit"))
  );

  const [writingStyle, setWritingStyleState] = useState<WritingStyle>(() =>
    normalizeWritingStyle(readLS<unknown>(STORAGE_KEYS.WRITING_STYLE, "balanced"))
  );

  const [cookResult, setCookResultState] = useState<CookResult | null>(() =>
    readLS<CookResult | null>(STORAGE_KEYS.COOK_RESULT, null)
  );

  const [activeSession, setActiveSession] = useState<CookSessionSnapshot | null>(() =>
    readLS<CookSessionSnapshot | null>(STORAGE_KEYS.ACTIVE_SESSION, null)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [memos, setMemos] = useState<Memo[]>(() => readLS<Memo[]>(STORAGE_KEYS.MEMOS, []));
  const [cookbook, setCookbook] = useState<CookbookEntry[]>(() =>
    readLS<CookbookEntry[]>(STORAGE_KEYS.COOKBOOK, [])
  );

  const personalizationHints = useMemo(
    () => buildPersonalization(memos, cookbook),
    [memos, cookbook]
  );

  useEffect(() => {
    writeLS(STORAGE_KEYS.INGREDIENTS, ingredients);
  }, [ingredients]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.INGREDIENT_LIBRARY, ingredientLibrary);
  }, [ingredientLibrary]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.PROMPT, prompt);
  }, [prompt]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.COOK_MODE, cookMode);
  }, [cookMode]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.WRITING_STYLE, writingStyle);
  }, [writingStyle]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.COOK_RESULT, cookResult);
  }, [cookResult]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.ACTIVE_SESSION, activeSession);
  }, [activeSession]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.MEMOS, memos);
  }, [memos]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.COOKBOOK, cookbook);
  }, [cookbook]);

  const ensureLibrary = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIngredientLibrary((prev) => {
      if (prev.some((item) => item === trimmed)) return prev;
      return [trimmed, ...prev];
    });
  }, []);

  const addIngredient = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
      setIngredients((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, text: trimmed, icon },
      ]);
      ensureLibrary(trimmed);
    },
    [ensureLibrary]
  );

  const addIngredientFromLibrary = useCallback(
    (text: string) => {
      addIngredient(text);
    },
    [addIngredient]
  );

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setPrompt = useCallback((val: string) => setPromptState(val), []);
  const setCookMode = useCallback((mode: CookMode) => setCookModeState(mode), []);
  const setWritingStyle = useCallback(
    (style: WritingStyle) => setWritingStyleState(style),
    []
  );

  const setCookResult = useCallback((result: CookResult | null) => {
    setCookResultState(result);
  }, []);

  const prepareCookSession = useCallback(
    (payload: {
      ingredientsUsed: Ingredient[];
      promptUsed: string;
      modeUsed: CookMode;
      styleUsed: WritingStyle;
    }) => {
      setActiveSession({
        ...payload,
        seasonings: [],
        createdAt: Date.now(),
      });
    },
    []
  );

  const addSeasoningToSession = useCallback((seasoning: string) => {
    const trimmed = seasoning.trim();
    if (!trimmed) return;
    setActiveSession((prev) => {
      if (!prev) return prev;
      return { ...prev, seasonings: [...prev.seasonings, trimmed] };
    });
  }, []);

  const addMemo = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMemos((prev) => [
      { id: `${Date.now()}-${Math.random()}`, text: trimmed, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const removeMemo = useCallback((id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMemo = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, text: trimmed } : m)));
  }, []);

  const useAsIngredient = useCallback(
    (memo: Memo) => {
      addIngredient(memo.text);
    },
    [addIngredient]
  );

  const addToCookbook = useCallback(() => {
    setCookResultState((currentResult) => {
      if (!currentResult) return currentResult;
      setCookbook((prev) => {
        // `activeSession` stays current because this callback depends on it.
        const snapshot = activeSession;
        return [
          {
            id: `${Date.now()}-${Math.random()}`,
            result: currentResult,
            ingredients: snapshot?.ingredientsUsed ?? ingredients,
            prompt: snapshot?.promptUsed ?? prompt,
            style: snapshot?.styleUsed,
            seasonings: snapshot?.seasonings ?? [],
            createdAt: Date.now(),
          },
          ...prev,
        ];
      });
      return currentResult;
    });
  }, [activeSession, ingredients, prompt]);

  const removeFromCookbook = useCallback((id: string) => {
    setCookbook((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ingredients,
        ingredientLibrary,
        addIngredient,
        addIngredientFromLibrary,
        removeIngredient,
        prompt,
        setPrompt,
        cookMode,
        setCookMode,
        writingStyle,
        setWritingStyle,
        cookResult,
        setCookResult,
        activeSession,
        prepareCookSession,
        addSeasoningToSession,
        personalizationHints,
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
