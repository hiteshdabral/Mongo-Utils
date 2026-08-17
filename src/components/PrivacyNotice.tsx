/**
 * Privacy notice shown on every tool that processes data entirely in the
 * browser. Only render this where the claim is actually true.
 */
export default function PrivacyNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span>
        Your data is processed locally in your browser and is not uploaded to our servers.
      </span>
    </p>
  );
}
