import { Link } from "react-router-dom";
import { ArrowRight, MapPinned, MessageCircle, ShieldCheck, Siren } from "lucide-react";

const features = [
  { icon: MapPinned, title: "Safety-rated map", body: "Community reports become actionable safety context on an OpenStreetMap layer." },
  { icon: ShieldCheck, title: "AI route risk", body: "RakshAI explains route risks and recommends safer alternatives." },
  { icon: Siren, title: "SOS ready", body: "A floating emergency action gives your coordinates and a maps link instantly." },
  { icon: MessageCircle, title: "Safety Assistant", body: "Ask practical safety questions before you travel." }
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid min-h-[68vh] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-teal-500/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">
            Community-Powered AI Safety Navigation
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight md:text-7xl">
            Safer movement, powered by community intelligence.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            RakshAI helps users report unsafe places, view safety-rated maps, analyze routes, and get AI-guided travel decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/route" className="inline-flex items-center gap-2 rounded-2xl bg-midnight px-6 py-4 font-bold text-white dark:bg-white dark:text-midnight">
              Analyze route <ArrowRight size={18} />
            </Link>
            <Link to="/report" className="rounded-2xl border border-slate-300 px-6 py-4 font-bold text-slate-800 dark:border-white/15 dark:text-white">
              Report incident
            </Link>
          </div>
        </div>
        <div className="glass rounded-[2rem] p-5">
          <div className="rounded-[1.5rem] bg-midnight p-5 text-white">
            <div className="grid gap-3">
              {["Harassment reports near transit stop", "Poor lighting on 3rd Cross", "Safer route available 6 min longer"].map((item, index) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-teal-100">Alert {index + 1}</p>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-teal-400 p-5 text-midnight">
              <p className="text-sm font-bold uppercase">AI Recommendation</p>
              <p className="mt-2 text-2xl font-black">Use Safe Route via the main corridor.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, body }) => (
          <article key={title} className="glass rounded-3xl p-5">
            <Icon className="text-aurora dark:text-teal-200" />
            <h3 className="mt-4 text-xl font-black">{title}</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
