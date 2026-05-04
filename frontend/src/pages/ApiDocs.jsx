import { useState, useEffect, useMemo } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { fetchAuth } from "../api/index.js";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:5000" : window.location.origin);

const MANUAL_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-6">Welcome to the Relay Developer API. Our API allows you to programmatically manage reconciliation, transactions, and reporting.</p>
        <p className="text-[15px] leading-relaxed mb-4">The Relay API is organized around REST. It accepts JSON request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 mt-8">
          <h4 className="text-blue-900 font-bold mb-3 text-sm uppercase tracking-wider">Base URL</h4>
          <code className="text-blue-900 bg-white px-3 py-1.5 rounded border border-blue-100 font-mono text-sm block w-max">{API_BASE}</code>
        </div>
      </div>
    ),
    codeSnippet: `// Relay API v4\n\n// Base URL\nconst BASE_URL = "${API_BASE}";`
  },
  {
    id: "auth",
    title: "Authentication",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">The Relay API uses Bearer tokens to authenticate requests. Obtain a token by signing in via the Supabase Auth SDK or the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">POST /auth/login</code> endpoint.</p>
        <p className="text-[15px] leading-relaxed mb-4">Include the token in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">Authorization</code> header of every request:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 font-mono text-sm text-gray-800">
          Authorization: Bearer {"<your_access_token>"}
        </div>
        <p className="text-[15px] leading-relaxed mb-4">All API requests must be made over HTTPS. Requests without a valid token will return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">401 Unauthorized</code>.</p>
      </div>
    ),
    codeSnippet: `# Authenticate with every request\ncurl ${API_BASE}/transactions \\\n  -H "Authorization: Bearer eyJhbGciOi..."\\\n  -H "Content-Type: application/json"`
  },
  {
    id: "errors",
    title: "Errors",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">Relay uses conventional HTTP response codes to indicate the success or failure of an API request:</p>
        <ul className="list-disc pl-5 mb-6 space-y-3 mt-4 text-[15px]">
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">200 OK</code> — Request succeeded.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">201 Created</code> — Resource created successfully.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">400 Bad Request</code> — Missing or invalid parameters.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">401 Unauthorized</code> — Invalid or expired token.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">403 Forbidden</code> — Insufficient permissions.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">404 Not Found</code> — Resource does not exist.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">429 Too Many Requests</code> — Rate limit exceeded.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">500 Internal Server Error</code> — Something went wrong on our end.</li>
        </ul>
      </div>
    ),
    codeSnippet: `// Error Response Format\n{\n  "success": false,\n  "message": "Validation failed",\n  "errors": [\n    {\n      "field": "amount",\n      "message": "Amount must be > 0"\n    }\n  ]\n}`
  },
  {
    id: "pagination",
    title: "Pagination",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">All list endpoints return paginated results. Use the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">page</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">limit</code> query parameters to control pagination.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 font-semibold">Parameter</th><th className="text-left py-2 text-gray-500 font-semibold">Default</th><th className="text-left py-2 text-gray-500 font-semibold">Description</th></tr></thead>
            <tbody>
              <tr className="border-b border-gray-100"><td className="py-2 font-mono text-gray-800">page</td><td className="py-2">1</td><td className="py-2 text-gray-600">Page number</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 font-mono text-gray-800">limit</td><td className="py-2">50</td><td className="py-2 text-gray-600">Items per page (max 100)</td></tr>
              <tr><td className="py-2 font-mono text-gray-800">sortBy</td><td className="py-2">date</td><td className="py-2 text-gray-600">Sort field</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[15px] leading-relaxed mb-4">The response includes a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">pagination</code> object with total count and page metadata.</p>
      </div>
    ),
    codeSnippet: `// Paginated Response\n{\n  "success": true,\n  "data": [ ... ],\n  "pagination": {\n    "page": 1,\n    "limit": 50,\n    "total": 324,\n    "pages": 7\n  }\n}`
  },
  {
    id: "ratelimiting",
    title: "Rate Limiting",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">The API enforces rate limits to ensure fair usage:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 font-semibold">Endpoint</th><th className="text-left py-2 text-gray-500 font-semibold">Limit</th></tr></thead>
            <tbody>
              <tr className="border-b border-gray-100"><td className="py-2 font-mono text-gray-800">POST /auth/login</td><td className="py-2">20 requests / 15 min</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 font-mono text-gray-800">POST /transactions/import</td><td className="py-2">10 requests / 15 min</td></tr>
              <tr><td className="py-2 font-mono text-gray-800">All other endpoints</td><td className="py-2">200 requests / 15 min</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[15px] leading-relaxed mb-4">When rate limited, the API returns <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">429 Too Many Requests</code>. Implement exponential backoff in your integration.</p>
      </div>
    ),
    codeSnippet: `// Rate Limit Headers\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 97\nX-RateLimit-Reset: 1714857600\n\n// 429 Response\n{\n  "success": false,\n  "message": "Too many requests"\n}`
  }
];

// Realistic example values for fields that lack them in the spec
const FIELD_EXAMPLES = {
  source: "bank", status: "pending", priority: "medium", category: "Revenue",
  role: "member", token: "eyJhbGciOi...", email: "user@example.com",
  name: "Jane Doe", password: "••••••••", comment: "Looks correct, approved.",
  title: "Missing invoice", description: "Payment not reflected in ledger",
  assignedTo: "a1b2c3d4-...", date: "2024-01-15", reference: "REF-00421",
  note: "Verified with vendor", currency: "USD", amount: 1500.00,
};

const FIELD_DESCRIPTIONS = {
  date: "Transaction date in ISO 8601 format (YYYY-MM-DD)",
  description: "Human-readable description of the transaction",
  amount: "Transaction amount as a positive decimal number",
  currency: "ISO 4217 currency code (e.g. USD, EUR, GBP)",
  source: "Origin of the transaction — 'bank' or 'internal'",
  category: "Business category for reporting (e.g. Revenue, Payroll, SaaS)",
  reference: "External reference ID from the bank or ERP system",
  note: "Internal annotation visible only to your team",
  status: "Current reconciliation status of the transaction",
  priority: "Ticket priority level — low, medium, high, or critical",
  title: "Short summary of the support ticket",
  comment: "Comment text to add to the ticket thread",
  email: "User email address",
  name: "Full display name",
  password: "Account password (min 6 characters)",
  role: "Team member role — admin, member, or viewer",
  assignedTo: "UUID of the team member to assign this ticket to",
  token: "Invite token received via email",
};

function generateCurl(path, method, spec) {
  let curl = `curl -X ${method.toUpperCase()} ${API_BASE}${path} \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json"`;
  const props = spec?.requestBody?.content?.["application/json"]?.schema?.properties;
  if (props) {
    const dummy = {};
    for (const [k, v] of Object.entries(props)) {
      dummy[k] = v.example || FIELD_EXAMPLES[k] || (v.type === "number" ? 0 : v.type === "array" ? [] : "value");
    }
    curl += ` \\\n  -d '${JSON.stringify(dummy, null, 2)}'`;
  }
  return curl;
}

function generateResponse(spec, method) {
  const resp = spec?.responses?.["200"] || spec?.responses?.["201"];
  const props = resp?.content?.["application/json"]?.schema?.properties;
  if (props) {
    const dummy = {};
    for (const [k, v] of Object.entries(props)) {
      dummy[k] = v.example || (v.type === "string" ? "..." : v.type === "array" ? [] : {});
    }
    return JSON.stringify({ success: true, data: dummy }, null, 2);
  }
  // Default realistic responses based on method
  if (method === "get") {
    return JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }, null, 2);
  }
  if (method === "post") {
    return JSON.stringify({ success: true, data: { id: "a1b2c3d4-e5f6-...", createdAt: new Date().toISOString() } }, null, 2);
  }
  if (method === "delete") {
    return JSON.stringify({ success: true, message: "Resource deleted successfully" }, null, 2);
  }
  return JSON.stringify({ success: true }, null, 2);
}

function copyToClipboard(text, toast) {
  navigator.clipboard.writeText(text).then(() => {
    toast?.("Copied to clipboard", "success");
  }).catch(() => {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast?.("Copied to clipboard", "success");
  });
}

export default function ApiDocs({ user, toast }) {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState({ type: "manual", data: MANUAL_SECTIONS[0] });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAuth("/api-docs.json")
      .then((data) => { setSpec(data); setError(null); })
      .catch((err) => {
        console.error("Failed to load OpenAPI spec:", err);
        setError("Failed to load API documentation.");
      })
      .finally(() => setLoading(false));
  }, []);

  const endpointsByTag = useMemo(() => {
    if (!spec?.paths) return {};
    const grouped = {};
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        const tag = details.tags?.[0] || "General";
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push({ path, method, spec: details });
      });
    });
    return grouped;
  }, [spec]);

  const handleCopy = (text) => {
    copyToClipboard(text, toast);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <PageShell title="Developer API" sub="Integrate Relay into your workflows">
        <div className="flex justify-center items-center h-64"><Spinner size={32} /></div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Developer API" sub="Integrate Relay into your workflows">
      <div className="flex flex-col xl:flex-row bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[700px] font-sans">
        
        {/* Left Sidebar (Nav) */}
        <div className="w-full xl:w-[260px] border-r border-gray-200 bg-gray-50/50 flex-shrink-0 flex flex-col h-[300px] xl:h-auto overflow-y-auto">
          <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">API Reference</h3>
          </div>
          <div className="p-3">
            {/* Manual Sections */}
            <div className="mb-8">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 px-3 mb-3 mt-2">Getting Started</div>
              <div className="flex flex-col gap-1">
                {MANUAL_SECTIONS.map((sec) => {
                  const isActive = activeItem.type === "manual" && activeItem.data.id === sec.id;
                  return (
                    <button 
                      key={sec.id} 
                      onClick={() => setActiveItem({ type: "manual", data: sec })}
                      className={`text-left px-3 py-2 rounded-lg text-[13.5px] transition-colors border-none cursor-pointer ${isActive ? "bg-white shadow-sm border border-gray-200 text-gray-900 font-bold" : "bg-transparent text-gray-600 hover:bg-gray-100 font-medium"}`}
                    >
                      {sec.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Endpoints */}
            {spec && Object.entries(endpointsByTag).map(([tag, eps]) => (
              <div key={tag} className="mb-8">
                <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 px-3 mb-3">{tag}</div>
                <div className="flex flex-col gap-1">
                  {eps.map((ep) => {
                    const isActive = activeItem.type === "endpoint" && activeItem.data.path === ep.path && activeItem.data.method === ep.method;
                    const methodColors = {
                      get: "bg-blue-100 text-blue-700",
                      post: "bg-green-100 text-green-700",
                      put: "bg-orange-100 text-orange-700",
                      patch: "bg-amber-100 text-amber-700",
                      delete: "bg-red-100 text-red-700"
                    };
                    return (
                      <button 
                        key={ep.path + ep.method} 
                        onClick={() => setActiveItem({ type: "endpoint", data: ep })}
                        className={`text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 transition-colors border-none cursor-pointer ${isActive ? "bg-white shadow-sm border border-gray-200 text-gray-900 font-semibold" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
                      >
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${methodColors[ep.method] || "bg-gray-100 text-gray-700"}`}>
                          {ep.method}
                        </span>
                        <span className="truncate">{ep.spec.summary || ep.path}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Area (Documentation) */}
        <div className="flex-1 p-8 xl:p-12 overflow-y-auto bg-white border-r border-gray-200 xl:min-h-[700px]">
          {activeItem.type === "manual" ? (
            <div className="max-w-3xl">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-8">{activeItem.data.title}</h1>
              {activeItem.data.content}
            </div>
          ) : (
            <div className="max-w-3xl">
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{activeItem.data.spec.summary || "Endpoint"}</h1>
                {activeItem.data.spec.description && (
                  <p className="text-gray-600 text-[15px] leading-relaxed">{activeItem.data.spec.description}</p>
                )}
              </div>
              
              <div className="mb-10 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-center gap-4">
                <span className={`text-sm font-bold uppercase ${activeItem.data.method === "get" ? "text-blue-600" : activeItem.data.method === "post" ? "text-green-600" : activeItem.data.method === "put" || activeItem.data.method === "patch" ? "text-orange-600" : "text-red-600"}`}>{activeItem.data.method}</span>
                <span className="text-[15px] font-mono text-gray-900 break-all">{API_BASE}{activeItem.data.path}</span>
              </div>

              {/* Query Parameters for GET endpoints */}
              {activeItem.data.spec.parameters && activeItem.data.spec.parameters.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">Query Parameters</h3>
                  <div className="flex flex-col">
                    {activeItem.data.spec.parameters.map((param, idx) => (
                      <div key={param.name || idx} className="py-4 border-b border-gray-100 last:border-0 flex flex-col sm:flex-row sm:gap-6">
                        <div className="w-[160px] flex-shrink-0 mb-2 sm:mb-0 flex items-center gap-2">
                          <span className="text-[14px] font-mono font-bold text-gray-900">{param.name}</span>
                          {param.required && (
                            <span className="text-[10px] text-red-600 uppercase font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] text-gray-500 font-mono mb-1">{param.schema?.type || "string"}</div>
                          <div className="text-[14px] text-gray-700 leading-relaxed">{param.description || FIELD_DESCRIPTIONS[param.name] || `Filter by ${param.name}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Parameters */}
              {activeItem.data.spec.requestBody?.content?.["application/json"]?.schema?.properties && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">Body Parameters</h3>
                  <div className="flex flex-col">
                    {Object.entries(activeItem.data.spec.requestBody.content["application/json"].schema.properties).map(([key, details]) => (
                      <div key={key} className="py-5 border-b border-gray-100 last:border-0 flex flex-col sm:flex-row sm:gap-6">
                        <div className="w-[160px] flex-shrink-0 mb-2 sm:mb-0 flex items-center gap-2">
                          <span className="text-[14px] font-mono font-bold text-gray-900">{key}</span>
                          {activeItem.data.spec.requestBody.content["application/json"].schema.required?.includes(key) && (
                            <span className="text-[10px] text-red-600 uppercase font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Required</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] text-gray-500 font-mono mb-1">{details.type}{details.enum ? ` — ${details.enum.join(" | ")}` : ""}</div>
                          <div className="text-[14px] text-gray-700 leading-relaxed">{details.description || FIELD_DESCRIPTIONS[key] || `The ${key} value`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Area (Code Snippets) */}
        <div className="w-full xl:w-[450px] bg-[#0A0C10] flex-shrink-0 flex flex-col overflow-y-auto text-gray-300 xl:min-h-[700px]">
          {activeItem.type === "manual" ? (
            <div className="p-8">
              <pre className="text-[13px] font-mono text-gray-300 overflow-x-auto p-5 bg-[#111318] rounded-xl border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {activeItem.data.codeSnippet}
              </pre>
            </div>
          ) : (
            <>
              <div className="p-8 border-b border-gray-800/60">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Request (cURL)</h4>
                  <button
                    onClick={() => handleCopy(generateCurl(activeItem.data.path, activeItem.data.method, activeItem.data.spec))}
                    className="text-xs text-gray-500 hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <pre className="text-[13px] font-mono text-gray-300 overflow-x-auto p-5 bg-[#111318] rounded-xl border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generateCurl(activeItem.data.path, activeItem.data.method, activeItem.data.spec)}
                </pre>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Response (JSON)</h4>
                </div>
                <pre className="text-[13px] font-mono text-gray-300 overflow-x-auto p-5 bg-[#111318] rounded-xl border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generateResponse(activeItem.data.spec, activeItem.data.method)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
