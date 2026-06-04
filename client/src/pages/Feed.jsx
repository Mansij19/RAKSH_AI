import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { distanceKm, getCurrentLocation } from "../utils/location.js";

const types = ["All", "Poor Lighting", "Harassment", "Theft", "Isolated Area", "Suspicious Activity", "Unsafe Transport Stop"];
const risks = ["All", "High", "Moderate", "Safe"];

export default function Feed() {
  const [incidents, setIncidents] = useState([]);
  const [type, setType] = useState("All");
  const [risk, setRisk] = useState("All");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation().then(setLocation).catch(() => null);
  }, []);

  useEffect(() => {
    async function load() {
      const params = {};
      if (type !== "All") params.type = type;
      if (risk !== "All") params.risk = risk;
      const { data } = await api.get("/incidents", { params });
      setIncidents(data.incidents);
    }
    load();
  }, [type, risk]);

  const rows = useMemo(() => incidents.map((incident) => ({
    ...incident,
    distance: location ? `${distanceKm(location, incident).toFixed(1)} km` : "Detecting"
  })), [incidents, location]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">Community Feed</p>
        <h1 className="mt-2 text-4xl font-black">Latest safety reports.</h1>
      </div>
      <div className="glass flex flex-wrap gap-3 rounded-3xl p-4">
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10">
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid gap-4">
        {rows.map((incident) => (
          <article key={incident._id} className="glass rounded-3xl p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{incident.type}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{incident.description}</p>
              </div>
              <div className="text-right text-sm font-bold text-slate-500 dark:text-slate-300">
                <p>{incident.distance}</p>
                <p>{new Date(incident.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {incident.aiRecommendation && <p className="mt-4 rounded-2xl bg-teal-500/10 p-3 text-sm text-aurora dark:text-teal-100">{incident.aiRecommendation}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
