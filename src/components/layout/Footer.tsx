import { Link } from "react-router-dom";
import { TOOLS } from "../../data/toolRegistry";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tools</h2>
            <ul className="mt-3 space-y-1.5">
              {TOOLS.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-slate-600 hover:text-emerald-700">
                    {tool.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Guides</h2>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link to="/guides/how-mongodb-objectid-works/" className="text-sm text-slate-600 hover:text-emerald-700">
                  How MongoDB ObjectId works
                </Link>
              </li>
              <li>
                <Link to="/guides/mongodb-connection-string/" className="text-sm text-slate-600 hover:text-emerald-700">
                  Anatomy of a MongoDB connection string
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Site</h2>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link to="/about/" className="text-sm text-slate-600 hover:text-emerald-700">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy/" className="text-sm text-slate-600 hover:text-emerald-700">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms/" className="text-sm text-slate-600 hover:text-emerald-700">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs leading-5 text-slate-500">
          All tools process your data locally in your browser. Nothing you paste is uploaded,
          logged, or shared. MongoDB Tools is an independent project and is not affiliated with
          or endorsed by MongoDB, Inc. MongoDB&reg; is a registered trademark of MongoDB, Inc.
        </p>
      </div>
    </footer>
  );
}
