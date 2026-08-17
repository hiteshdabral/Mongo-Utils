import { useId } from "react";

interface ExampleSelectorProps {
  label: string;
  examples: { name: string; value: string }[];
  onSelect: (value: string) => void;
}

export default function ExampleSelector({ label, examples, onSelect }: ExampleSelectorProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <select
        id={id}
        defaultValue=""
        onChange={(event) => {
          if (event.target.value !== "") onSelect(event.target.value);
          event.target.value = "";
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
      >
        <option value="" disabled>
          Load example…
        </option>
        {examples.map((example) => (
          <option key={example.name} value={example.value}>
            {example.name}
          </option>
        ))}
      </select>
    </div>
  );
}
