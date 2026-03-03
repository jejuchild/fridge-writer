"use client";

import { useState } from "react";
import BottomNav from "../components/BottomNav";

export default function ChefPage() {
  const [cleared, setCleared] = useState(false);

  const handleClearAll = () => {
    if (confirm("모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      localStorage.removeItem("fridge-writer-ingredients");
      localStorage.removeItem("fridge-writer-prompt");
      localStorage.removeItem("fridge-writer-cookmode");
      localStorage.removeItem("fridge-writer-writingstyle");
      localStorage.removeItem("fridge-writer-memos");
      localStorage.removeItem("fridge-writer-cookbook");
      setCleared(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-slate-900 relative shadow-2xl overflow-y-auto pb-28">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">셰프 프로필</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              설정 및 정보
            </p>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* ── App Info ── */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 p-6 text-center fridge-texture">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">cooking</span>
            </div>
            <h2 className="text-xl font-extrabold">작가의 냉장고</h2>
            <p className="text-xs text-slate-400 mt-1">스마트 냉장고 OS v2.0</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              AI가 당신의 재료(단어, 문장, 아이디어)로<br />
              이야기를 요리합니다.
            </p>
          </section>

          {/* ── Cooking Modes Info ── */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
            <div className="bg-slate-700/50 p-3 border-b border-slate-700">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">restaurant_menu</span>
                요리 방식 안내
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">content_cut</span>
                <div>
                  <p className="text-sm font-bold text-slate-200">재료 손질</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    가볍게 아이디어만 던져줍니다. 제목, 한 줄 전제, 핵심 키워드.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">package_2</span>
                <div>
                  <p className="text-sm font-bold text-slate-200">밀키트</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    기승전결을 갖춘 구조화된 아이디어. 줄거리 포인트, 분위기, 반전 포함.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">skillet</span>
                <div>
                  <p className="text-sm font-bold text-slate-200">요리</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    900~1500자의 긴 완성형 서사. 기승전결이 모두 담긴 한 편의 글로 완성합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── AI Info ── */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
              <h3 className="font-bold text-sm">AI 엔진</h3>
            </div>
            <p className="text-xs text-slate-400">
              Qwen3-32B · Groq 초고속 추론 엔진
            </p>
          </section>

          {/* ── Data Management ── */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">storage</span>
              <h3 className="font-bold text-sm">데이터 관리</h3>
            </div>
            <p className="text-xs text-slate-500">
              모든 데이터는 브라우저 로컬 저장소에 저장됩니다.
            </p>
            <button
              onClick={handleClearAll}
              disabled={cleared}
              className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-400 text-xs font-bold hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {cleared ? "초기화 완료" : "모든 데이터 초기화"}
            </button>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
