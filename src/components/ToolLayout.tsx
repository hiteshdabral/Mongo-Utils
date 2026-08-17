import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import PrivacyNotice from "./PrivacyNotice";

export interface ToolSection {
  title: string;
  body: ReactNode;
}

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export interface RelatedTool {
  title: string;
  path: string;
  description: string;
}

interface ToolLayoutProps {
  title: string;
  description: string;
  /** Show the "processed locally" privacy notice (true for all client-side tools). */
  privacy?: boolean;
  children: ReactNode;
  howItWorks?: ToolSection[];
  commonUses?: string[];
  faqs?: FaqItem[];
  relatedTools?: RelatedTool[];
}

export default function ToolLayout({
  title,
  description,
  privacy = true,
  children,
  howItWorks,
  commonUses,
  faqs,
  relatedTools,
}: ToolLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-base text-slate-600">{description}</p>
      </header>

      {privacy && <div className="mb-5"><PrivacyNotice /></div>}

      <div className="space-y-5">{children}</div>

      {howItWorks && howItWorks.length > 0 && (
        <section aria-labelledby="how-it-works" className="mt-12">
          <h2 id="how-it-works" className="text-xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-3 space-y-4">
            {howItWorks.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-slate-800">{section.title}</h3>
                <div className="prose-p mt-1 text-sm leading-6 text-slate-600">{section.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {commonUses && commonUses.length > 0 && (
        <section aria-labelledby="common-uses" className="mt-10">
          <h2 id="common-uses" className="text-xl font-bold text-slate-900">
            Common use cases
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
            {commonUses.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </section>
      )}

      {faqs && faqs.length > 0 && (
        <section aria-labelledby="faq" className="mt-10">
          <h2 id="faq" className="text-xl font-bold text-slate-900">
            FAQ
          </h2>
          <div className="mt-3 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-slate-800">{faq.question}</h3>
                <div className="prose-p mt-1 text-sm leading-6 text-slate-600">{faq.answer}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedTools && relatedTools.length > 0 && (
        <section aria-labelledby="related-tools" className="mt-10">
          <h2 id="related-tools" className="text-xl font-bold text-slate-900">
            Related MongoDB tools
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {relatedTools.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="block h-full rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
                >
                  <span className="font-semibold text-emerald-700">{tool.title}</span>
                  <span className="mt-1 block text-sm text-slate-600">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
