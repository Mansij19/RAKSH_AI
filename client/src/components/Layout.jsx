import { Link, NavLink } from "react-router-dom";
import { Bot, Home, LayoutDashboard, Map, Megaphone, Moon, Navigation, PlusCircle, Sun } from "lucide-react";
import SOSButton from "./SOSButton.jsx";
import NearbyAlerts from "./NearbyAlerts.jsx";
import rakshaiLogo from "../assets/rakshai-logo.svg";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/map", label: "Map", icon: Map },
  { to: "/report", label: "Report", icon: PlusCircle },
  { to: "/feed", label: "Feed", icon: Megaphone },
  { to: "/route", label: "Route", icon: Navigation },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export default function Layout({ children, darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#c7fff3_0,transparent_34%),linear-gradient(135deg,#eef4f1,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,#14534b_0,transparent_32%),linear-gradient(135deg,#081116,#14202a)] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/75 backdrop-blur-xl dark:bg-slate-950/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={rakshaiLogo} alt="RakshAI" className="h-11 w-11 rounded-2xl object-cover shadow-glow" />
            <span>
              <strong className="block text-lg leading-tight">RakshAI</strong>
              <small className="text-slate-500 dark:text-slate-300">AI Safety Navigation</small>
            </span>
          </Link>
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5 lg:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-midnight text-white dark:bg-white dark:text-midnight" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full border border-slate-200 bg-white p-3 text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive ? "bg-midnight text-white dark:bg-white dark:text-midnight" : "bg-white/70 text-slate-700 dark:bg-white/10 dark:text-slate-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </header>
      <NearbyAlerts />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <SOSButton />
    </div>
  );
}
