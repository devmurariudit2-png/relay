import { useState, useEffect, useMemo } from "react";
import PageShell from "../components/layout/PageShell.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { fetchAuth } from "../api/index.js";

const MANUAL_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-6">Welcome to the Relay Developer API. Our API allows you to programmatically manage reconciliation, transactions, and reporting.</p>
        <p className="text-[15px] leading-relaxed mb-4">The Relay API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 mt-8">
          <h4 className="text-blue-900 font-bold mb-3 text-sm uppercase tracking-wider">Base URL</h4>
          <code className="text-blue-900 bg-white px-3 py-1.5 rounded border border-blue-100 font-mono text-sm block w-max">https://api.relay.com/v1</code>
        </div>
      </div>
    ),
    codeSnippet: `// Relay API v1\n\n// Base URL\nconst BASE_URL = "https://api.relay.com/v1";`
  },
  {
    id: "auth",
    title: "Authentication",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">The Relay API uses Bearer tokens to authenticate requests. You can view and manage your API keys in the Relay Dashboard.</p>
        <p className="text-[15px] leading-relaxed mb-4">Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</p>
        <p className="text-[15px] leading-relaxed mb-4">All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.</p>
      </div>
    ),
    codeSnippet: `# With cURL, you can just pass the correct header with each request\ncurl https://api.relay.com/v1/transactions \\\n  -H "Authorization: Bearer YOUR_SECRET_KEY"`
  },
  {
    id: "errors",
    title: "Errors",
    content: (
      <div className="text-gray-700">
        <p className="text-[15px] leading-relaxed mb-4">Relay uses conventional HTTP response codes to indicate the success or failure of an API request. In general:</p>
        <ul className="list-disc pl-5 mb-6 space-y-3 mt-4 text-[15px]">
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">2xx</code> range indicate success.</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">4xx</code> range indicate an error that failed given the information provided (e.g., a required parameter was omitted).</li>
          <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">5xx</code> range indicate an error with Relay's servers (these are rare).</li>
        </ul>
      </div>
    ),
    codeSnippet: `// Example Error Response\n{\n  "error": {\n    "code": "parameter_invalid",\n    "message": "The provided amount must be greater than 0.",\n    "param": "amount"\n  }\n}`
  }
];

function generateCurl(path, method, spec) {
  let curl = `curl -X ${method.toUpperCase()} https://api.relay.com/v1${path} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`;

  const props = spec?.requestBody?.content?.["application/json"]?.schema?.properties;
  if (props) {
    const dummy = {};
    for (const [k, v] of Object.entries(props)) {
      dummy[k] = v.example || (v.type === "string" ? "string" : 0);
    }
    curl += ` \\\n  -d '${JSON.stringify(dummy, null, 2)}'`;
  }
  return curl;
}

function generateResponse(spec) {
  const resp200 = spec?.responses?.["200"] || spec?.responses?.["201"];
  const props = resp200?.content?.["application/json"]?.schema?.properties;
  if (props) {
    const dummy = {};
    for (const [k, v] of Object.entries(props)) {
      dummy[k] = v.example || (v.type === "string" ? "..." : (v.type === "array" ? [] : {}));
    }
    return JSON.stringify(dummy, null, 2);
  }
  return "{\n  \"success\": true\n}";
}

export default function ApiDocs({ user, toast }) {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState({ type: "manual", data: MANUAL_SECTIONS[0] });

  useEffect(() => {
    fetchAuth("/api-docs.json")
      .then((data) => {
        setSpec(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load OpenAPI spec:", err);
        setError("Failed to load API documentation.");
        toast("Failed to load API documentation.", "error");
      })
      .finally(() => setLoading(false));
  }, [toast]);

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

  if (loading) {
    return (
      <PageShell title="Developer API" subtitle="Integrate Relay into your workflows">
        <div className="flex justify-center items-center h-64"><Spinner size={32} /></div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Developer API" subtitle="Integrate Relay into your workflows">
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
                <span className={`text-sm font-bold uppercase ${activeItem.data.method === "get" ? "text-blue-600" : activeItem.data.method === "post" ? "text-green-600" : activeItem.data.method === "put" ? "text-orange-600" : "text-red-600"}`}>{activeItem.data.method}</span>
                <span className="text-[15px] font-mono text-gray-900 break-all">https://api.relay.com/v1{activeItem.data.path}</span>
              </div>

              {activeItem.data.spec.requestBody && activeItem.data.spec.requestBody.content?.["application/json"]?.schema?.properties && (
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
                          <div className="text-[13px] text-gray-500 font-mono mb-1">{details.type}</div>
                          <div className="text-[14px] text-gray-700 leading-relaxed">{details.description || "No description available."}</div>
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
                  <button className="text-xs text-gray-500 hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors">Copy</button>
                </div>
                <pre className="text-[13px] font-mono text-[#33FF00] overflow-x-auto p-5 bg-[#111318] rounded-xl border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generateCurl(activeItem.data.path, activeItem.data.method, activeItem.data.spec)}
                </pre>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Response (JSON)</h4>
                </div>
                <pre className="text-[13px] font-mono text-[#66B2FF] overflow-x-auto p-5 bg-[#111318] rounded-xl border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generateResponse(activeItem.data.spec)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
