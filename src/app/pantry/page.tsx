"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "../providers";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function PantryPage() {
  const { memos, addMemo, removeMemo, updateMemo, useAsIngredient: convertToIngredient } = useApp();
  const [newMemo, setNewMemo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleAdd = () => {
    if (newMemo.trim()) {
      addMemo(newMemo.trim());
      setNewMemo("");
    }
  };

  const handleConvertToIngredient = (memo: typeof memos[0]) => {
    convertToIngredient(memo);
    router.push("/");
  };

  const startEdit = (memo: typeof memos[0]) => {
    setEditingId(memo.id);
    setEditText(memo.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateMemo(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-slate-900 relative shadow-2xl overflow-y-auto pb-28">
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">식료품 저장소</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                아이디어 메모장
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {memos.length}개 메모
          </span>
        </header>

        <main className="p-4 space-y-4">
          {/* ── New Memo Input ── */}
          <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 fridge-texture">
            <textarea
              ref={inputRef}
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-100 text-sm font-medium placeholder:text-slate-600 resize-none p-0 min-h-[60px]"
              placeholder="떠오르는 아이디어, 단어, 문장을 적어두세요..."
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                Shift+Enter로 줄바꿈 · Enter로 저장
              </span>
              <button
                onClick={handleAdd}
                disabled={!newMemo.trim()}
                className="px-4 py-1.5 rounded-full bg-primary text-slate-900 text-xs font-bold disabled:opacity-30 hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
            </div>
          </div>

          {/* ── Memo List ── */}
          {memos.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-700 mb-3 block">
                note_add
              </span>
              <p className="text-sm text-slate-500">아직 메모가 없습니다</p>
              <p className="text-xs text-slate-600 mt-1">
                떠오르는 생각을 자유롭게 적어보세요
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 group hover:border-slate-600 transition-colors"
                >
                  {editingId === memo.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-700 rounded-lg border border-primary/30 p-2 text-sm text-slate-100 focus:outline-none focus:border-primary resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-700"
                        >
                          취소
                        </button>
                        <button
                          onClick={saveEdit}
                          className="text-xs text-primary font-bold px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {memo.text}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">
                          {new Date(memo.createdAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleConvertToIngredient(memo)}
                            className="text-[10px] font-bold text-primary px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">add_circle</span>
                            재료로 사용
                          </button>
                          <button
                            onClick={() => startEdit(memo)}
                            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => removeMemo(memo.id)}
                            className="p-1 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
