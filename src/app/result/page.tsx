"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../providers";
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
        await navigator.share({
          title: cookResult.title,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      return;
    }
  };

  return (
    <div className="wood-table relative min-h-screen w-full flex flex-col items-center overflow-x-hidden text-slate-800">
      <div className="absolute -top-8 -left-20 w-64 h-96 dish-towel opacity-40 rotate-12 -z-10 rounded-3xl" />

      <header className="w-full max-w-md px-6 py-6 flex justify-between items-center z-10">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="text-center">
          <h1 className="text-2xl tracking-tight text-slate-900 font-extrabold">오늘의 서빙</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
            Freshly Cooked Ideas
          </p>
        </div>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">{copied ? "check" : "share"}</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-md px-6 flex flex-col items-center pb-28">
        <div className="ceramic-plate bg-white rounded-[3rem] w-full p-7 space-y-6">
          <div className="flex justify-center">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {mode === "prep" && "재료 손질"}
              {mode === "mealkit" && "밀키트"}
              {mode === "fullcook" && "요리"}
            </span>
          </div>

          {mode === "prep" && (
            <div className="space-y-4 text-center">
              <h2 className="text-3xl leading-tight text-slate-900 font-extrabold">
                {cookResult.title}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-light italic">
                {cookResult.premise}
              </p>
              {cookResult.keywords && cookResult.keywords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {cookResult.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              {cookResult.secretSauce && (
                <div className="rounded-2xl bg-rose-50 p-4 text-left">
                  <p className="text-[10px] font-bold uppercase text-rose-500 mb-1">
                    반전 재료
                  </p>
                  <p className="text-sm text-slate-600">{cookResult.secretSauce}</p>
                </div>
              )}
            </div>
          )}

          {(!cookResult.mode || mode === "mealkit") && (
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <h2 className="text-3xl leading-tight text-slate-900 font-extrabold">
                  {cookResult.title}
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed font-light italic">
                  {cookResult.premise}
                </p>
              </div>

              {cookResult.plotPoints && cookResult.plotPoints.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  {cookResult.plotPoints.map((point, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-bold text-emerald-600 mt-1">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm text-slate-600">{point}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-[10px] font-bold uppercase text-sky-600 mb-1">
                    분위기
                  </p>
                  <p className="text-xs text-slate-600">{cookResult.atmosphere}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-[10px] font-bold uppercase text-rose-600 mb-1">
                    비밀 소스
                  </p>
                  <p className="text-xs text-slate-600">{cookResult.secretSauce}</p>
                </div>
              </div>
            </div>
          )}

          {mode === "fullcook" && (
            <div className="space-y-4">
              <h2 className="text-3xl leading-tight text-slate-900 font-extrabold text-center">
                {cookResult.title}
              </h2>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-[15px] text-slate-700 leading-8 whitespace-pre-wrap">
                  {cookResult.synopsis}
                </p>
              </div>
            </div>
          )}

          {editing && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 min-h-[130px] focus:outline-none focus:border-emerald-400 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-500"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-400 text-white"
                >
                  저장
                </button>
              </div>
            </div>
          )}

          <div className="-rotate-2">
            <div className="bg-white p-5 shadow-lg border-b-2 border-slate-200">
              <div className="text-center border-b border-dashed border-slate-200 pb-3 mb-3">
                <p className="font-mono text-[10px] font-bold">재료 체크리스트</p>
              </div>
              <ul className="font-mono text-[10px] space-y-1.5 text-slate-500">
                {ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex justify-between">
                    <span>+ {ingredient.text}</span>
                    <span>x1</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between font-mono text-xs font-bold text-slate-900">
                <span>복잡도</span>
                <span>{cookResult.complexity}/10</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-6 flex justify-around items-center z-20">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saved}
              className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-rose-500">
                {saved ? "check" : "favorite"}
              </span>
            </button>
            <span className="text-[10px] font-bold text-slate-600 uppercase">
              {saved ? "저장됨" : "저장"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 -mt-8">
            <button
              onClick={() => router.push("/")}
              className="w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center shadow-xl border-4 border-white active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-white text-4xl">
                refresh
              </span>
            </button>
            <span className="text-[10px] font-bold text-slate-800 uppercase">다시 요리</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleEdit}
              className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sky-500">edit_note</span>
            </button>
            <span className="text-[10px] font-bold text-slate-600 uppercase">가니쉬</span>
          </div>
        </div>
      </main>

      <BottomNav variant="result" />
    </div>
  );
}
