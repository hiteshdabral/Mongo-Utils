import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
      <Seo
        title="Page not found — MongoDB Tools"
        description="The page you were looking for does not exist."
      />
      <p className="font-mono text-sm font-semibold text-emerald-700">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
