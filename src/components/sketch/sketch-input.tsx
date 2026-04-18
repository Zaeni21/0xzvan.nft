import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface SketchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SketchInput({ label, className = "", ...props }: SketchInputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="sketch-text text-sm font-medium">{label}</label>}
      <input className={`w-full border-2 border-black px-4 py-2 sketch-text bg-white focus:outline-none ${className}`} {...props} />
    </div>
  );
}

interface SketchTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function SketchTextarea({ label, className = "", ...props }: SketchTextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="sketch-text text-sm font-medium">{label}</label>}
      <textarea className={`w-full border-2 border-black px-4 py-2 sketch-text bg-white focus:outline-none resize-none ${className}`} {...props} />
    </div>
  );
}
