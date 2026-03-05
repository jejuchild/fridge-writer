export type CookMode = "prep" | "mealkit" | "fullcook";

export type WritingStyle = "balanced" | "lyrical" | "noir" | "classic";

export interface Ingredient {
  id: string;
  text: string;
  icon: string;
}

export interface CookResult {
  mode: CookMode;
  style?: WritingStyle;
  title: string;
  premise?: string;
  keywords?: string[];
  plotPoints?: string[];
  atmosphere?: string;
  secretSauce?: string;
  synopsis?: string;
  complexity: number;
}

export interface PersonalizationHints {
  preferredKeywords: string[];
  memoHighlights: string[];
  referencePhrases: string[];
}
