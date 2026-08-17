import { useId } from "react";

interface InputEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  /** Invoked on Cmd/Ctrl+Enter — a quick "run" shortcut. */
  onRun?: () => void;
  autoFocus?: boolean;
}

export default function InputEditor({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  onRun,
  autoFocus,
}: InputEditorProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        autoFocus={autoFocus}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onRun?.();
          }
        }}
        className="code-scroll w-full resize-y rounded-lg border border-slate-300 bg-slate-900 p-3 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
      />
      {onRun && (
        <p className="mt-1 text-xs text-slate-500">Tip: press Cmd/Ctrl + Enter to run.</p>
      )}
    </div>
  );
}
