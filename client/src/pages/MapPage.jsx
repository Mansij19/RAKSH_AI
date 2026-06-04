import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api/client.js";
import MapLegend from "../components/MapLegend.jsx";
import { SAFETY_COLORS, safetyFromSeverity } from "../utils/safetyScore.js";
import { getCurrentLocation } from "../utils/location.js";

function riskColor(severity) {
  return SAFETY_COLORS[safetyFromSeverity(severity).category];
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const [incidents, setIncidents] = useState([]);
  const [center, setCenter] = useState([12.9716, 77.5946]);
  const [summaries, setSummaries] = useState({});
  const [layers, setLayers] = useState({
    safety: true,
    heatmap: false,
    reports: true
  });

  useEffect(() => {
    async function load() {
      const [{ data }] = await Promise.all([
        api.get("/incidents"),
        getCurrentLocation().then((location) => setCenter([location.latitude, location.longitude])).catch(() => null)
      ]);
      setIncidents(data.incidents);
    }
    load();
  }, []);

  const markers = useMemo(() => incidents.map((incident) => ({
    ...incident,
    latLng: L.latLng(incident.latitude, incident.longitude)
  })), [incidents]);

  async function loadAreaSummary(incident) {
    const key = incident._id;
    setSummaries((current) => ({
      ...current,
      [key]: current[key] || { loading: true }
    }));
    try {
      const { data } = await api.post("/ai/area-summary", {
        latitude: incident.latitude,
        longitude: incident.longitude
      });
      setSummaries((current) => ({
        ...current,
        [key]: data.summary
      }));
    } catch {
      setSummaries((current) => ({
        ...current,
        [key]: {
          riskLevel: "Moderate",
          recentConcerns: [incident.type],
          suggestedTravelTime: "Before 9 PM",
          recommendation: "Use main roads with higher foot traffic.",
          summary: "Gemini area summary could not be generated right now."
        }
      }));
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">RakshAI Safety Map</p>
          <h1 className="mt-2 text-4xl font-black">Community incidents by risk.</h1>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm dark:bg-white/10">{incidents.length} reports mapped</div>
      </div>
      <div className="glass relative rounded-[1.6rem] p-3">
        <MapContainer center={center} zoom={14} scrollWheelZoom className="z-0">
          <Recenter center={center} />
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {layers.safety && markers.map((incident) => (
            <CircleMarker
              key={`${incident._id}-safety`}
              center={incident.latLng}
              pathOptions={{
                color: riskColor(incident.severity),
                fillColor: riskColor(incident.severity),
                fillOpacity: 0.16,
                opacity: 0.58,
                weight: 4
              }}
              radius={38 + incident.severity * 8}
            />
          ))}
          {layers.heatmap && markers.map((incident) => (
            <CircleMarker
              key={`${incident._id}-heatmap`}
              center={incident.latLng}
              pathOptions={{
                color: riskColor(incident.severity),
                fillColor: riskColor(incident.severity),
                fillOpacity: 0.28,
                opacity: 0.22,
                weight: 1
              }}
              radius={60 + incident.severity * 14}
            />
          ))}
          {layers.reports && markers.map((incident) => (
            <CircleMarker
              key={incident._id}
              center={incident.latLng}
              pathOptions={{ color: riskColor(incident.severity), fillColor: riskColor(incident.severity), fillOpacity: 0.82 }}
              radius={10 + incident.severity}
              eventHandlers={{ click: () => loadAreaSummary(incident) }}
            >
              <Popup>
                <div className="max-w-xs space-y-2">
                  <strong>{incident.type}</strong>
                  <p>{incident.description}</p>
                  <p>Date: {new Date(incident.createdAt).toLocaleString()}</p>
                  <p>Safety Score: {safetyFromSeverity(incident.severity).score}%</p>
                  <div className="rounded-xl bg-teal-50 p-3 text-slate-800">
                    <p className="text-xs font-black uppercase text-teal-700">Powered by Gemini AI</p>
                    {summaries[incident._id]?.loading ? (
                      <p>Generating area safety summary...</p>
                    ) : summaries[incident._id] ? (
                      <>
                        <p><strong>Risk Level:</strong> {summaries[incident._id].riskLevel}</p>
                        <p><strong>Recent Concerns:</strong> {summaries[incident._id].recentConcerns?.join(", ")}</p>
                        <p><strong>Suggested Travel Time:</strong> {summaries[incident._id].suggestedTravelTime}</p>
                        <p>{summaries[incident._id].recommendation}</p>
                      </>
                    ) : (
                      <p>Click marker to generate an area summary.</p>
                    )}
                  </div>
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
        <MapLegend />
      </div>
    </section>
  );
}
