import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import { getCurrentLocation } from "../utils/location.js";

const colors = ["#0f766e", "#f59e0b", "#ef4444", "#38bdf8", "#a855f7", "#22c55e"];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function load() {
      const location = await getCurrentLocation().catch(() => null);
      const params = location ? { lat: location.latitude, lng: location.longitude } : {};
      const { data } = await api.get("/dashboard/summary", { params });
      setSummary(data);
    }
    load();
  }, []);

  if (!summary) {
    return <p className="glass rounded-3xl p-6 font-bold">Loading dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">Command Center</p>
        <h1 className="mt-2 text-4xl font-black">Safety intelligence dashboard.</h1>
      </div>

      <article className="glass rounded-3xl p-5">
        <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">Powered by Gemini AI</p>
        <h2 className="mt-2 text-2xl font-black">AI Insights</h2>
        {summary.areaRisk && (
          <p className="mt-2 rounded-full bg-white/60 px-4 py-2 text-sm font-bold dark:bg-white/10">
            Personalized from your area risk: {summary.areaRisk.level} ({summary.areaRisk.score}/100)
          </p>
        )}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/10">
            <span className="text-sm text-slate-500 dark:text-slate-300">Most Common Incident Type</span>
            <strong className="mt-1 block">{summary.aiInsights?.mostCommonIncidentType}</strong>
          </div>
          <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/10">
            <span className="text-sm text-slate-500 dark:text-slate-300">Emerging Risk Zones</span>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {summary.aiInsights?.emergingRiskZones?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/10">
            <span className="text-sm text-slate-500 dark:text-slate-300">Community Observations</span>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {summary.aiInsights?.communityObservations?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-teal-500/10 p-4">
          <h3 className="font-black">Personalized Safety Recommendations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {summary.aiInsights?.recommendations?.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reports" value={summary.totals.totalReports} tone="teal" />
        <StatCard label="High Risk Zones" value={summary.totals.highRiskZones} tone="red" />
        <StatCard label="Moderate Zones" value={summary.totals.moderateZones} tone="amber" />
        <StatCard label="Safe Zones" value={summary.totals.safeZones} tone="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="glass rounded-3xl p-5">
          <h2 className="text-xl font-black">Category Distribution</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categoryDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {summary.categoryDistribution.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass rounded-3xl p-5">
          <h2 className="text-xl font-black">Risk Distribution</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.riskDistribution} dataKey="value" nameKey="name" outerRadius={110} label>
                  {summary.riskDistribution.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="glass rounded-3xl p-5">
        <h2 className="text-xl font-black">Recent Reports</h2>
        <div className="mt-4 grid gap-3">
          {summary.recentReports.map((incident) => (
            <div key={incident._id} className="rounded-2xl bg-white/60 p-4 dark:bg-white/10">
              <strong>{incident.type}</strong>
              <p className="text-slate-600 dark:text-slate-300">{incident.description}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
