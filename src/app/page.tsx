"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, type CookMode, type WritingStyle } from "./providers";
import BottomNav from "./components/BottomNav";

const COOK_MODES: { mode: CookMode; icon: string; label: string }[] = [
  { mode: "prep", icon: "content_cut", label: "재료 손질" },
  { mode: "mealkit", icon: "package_2", label: "밀키트" },
  { mode: "fullcook", icon: "skillet", label: "요리" },
];

const WRITING_STYLES: {
  style: WritingStyle;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { style: "balanced", icon: "tune", label: "균형", desc: "명확한 전개" },
  { style: "lyrical", icon: "spa", label: "서정", desc: "감각적 문장" },
  { style: "noir", icon: "dark_mode", label: "느와르", desc: "긴장과 그림자" },
  { style: "classic", icon: "history_edu", label: "고전", desc: "문어체 밀도" },
];

export default function KitchenPage() {
  const {
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
    setCookResult,
    prepareCookSession,
    personalizationHints,
    isLoading,
    setIsLoading,
  } = useApp();

  const [addPanel, setAddPanel] = useState<"none" | "choice" | "library" | "new">(
    "none"
  );
  const [newIngredient, setNewIngredient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (addPanel === "new" && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [addPanel]);

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return;
    addIngredient(newIngredient.trim());
    setNewIngredient("");
    setAddPanel("none");
  };

  const handleCook = async () => {
    if (ingredients.length === 0 && !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      prepareCookSession({
        ingredientsUsed: [...ingredients],
        promptUsed: prompt,
        modeUsed: cookMode,
        styleUsed: writingStyle,
      });

      const res = await fetch("/api/cook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients.map((i) => i.text),
          prompt,
          mode: cookMode,
          style: writingStyle,
          personalization: personalizationHints,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "요리에 실패했습니다. 다시 시도해주세요.");
      }

      const result = await res.json();
      setCookResult(result);
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden">
      <div className="kitchen-bg h-screen flex flex-col max-w-md mx-auto w-full relative shadow-2xl overflow-hidden">
        <div className="pointer-events-none absolute inset-0 sun-glare" />

        <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-white/70 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-300/30 flex items-center justify-center text-amber-500 shadow-sm border border-white">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sunny
              </span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                작가의 냉장고
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Morning Inspiration
              </p>
            </div>
          </div>
          <Link
            href="/chef"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 border border-white shadow-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </header>

        <main className="relative z-10 p-3 space-y-3 flex-1 overflow-hidden flex flex-col pb-24">
          <section className="retro-fridge rounded-[1.8rem] overflow-hidden border-4 border-white shadow-xl relative">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
            <div className="p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">
                    kitchen
                  </span>
                  <h2 className="font-bold text-sm text-slate-700">식료품 냉장칸</h2>
                </div>
                <span className="text-[10px] font-bold bg-white text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                  {ingredients.length}개 보관 중
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {ingredients.map((ingredient, index) => (
                  <button
                    key={ingredient.id}
                    onClick={() => removeIngredient(ingredient.id)}
                    className={`ingredient-chip ingredient-tone-${index % 4}`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {ingredient.icon}
                    </span>
                    <p className="text-xs font-bold">{ingredient.text}</p>
                  </button>
                ))}

                {addPanel === "choice" && (
                  <div className="flex h-9 items-center gap-2">
                    <button
                      onClick={() => setAddPanel("library")}
                      className="h-9 rounded-full bg-emerald-100 border border-emerald-200 px-4 text-xs font-bold text-emerald-700"
                    >
                      냉장고에서 꺼내기
                    </button>
                    <button
                      onClick={() => setAddPanel("new")}
                      className="h-9 rounded-full bg-amber-100 border border-amber-200 px-4 text-xs font-bold text-amber-700"
                    >
                      새로 입력하기
                    </button>
                  </div>
                )}

                {addPanel === "library" && (
                  <div className="w-full rounded-2xl bg-white/80 border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-slate-600">보관 재료 선택</p>
                      <button
                        onClick={() => setAddPanel("choice")}
                        className="text-[11px] text-slate-400"
                      >
                        뒤로
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                      {ingredientLibrary
                        .filter(
                          (item) => !ingredients.some((current) => current.text === item)
                        )
                        .slice(0, 18)
                        .map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              addIngredientFromLibrary(item);
                              setAddPanel("none");
                            }}
                            className="text-xs px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                          >
                            {item}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {addPanel === "new" ? (
                  <div className="flex h-9 items-center gap-2">
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddIngredient();
                        if (e.key === "Escape") {
                          setAddPanel("none");
                          setNewIngredient("");
                        }
                      }}
                      onBlur={() => {
                        if (!newIngredient.trim()) {
                          setAddPanel("none");
                          setNewIngredient("");
                        }
                      }}
                      className="h-9 rounded-full bg-white border border-amber-200 px-4 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 w-36"
                      placeholder="재료 입력"
                    />
                    <button
                      onClick={handleAddIngredient}
                      className="h-9 rounded-full bg-amber-300/30 border border-amber-300 px-3 text-xs font-bold text-amber-700 hover:bg-amber-300/40 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddPanel("choice")}
                    className="flex h-9 items-center justify-center gap-x-2 rounded-full border-2 border-dashed border-slate-200 px-4 hover:border-amber-300 transition-colors text-slate-400 hover:text-amber-500 bg-white/70"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <p className="text-xs font-bold">새 재료</p>
                  </button>
                )}
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full shadow-inner border border-white" />
          </section>

          <section className="space-y-2 pt-0.5">
            <div className="flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-amber-500 text-lg">
                skillet
              </span>
              <h2 className="text-sm font-extrabold text-slate-800">요리 방식</h2>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {COOK_MODES.map(({ mode, icon, label }) => {
                const isActive = cookMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setCookMode(mode)}
                    className={`rounded-xl py-2 px-1 border transition-all flex flex-col items-center gap-1 ${
                      isActive
                        ? "bg-amber-300 text-slate-800 border-amber-200 shadow-md"
                        : "bg-white/90 text-slate-500 border-white hover:border-amber-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{icon}</span>
                    <span className="text-[11px] font-bold">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2 pt-0.5">
            <div className="flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-amber-500 text-lg">
                style
              </span>
              <h2 className="text-sm font-extrabold text-slate-800">문체 프로필</h2>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {WRITING_STYLES.map(({ style, icon, label, desc }) => {
                const isActive = writingStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => setWritingStyle(style)}
                    className={`rounded-xl py-2 px-2.5 border transition-all text-left ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm"
                        : "bg-white/90 text-slate-500 border-white hover:border-emerald-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">{icon}</span>
                      <span className="text-[11px] font-extrabold">{label}</span>
                    </div>
                    <p className="text-[10px] mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2 flex-1 min-h-0">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">믹싱 볼</h2>
              <span className="material-symbols-outlined text-amber-500">restaurant</span>
            </div>

            <div className="wood-counter rounded-2xl p-1 shadow-lg h-full min-h-0">
              <div className="bg-white/95 rounded-2xl border border-white shadow-inner p-3 h-full min-h-0 flex flex-col">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">스토리 재료 입력</span>
                  <span className="text-[10px] text-slate-400">터치 후 바로 작성</span>
                </div>
                <div className="flex-1 min-h-0 rounded-xl border-2 border-amber-200 bg-white px-3 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="h-full w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-800 text-base font-medium placeholder:text-slate-400 resize-none p-0 min-h-[96px]"
                    placeholder="줄거리 단서나 문장을 넣어주세요. AI가 하나의 요리처럼 이야기로 완성해요."
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex -space-x-1">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-xs text-orange-600">
                        liquor
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-xs text-green-600">
                        set_meal
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    향신료 추가됨
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center pt-1 pb-0">
            <button
              onClick={handleCook}
              disabled={isLoading || (ingredients.length === 0 && !prompt.trim())}
              className="relative group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div
                className={`w-20 h-20 bg-amber-300 rounded-full shadow-xl shadow-amber-300/30 flex items-center justify-center text-white border-4 border-white transition-transform active:scale-95 group-hover:scale-105 ${
                  isLoading ? "animate-pulse" : ""
                }`}
              >
                <span
                  className={`material-symbols-outlined text-4xl font-light ${
                    isLoading ? "animate-spin-slow" : ""
                  }`}
                >
                  {isLoading ? "autorenew" : "timer"}
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-50 whitespace-nowrap">
                <span className="text-xs font-black uppercase tracking-widest text-slate-800">
                  {isLoading ? "요리 중" : "AI로 요리"}
                </span>
              </div>
            </button>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isLoading ? "잠시만 기다려주세요" : "예상 15초"}
            </p>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
