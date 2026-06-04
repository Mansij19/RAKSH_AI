import { useState } from "react";
import { Building2, Hospital, ShieldAlert, X } from "lucide-react";
import { getCurrentLocation } from "../utils/location.js";

export default function SOSButton() {
  const [modal, setModal] = useState(null);

  async function activateSOS() {
    try {
      const location = await getCurrentLocation();
      setModal(location);
    } catch {
      setModal({ latitude: 0, longitude: 0, error: "Location unavailable. Call emergency services immediately." });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={activateSOS}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-600/40 ring-4 ring-red-200/40 transition hover:scale-105"
        aria-label="Activate SOS"
      >
        <ShieldAlert size={30} />
      </button>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <section className="glass w-full max-w-md rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-500">Emergency Alert Activated</p>
                <h2 className="mt-2 text-2xl font-black">SOS location ready</h2>
              </div>
              <button type="button" onClick={() => setModal(null)} className="rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-white/10 dark:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-900 dark:bg-red-500/10 dark:text-red-100">
              <p className="font-semibold">Coordinates</p>
              <p>{modal.latitude.toFixed(6)}, {modal.longitude.toFixed(6)}</p>
              {modal.error && <p className="mt-2 text-sm">{modal.error}</p>}
            </div>
            <a
              className="mt-4 block rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white"
              href={`https://www.google.com/maps?q=${modal.latitude},${modal.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Google Maps Link
            </a>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-center font-bold text-white dark:bg-white dark:text-slate-950"
                href={`https://www.google.com/maps/search/nearby+police+station/@${modal.latitude},${modal.longitude},15z`}
                target="_blank"
                rel="noreferrer"
              >
                <Building2 size={18} /> Police Station
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-center font-bold text-white dark:bg-white dark:text-slate-950"
                href={`https://www.google.com/maps/search/nearby+hospital/@${modal.latitude},${modal.longitude},15z`}
                target="_blank"
                rel="noreferrer"
              >
                <Hospital size={18} /> Hospital
              </a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
