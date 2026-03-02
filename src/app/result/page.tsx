"use client";

import { useApp } from "../providers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResultPage() {
  const { cookResult, ingredients } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!cookResult) {
      router.replace("/");
    }
  }, [cookResult, router]);

  if (!cookResult) return null;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden marble-bg">
      {/* ── Header ── */}
      <div className="flex items-center bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 p-4 pb-2 justify-between border-b border-neutral-green/30">
        <button
          onClick={() => router.push("/")}
          className="text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          AI 스토리 요리
        </h2>
        <div className="flex w-10 items-center justify-end">
          <button className="text-slate-100 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 pb-28">
        {/* ── Status ── */}
        <div className="text-center space-y-1">
          <h4 className="text-primary text-sm font-bold uppercase tracking-widest">
            맛있게 드세요!
          </h4>
          <p className="text-slate-400 text-sm">
            당신의 이야기가 완벽하게 요리되었습니다.
          </p>
        </div>

        {/* ── Bento Box ── */}
        <div className="bg-neutral-green/20 border border-neutral-green/40 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-2 gap-3">
            {/* Main Course */}
            <div className="col-span-2 bg-surface border border-primary/20 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-xl">
                  restaurant_menu
                </span>
                <h3 className="font-bold text-primary tracking-tight">
                  {cookResult.title}
                </h3>
              </div>
              <p className="text-slate-200 text-base leading-relaxed italic mb-4">
                &ldquo;{cookResult.premise}&rdquo;
              </p>
              <div className="space-y-3 border-t border-neutral-green pt-3">
                {cookResult.plotPoints.map((point, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-primary font-bold text-xs mt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Atmosphere */}
            <div className="bg-surface/60 border border-neutral-green/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary/70 text-lg">
                  location_on
                </span>
                <span className="text-xs font-bold uppercase text-primary/70">
                  분위기
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">
                {cookResult.atmosphere}
              </p>
            </div>

            {/* Secret Sauce */}
            <div className="bg-surface/60 border border-neutral-green/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary/70 text-lg">
                  auto_fix_high
                </span>
                <span className="text-xs font-bold uppercase text-primary/70">
                  비밀 소스
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">
                {cookResult.secretSauce}
              </p>
            </div>
          </div>
        </div>

        {/* ── Ingredient Receipt ── */}
        <div className="relative max-w-[280px] mx-auto">
          <div className="bg-white text-slate-800 p-6 shadow-xl transform rotate-1 rounded-sm border-t-4 border-dashed border-slate-300">
            <div className="text-center mb-4">
              <p className="text-[10px] font-bold tracking-tighter uppercase border-b border-slate-200 pb-1">
                재료 영수증
              </p>
            </div>
            <ul className="text-[11px] font-mono space-y-2">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex justify-between">
                  <span>[재료] {ingredient.text.toUpperCase()}</span>
                  <span>x1</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-2 border-t border-dotted border-slate-400 flex justify-between font-bold text-xs">
              <span>총 복잡도</span>
              <span>{cookResult.complexity}/10</span>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="w-full h-8 bg-slate-100 flex items-center justify-center opacity-50 overflow-hidden">
                <span className="text-[8px] tracking-[4px] uppercase">
                  |||||||||||||||||||||
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <button className="flex flex-col items-center gap-2 group">
            <div className="size-14 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              요리책에 저장
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="size-14 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center text-primary group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">ink_pen</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              가니쉬 (편집)
            </span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="size-14 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center text-primary group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">refresh</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              다시 요리하기
            </span>
          </button>
        </div>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-md mx-auto flex gap-2 border-t border-neutral-green/50 bg-background-dark/90 backdrop-blur-xl px-4 pb-8 pt-2">
          <Link
            className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400"
            href="/"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">kitchen</span>
            </div>
            <p className="text-[10px] font-medium leading-normal tracking-tight">
              주방
            </p>
          </Link>
          <a
            className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <p className="text-[10px] font-medium leading-normal tracking-tight">
              식료품
            </p>
          </a>
          <a
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                restaurant
              </span>
            </div>
            <p className="text-[10px] font-medium leading-normal tracking-tight">
              서빙됨
            </p>
          </a>
          <a
            className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <p className="text-[10px] font-medium leading-normal tracking-tight">
              요리책
            </p>
          </a>
          <a
            className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400"
            href="#"
          >
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </div>
            <p className="text-[10px] font-medium leading-normal tracking-tight">
              셰프
            </p>
          </a>
        </div>
      </nav>
    </div>
  );
}
