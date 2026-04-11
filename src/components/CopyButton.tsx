"use client";

export default function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="font-mono text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md hover:text-zinc-300 hover:border-zinc-700 transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
      }}
    >
      Copy
    </button>
  );
}
