import { useState } from "react";
import { LocateFixed, Send } from "lucide-react";
import { api } from "../api/client.js";
import { getCurrentLocation } from "../utils/location.js";

const incidentTypes = ["Poor Lighting", "Harassment", "Theft", "Isolated Area", "Suspicious Activity", "Unsafe Transport Stop"];

export default function Report() {
  const [form, setForm] = useState({
    type: "Poor Lighting",
    description: "",
    latitude: "",
    longitude: ""
  });
  const [status, setStatus] = useState("");
  const [classification, setClassification] = useState(null);

  async function detectLocation() {
    try {
      const location = await getCurrentLocation();
      setForm((current) => ({ ...current, latitude: location.latitude, longitude: location.longitude }));
      setStatus("Location detected.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("Submitting report...");
    try {
      const { data } = await api.post("/incidents", {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
      setForm({ type: "Poor Lighting", description: "", latitude: "", longitude: "" });
      setClassification(data.classification);
      setStatus(data.message || "AI Classification Completed");
    } catch (error) {
      setStatus(error.response?.data?.error || "Could not submit report.");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">Incident Reporting</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Report unsafe locations in seconds.</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Your report helps RakshAI calculate local risk, warn nearby users, and recommend safer routes.
        </p>
      </div>

      <form onSubmit={submit} className="glass rounded-3xl p-6">
        <div className="grid gap-5">
          <label className="grid gap-2 font-bold">
            Incident Type
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              {incidentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-2 font-bold">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={5}
              minLength={8}
              required
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
              placeholder="Describe what happened or what makes this location unsafe."
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Latitude
              <input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
            <label className="grid gap-2 font-bold">
              Longitude
              <input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} required className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={detectLocation} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold dark:border-white/15">
              <LocateFixed size={18} /> Auto Detect Location
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-midnight px-5 py-3 font-bold text-white dark:bg-white dark:text-midnight">
              <Send size={18} /> Submit Report
            </button>
          </div>
          {status && <p className="rounded-2xl bg-teal-500/10 p-4 font-semibold text-aurora dark:text-teal-100">{status}</p>}
          {classification && (
            <div className="rounded-3xl border border-teal-300 bg-teal-50 p-4 dark:border-teal-300/20 dark:bg-teal-400/10">
              <p className="text-xs font-black uppercase tracking-wide text-aurora dark:text-teal-200">Powered by Gemini AI</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-300">Incident Category</span>
                  <strong className="block">{classification.category}</strong>
                </div>
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-300">Severity Score</span>
                  <strong className="block">{classification.severity}/5</strong>
                </div>
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-300">Confidence</span>
                  <strong className="block">{classification.confidence}%</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
