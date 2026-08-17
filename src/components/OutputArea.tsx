import { useId } from "react";
import { downloadText } from "../lib/clipboard";
import Button from "./Button";
import CopyButton from "./CopyButton";

interface OutputAreaProps {
  label: string;
  value: string;
  placeholder?: string;
  downloadName?: string;
}

export default function OutputArea({
  label,
  value,
  placeholder = "Output will appear here.",
  downloadName = "output.txt",
}: OutputAreaProps) {
  const id = useId();
  const hasOutput = value !== "";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="!px-2.5 !py-1.5 !text-xs"
            disabled={!hasOutput}
            onClick={() => downloadText(downloadName, value)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download
          </Button>
          <CopyButton text={value} disabled={!hasOutput} label="Copy" />
        </div>
      </div>
      <textarea
        id={id}
        readOnly
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        className="code-scroll w-full resize-y rounded-lg border border-slate-300 bg-slate-900 p-3 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
        rows={10}
      />
    </div>
  );
}
