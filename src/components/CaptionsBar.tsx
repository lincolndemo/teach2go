"use client";

export default function CaptionsBar({ text }: { text: string }) {
  return (
    <div className="min-h-[3.5rem] rounded bg-slate-100 px-4 py-2 text-sm leading-relaxed text-slate-800">
      {text || <span className="text-slate-400">Captions appear here…</span>}
    </div>
  );
}
