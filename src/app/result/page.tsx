"use client";

import { useApp } from "../providers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";

export default function ResultPage() {
  const { cookResult, ingredients, addToCookbook, setCookResult } = useApp();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!cookResult) {
      router.replace("/");
    }
  }, [cookResult, router]);

  if (!cookResult) return null;

  const mode = cookResult.mode || "mealkit";

  const handleSave = () => {
    addToCookbook();
    setSaved(true);
  };

  const handleEdit = () => {
    if (mode === "fullcook") {
      setEditText(cookResult.synopsis || "");
    } else {
      setEditText(cookResult.premise || "");
    }
    setEditing(true);
  };

  const handleEditSave = () => {
    if (mode === "fullcook") {
      setCookResult({ ...cookResult, synopsis: editText });
    } else {
      setCookResult({ ...cookResult, premise: editText });
    }
    setEditing(false);
  };

  const handleShare = async () => {
    const shareText = `${cookResult.title}\n\n${cookResult.premise || cookResult.synopsis || ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: cookResult.title, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

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
          <button
            onClick={handleShare}
            className="text-slate-100 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">
              {copied ? "check" : "share"}
            </span>
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

        {/* ── Mode Badge ── */}
        <div className="flex justify-center">
          <span className="text-[10px] font-bold bg-primary/20 text-primary px-3 py-1 rounded-full">
            {mode === "prep" && "재료 손질"}
            {mode === "mealkit" && "밀키트"}
            {mode === "fullcook" && "요리"}
          </span>
        </div>

        {/* ── PREP Layout ── */}
        {mode === "prep" && (
          <div className="bg-neutral-green/20 border border-neutral-green/40 rounded-3xl p-4 shadow-2xl relative overflow-hidden space-y-4">
            {/* Title & Premise */}
            <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-xl">
                  content_cut
                </span>
                <h3 className="font-bold text-primary tracking-tight">
                  {cookResult.title}
                </h3>
              </div>
              <p className="text-slate-200 text-base leading-relaxed italic">
                &ldquo;{cookResult.premise}&rdquo;
              </p>
            </div>

            {/* Keywords */}
            {cookResult.keywords && cookResult.keywords.length > 0 && (
              <div className="bg-surface/60 border border-neutral-green/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary/70 text-lg">
                    label
                  </span>
                  <span className="text-xs font-bold uppercase text-primary/70">
                    키워드
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cookResult.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-700/80 text-slate-200 px-3 py-1 rounded-full border border-slate-600"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Twist */}
            {cookResult.secretSauce && (
              <div className="bg-surface/60 border border-neutral-green/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary/70 text-lg">
                    auto_fix_high
                  </span>
                  <span className="text-xs font-bold uppercase text-primary/70">
                    반전
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-tight">
                  {cookResult.secretSauce}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── MEALKIT Layout (existing bento) ── */}
        {(!cookResult.mode || mode === "mealkit") && (
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
                {cookResult.plotPoints && (
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
                )}
              </div>

              {/* Atmosphere */}
              {cookResult.atmosphere && (
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
              )}

              {/* Secret Sauce */}
              {cookResult.secretSauce && (
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
              )}
            </div>
          </div>
        )}

        {/* ── FULLCOOK Layout ── */}
        {mode === "fullcook" && (
          <div className="bg-neutral-green/20 border border-neutral-green/40 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
            <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">
                  skillet
                </span>
                <h3 className="font-bold text-primary tracking-tight text-lg">
                  {cookResult.title}
                </h3>
              </div>
              <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
                {cookResult.synopsis}
              </p>
            </div>
          </div>
        )}

        {/* ── Edit Section ── */}
        {editing && (
          <div className="bg-slate-800 border border-primary/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                ink_pen
              </span>
              <span className="text-sm font-bold text-slate-200">
                가니쉬 편집
              </span>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-slate-700 rounded-lg border border-slate-600 p-3 text-sm text-slate-100 focus:outline-none focus:border-primary resize-none min-h-[120px]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-slate-400 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                className="text-xs text-slate-900 font-bold px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-4 gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`size-14 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform ${
                saved
                  ? "bg-surface border-2 border-primary/30 text-primary"
                  : "bg-primary text-background-dark shadow-primary/20"
              }`}
            >
              <span className="material-symbols-outlined">
                {saved ? "check" : "menu_book"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {saved ? "저장됨!" : "요리책에 저장"}
            </span>
          </button>
          <button
            onClick={handleEdit}
            disabled={editing}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="size-14 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center text-primary group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">ink_pen</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              가니쉬 편집
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="size-14 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center text-primary group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">
                {copied ? "check" : "share"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {copied ? "복사됨!" : "공유"}
            </span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="size-14 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center text-primary group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined">refresh</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              다시 요리
            </span>
          </button>
        </div>
      </main>

      <BottomNav variant="result" />
    </div>
  );
}
