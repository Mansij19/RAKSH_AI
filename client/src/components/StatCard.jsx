export default function StatCard({ label, value, tone = "teal" }) {
  const tones = {
    teal: "from-teal-500 to-emerald-500",
    red: "from-red-500 to-rose-500",
    amber: "from-amber-400 to-orange-500",
    blue: "from-sky-500 to-indigo-500"
  };

  return (
    <div className="glass rounded-3xl p-5">
      <div className={`mb-5 h-2 w-20 rounded-full bg-gradient-to-r ${tones[tone]}`} />
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className="stat-count mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}
