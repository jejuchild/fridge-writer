"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "./providers";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function KitchenPage() {
  const {
    ingredients,
    addIngredient,
    removeIngredient,
    prompt,
    setPrompt,
    setCookResult,
    isLoading,
    setIsLoading,
  } = useApp();

  const [showAddInput, setShowAddInput] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      addIngredient(newIngredient.trim());
      setNewIngredient("");
      setShowAddInput(false);
    }
  };

  const handleCook = async () => {
    if (ingredients.length === 0 && !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients.map((i) => i.text),
          prompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || "요리에 실패했습니다. 다시 시도해주세요."
        );
      }

      const result = await res.json();
      setCookResult(result);
      router.push("/result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-slate-900 relative shadow-2xl overflow-y-auto pb-28">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">
                cooking
              </span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                작가의 냉장고
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                스마트 냉장고 OS v2.0
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>

        <main className="p-4 space-y-6">
          {/* ── Pantry Ingredients ── */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 shadow-sm overflow-hidden fridge-texture">
            <div className="bg-slate-700/50 p-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  inventory_2
                </span>
                <h2 className="font-bold text-sm">식료품 저장소</h2>
              </div>
              <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {ingredients.length}개 재료
              </span>
            </div>

            <div className="p-3 flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  onClick={() => removeIngredient(ingredient.id)}
                  className="group flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-700/80 border border-slate-600 px-3 hover:border-red-500/50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-primary group-hover:text-red-400 transition-colors">
                    {ingredient.icon}
                  </span>
                  <p className="text-xs font-semibold leading-normal">
                    {ingredient.text}
                  </p>
                  <span className="material-symbols-outlined text-xs text-slate-500 group-hover:text-red-400 hidden group-hover:inline transition-colors">
                    close
                  </span>
                </div>
              ))}

              {showAddInput ? (
                <div className="flex h-8 items-center gap-2">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddIngredient();
                      if (e.key === "Escape") {
                        setShowAddInput(false);
                        setNewIngredient("");
                      }
                    }}
                    onBlur={() => {
                      if (!newIngredient.trim()) {
                        setShowAddInput(false);
                        setNewIngredient("");
                      }
                    }}
                    className="h-8 rounded-lg bg-slate-700 border border-primary/50 px-3 text-xs font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary w-36"
                    placeholder="재료 입력..."
                  />
                  <button
                    onClick={handleAddIngredient}
                    className="h-8 rounded-lg bg-primary/20 text-primary px-3 text-xs font-bold hover:bg-primary/30 transition-colors"
                  >
                    추가
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="flex h-8 items-center justify-center gap-x-2 rounded-lg border-2 border-dashed border-slate-600 px-3 hover:border-primary transition-colors text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">
                    add
                  </span>
                  <p className="text-xs font-bold">새 재료 추가</p>
                </button>
              )}
            </div>
          </section>

          {/* ── Mixing Bowl ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold tracking-tight">레시피 입력</h2>
              <span className="material-symbols-outlined text-slate-400">
                restaurant_menu
              </span>
            </div>

            <div className="relative">
              <div className="absolute -top-4 left-4 z-10 bg-slate-700 px-3 py-1 rounded-t-lg border-t border-l border-r border-slate-600">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  믹싱 볼
                </span>
              </div>
              <div className="rounded-2xl bg-slate-800 border-2 border-slate-700 shadow-inner p-6 pt-8 min-h-[220px] flex flex-col fridge-texture">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-100 text-lg font-medium placeholder:text-slate-600 resize-none p-0"
                  placeholder="여기에 메인 줄거리를 입력하세요... 새로운 세계를 요리해봅시다."
                />
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center border-2 border-slate-800">
                      <span className="material-symbols-outlined text-xs text-blue-300">
                        style
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center border-2 border-slate-800">
                      <span className="material-symbols-outlined text-xs text-purple-300">
                        mood
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    창의력 한 스푼 추가됨
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Error ── */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* ── Cook Button ── */}
          <div className="flex items-center justify-center py-4 pb-8">
            <button
              onClick={handleCook}
              disabled={
                isLoading || (ingredients.length === 0 && !prompt.trim())
              }
              className="group relative flex flex-col items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div
                className={`w-24 h-24 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-slate-900 transition-transform active:scale-95 hover:scale-105 border-4 border-slate-900 ${isLoading ? "animate-pulse" : ""}`}
              >
                <span
                  className={`material-symbols-outlined text-5xl font-light ${isLoading ? "animate-spin-slow" : ""}`}
                >
                  {isLoading ? "autorenew" : "chef_hat"}
                </span>
              </div>
              <div className="bg-primary px-4 py-1.5 rounded-full shadow-md -mt-4 z-10 border-2 border-slate-900">
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                  {isLoading ? "요리 중..." : "AI로 요리하기"}
                </span>
              </div>
              <div className="absolute -bottom-8 w-full text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {isLoading ? "잠시만 기다려주세요" : "예상 시간: 15초"}
                </p>
              </div>
            </button>
          </div>
        </main>

        {/* ── Green glow ── */}
        <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
          <div className="w-32 h-32 bg-primary blur-3xl rounded-full" />
        </div>
        <div className="absolute bottom-40 left-0 p-4 pointer-events-none opacity-10">
          <div className="w-48 h-48 bg-primary blur-3xl rounded-full" />
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto flex gap-2 border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 pb-8 pt-3">
          <Link
            className="flex flex-1 flex-col items-center justify-center gap-1 text-primary"
            href="/"
          >
            <div className="flex h-8 items-center justify-center">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                kitchen
              </span>
            </div>
            <p className="text-[10px] font-bold leading-normal tracking-wider uppercase">
              주방
            </p>
          </Link>
          <a
            className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-500"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <p className="text-[10px] font-bold leading-normal tracking-wider uppercase">
              식료품
            </p>
          </a>
          <a
            className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-500"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <p className="text-[10px] font-bold leading-normal tracking-wider uppercase">
              요리책
            </p>
          </a>
          <a
            className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-500"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
            <p className="text-[10px] font-bold leading-normal tracking-wider uppercase">
              셰프
            </p>
          </a>
        </div>
      </nav>
    </div>
  );
}
