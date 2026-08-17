import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ToolsIndexPage = lazy(() => import("./pages/ToolsIndexPage"));
const GuidesIndexPage = lazy(() => import("./pages/guides/GuidesIndexPage"));
const ConnectionStringGuide = lazy(() => import("./pages/guides/ConnectionStringGuide"));
const ObjectIdGuide = lazy(() => import("./pages/guides/ObjectIdGuide"));
const AggregationFormatterPage = lazy(
  () => import("./pages/tools/AggregationFormatterPage")
);
const JsonToMongoosePage = lazy(() => import("./pages/tools/JsonToMongoosePage"));
const ObjectIdTimestampPage = lazy(() => import("./pages/tools/ObjectIdTimestampPage"));
const QueryFormatterPage = lazy(() => import("./pages/tools/QueryFormatterPage"));
const UriParserPage = lazy(() => import("./pages/tools/UriParserPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center text-slate-500">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools/" element={<ToolsIndexPage />} />
          <Route path="/tools/mongodb-objectid-timestamp/" element={<ObjectIdTimestampPage />} />
          <Route path="/tools/mongodb-uri-parser/" element={<UriParserPage />} />
          <Route path="/tools/mongodb-query-formatter/" element={<QueryFormatterPage />} />
          <Route path="/tools/mongodb-aggregation-formatter/" element={<AggregationFormatterPage />} />
          <Route path="/tools/json-to-mongoose/" element={<JsonToMongoosePage />} />
          <Route path="/guides/" element={<GuidesIndexPage />} />
          <Route path="/guides/how-mongodb-objectid-works/" element={<ObjectIdGuide />} />
          <Route path="/guides/mongodb-connection-string/" element={<ConnectionStringGuide />} />
          <Route path="/about/" element={<AboutPage />} />
          <Route path="/privacy/" element={<PrivacyPage />} />
          <Route path="/terms/" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>        </Suspense>      </main>
      <Footer />
    </div>
  );
}
