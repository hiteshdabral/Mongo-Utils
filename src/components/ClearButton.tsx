import Button from "./Button";

interface ClearButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ClearButton({ onClick, disabled }: ClearButtonProps) {
  return (
    <Button variant="ghost" onClick={onClick} disabled={disabled}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </svg>
      Clear
    </Button>
  );
}
