import { useEffect, useMemo, useState } from "react";
import { Navigation2 } from "lucide-react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api/client.js";
import { SAFETY_COLORS, classifySafetyScore, safetyFromSeverity } from "../utils/safetyScore.js";

function colorFor(route) {
  return SAFETY_COLORS[route.safetyCategory || classifySafetyScore(route.safetyScore ?? 100 - route.riskScore).category];
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function RouteAnalyzer() {
  const [source, setSource] = useState("Indiranagar, Bengaluru");
  const [destination, setDestination] = useState("Koramangala, Bengaluru");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [layers, setLayers] = useState({
    safety: true,
    heatmap: false,
    reports: true
  });

  async function analyze(event) {
    event.preventDefault();
    setStatus("Analyzing incidents, geocoding, and AI risk...");
    try {
      const { data } = await api.post("/routes/analyze", { source, destination });
      setResult(data);
      setStatus("");
    } catch (error) {
      setStatus(error.response?.data?.error || "Route analysis failed.");
    }
  }

  const center = result ? [result.source.latitude, result.source.longitude] : [12.9716, 77.5946];
  const routeReports = useMemo(() => {
    if (!result) return [];
    const byId = new Map();
    result.routes.forEach((route) => {
      route.incidents.forEach((incident) => {
        const key = incident._id || `${incident.latitude}-${incident.longitude}-${incident.type}`;
        byId.set(key, incident);
      });
    });
    return Array.from(byId.values());
  }, [result]);

  const fastestRoute = result?.fastestRoute || result?.routes?.slice().sort((a, b) => a.timeMinutes - b.timeMinutes)[0];
  const safestRoute = result?.safestRoute || result?.routes?.slice().sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))[0];

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">AI Risk Engine</p>
          <h1 className="mt-2 text-4xl font-black">Find safer route options.</h1>
        </div>
        <form onSubmit={analyze} className="glass grid gap-4 rounded-3xl p-5">
          <input value={source} onChange={(event) => setSource(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10" placeholder="Source" />
          <input value={destination} onChange={(event) => setDestination(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10" placeholder="Destination" />
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-midnight px-5 py-3 font-bold text-white dark:bg-white dark:text-midnight">
            <Navigation2 size={18} /> Analyze Route
          </button>
          {status && <p className="font-semibold text-slate-600 dark:text-slate-300">{status}</p>}
        </form>
        {result && (
          <div className="glass rounded-3xl p-5">
            <p className="text-sm font-black uppercase text-aurora dark:text-teal-200">Powered by Gemini AI</p>
            <h2 className="mt-1 text-2xl font-black">Route Safety Analysis</h2>
            <p className="mt-2 text-slate-700 dark:text-slate-200">{result.aiAnalysis?.riskExplanation || result.explanation}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[{ label: "Fastest Route", route: fastestRoute }, { label: "Safest Route", route: safestRoute }].map(({ label, route }) => (
                route && (
                  <div key={label} className="rounded-2xl bg-white/60 p-3 dark:bg-white/10">
                    <span className="text-sm text-slate-500 dark:text-slate-300">{label}</span>
                    <strong className="block text-xl">{route.timeMinutes} min</strong>
                    <p className="font-bold">Safety Score: {route.safetyScore}%</p>
                    {route.name === result.recommended?.name && <p className="mt-1 text-sm font-black text-aurora dark:text-teal-200">Recommended</p>}
                  </div>
                )
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/10">
                <span className="text-sm text-slate-500 dark:text-slate-300">Safety Assessment</span>
                <strong className="block">{result.aiAnalysis?.safetyAssessment}</strong>
              </div>
              <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/10">
                <span className="text-sm text-slate-500 dark:text-slate-300">Suggested Alternative</span>
                <strong className="block">{result.aiAnalysis?.suggestedAlternative}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="glass relative rounded-[1.6rem] p-3">
          <MapContainer center={center} zoom={13} scrollWheelZoom>
            <Recenter center={center} />
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {layers.safety && result?.routes.map((route) => (
              route.segments?.length ? route.segments.map((segment, index) => (
                <Polyline
                  key={`${route.name}-${index}`}
                  positions={segment.path.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{
                    color: SAFETY_COLORS[segment.safetyCategory],
                    opacity: route.name === result.recommended.name ? 0.95 : 0.72,
                    weight: route.name === result.recommended.name ? 7 : 5
                  }}
                />
              )) : (
                <Polyline
                  key={route.name}
                  positions={route.path.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{ color: colorFor(route), weight: route.name === result.recommended.name ? 7 : 4 }}
                />
              )
            ))}
            {layers.heatmap && routeReports.map((incident) => (
              <CircleMarker
                key={`${incident._id}-heatmap`}
                center={[incident.latitude, incident.longitude]}
                pathOptions={{
                  color: SAFETY_COLORS[safetyFromSeverity(incident.severity).category],
                  fillColor: SAFETY_COLORS[safetyFromSeverity(incident.severity).category],
                  fillOpacity: 0.24,
                  opacity: 0.18,
                  weight: 1
                }}
                radius={56 + incident.severity * 12}
              />
            ))}
            {layers.reports && routeReports.map((incident) => (
              <CircleMarker
                key={incident._id || `${incident.latitude}-${incident.longitude}-${incident.type}`}
                center={[incident.latitude, incident.longitude]}
                pathOptions={{
                  color: SAFETY_COLORS[safetyFromSeverity(incident.severity).category],
                  fillColor: SAFETY_COLORS[safetyFromSeverity(incident.severity).category],
                  fillOpacity: 0.82
                }}
                radius={9 + incident.severity}
              >
                <Popup>
                  <div className="max-w-xs space-y-1">
                    <strong>{incident.type}</strong>
                    <p>{incident.description}</p>
                    <p>Safety Score: {safetyFromSeverity(incident.severity).score}%</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="glass absolute right-5 top-5 z-[500] grid gap-2 rounded-2xl p-3 text-sm font-bold">
            <button
              type="button"
              onClick={() => setLayers((current) => ({ ...current, safety: !current.safety }))}
              className="rounded-xl bg-white px-3 py-2 text-left shadow-sm dark:bg-white/10"
            >
              {layers.safety ? "Hide Safety Layer" : "Show Safety Layer"}
            </button>
            <button
              type="button"
              onClick={() => setLayers((current) => ({ ...current, heatmap: !current.heatmap }))}
              className="rounded-xl bg-white px-3 py-2 text-left shadow-sm dark:bg-white/10"
            >
              {layers.heatmap ? "Hide Heatmap" : "Show Heatmap"}
            </button>
            <button
              type="button"
              onClick={() => setLayers((current) => ({ ...current, reports: !current.reports }))}
              className="rounded-xl bg-white px-3 py-2 text-left shadow-sm dark:bg-white/10"
            >
              {layers.reports ? "Hide Reports" : "Show Reports"}
            </button>
          </div>
        </div>
        {result && (
          <div className="grid gap-3">
            {result.routes.map((route) => (
              <article key={route.name} className="glass rounded-3xl p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{route.name}</h3>
                    <p className="text-slate-500 dark:text-slate-300">{route.distanceKm} km - {route.timeMinutes} min - {route.incidents.length} incidents nearby</p>
                  </div>
                  <strong className="text-2xl">{route.safetyScore}%</strong>
                </div>
                <p className="mt-3 rounded-2xl bg-white/60 p-3 font-bold dark:bg-white/10">Safety Score: {route.safetyScore}% - {route.riskLevel}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
