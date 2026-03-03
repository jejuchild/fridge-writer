"use client";

import { useState } from "react";
import { useApp, type CookbookEntry } from "../providers";
import BottomNav from "../components/BottomNav";

export default function CookbookPage() {
  const { cookbook, removeFromCookbook } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const modeLabel = (mode: string) => {
    switch (mode) {
      case "prep": return "재료 손질";
      case "mealkit": return "밀키트";
      case "fullcook": return "요리";
      default: return "밀키트";
    }
  };

  const modeIcon = (mode: string) => {
    switch (mode) {
      case "prep": return "content_cut";
      case "mealkit": return "package_2";
      case "fullcook": return "skillet";
      default: return "package_2";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-slate-900 relative shadow-2xl overflow-y-auto pb-28">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">요리책</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                저장된 이야기들
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {cookbook.length}개 요리
          </span>
        </header>

        <main className="p-4 space-y-3">
          {cookbook.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-700 mb-3 block">
                menu_book
              </span>
              <p className="text-sm text-slate-500">아직 저장된 요리가 없습니다</p>
              <p className="text-xs text-slate-600 mt-1">
                AI로 요리한 후 &ldquo;요리책에 저장&rdquo;을 눌러보세요
              </p>
            </div>
          ) : (
            cookbook.map((entry: CookbookEntry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-slate-800/60 border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors"
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined">{modeIcon(entry.result.mode)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-100 truncate">
                        {entry.result.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {entry.result.premise || entry.result.synopsis?.slice(0, 60)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-neutral-green/50 text-primary/70 px-2 py-0.5 rounded-full">
                          {modeLabel(entry.result.mode)}
                        </span>
                        {entry.style && (
                          <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                            {entry.style === "balanced" && "균형"}
                            {entry.style === "lyrical" && "서정"}
                            {entry.style === "noir" && "느와르"}
                            {entry.style === "classic" && "고전"}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600">
                          {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-sm mt-1">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                      {/* Premise */}
                      {entry.result.premise && (
                        <p className="text-sm text-slate-300 italic">
                          &ldquo;{entry.result.premise}&rdquo;
                        </p>
                      )}

                      {/* Synopsis (fullcook) */}
                      {entry.result.synopsis && (
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {entry.result.synopsis}
                        </p>
                      )}

                      {/* Plot Points (mealkit) */}
                      {entry.result.plotPoints && entry.result.plotPoints.length > 0 && (
                        <div className="space-y-2">
                          {entry.result.plotPoints.map((point, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-primary font-bold text-xs mt-0.5">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <p className="text-xs text-slate-400">{point}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Keywords (prep) */}
                      {entry.result.keywords && entry.result.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.result.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Atmosphere & Secret Sauce */}
                      {entry.result.atmosphere && (
                        <div className="text-xs text-slate-500">
                          <span className="text-primary/60 font-bold">분위기</span>{" "}
                          {entry.result.atmosphere}
                        </div>
                      )}
                      {entry.result.secretSauce && (
                        <div className="text-xs text-slate-500">
                          <span className="text-primary/60 font-bold">비밀 소스</span>{" "}
                          {entry.result.secretSauce}
                        </div>
                      )}

                      {/* Ingredients used */}
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700/30">
                        {entry.ingredients.map((ing) => (
                          <span
                            key={ing.id}
                            className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full"
                          >
                            {ing.text}
                          </span>
                        ))}
                      </div>

                      {entry.seasonings && entry.seasonings.length > 0 && (
                        <div className="text-xs text-slate-500">
                          <span className="text-primary/60 font-bold">조미료 히스토리</span>{" "}
                          {entry.seasonings.join(" · ")}
                        </div>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCookbook(entry.id)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
