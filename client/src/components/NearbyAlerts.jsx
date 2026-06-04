import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { api } from "../api/client.js";
import { distanceKm, getCurrentLocation } from "../utils/location.js";

export default function NearbyAlerts() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [location, incidentResponse] = await Promise.all([
          getCurrentLocation(),
          api.get("/incidents")
        ]);
        const nearby = incidentResponse.data.incidents.filter((incident) =>
          distanceKm(location, { latitude: incident.latitude, longitude: incident.longitude }) <= 1
        );
        if (active) setCount(nearby.length);
      } catch {
        if (active) setCount(0);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!count) return null;

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
        <AlertTriangle size={20} />
        <strong>{count} incident{count === 1 ? "" : "s"} reported near you.</strong>
      </div>
    </div>
  );
}
