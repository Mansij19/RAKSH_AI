import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { api } from "../api/client.js";
import { getCurrentLocation } from "../utils/location.js";

const starterQuestions = [
  "Is it safe to walk here at night?",
  "Should I avoid this route?",
  "Give me safety tips for this area."
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I am RakshAI. Ask me about routes, night travel, nearby alerts, or safety planning." }
  ]);
  const [input, setInput] = useState("");

  async function send(message = input) {
    if (!message.trim()) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }, { role: "assistant", text: "Thinking..." }]);
    try {
      const location = await getCurrentLocation().catch(() => null);
      const { data } = await api.post("/ai/chat", {
        message,
        context: location ? { location } : {}
      });
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: data.answer }]);
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.response?.data?.error || "Assistant unavailable." }]);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-5 text-center">
        <p className="text-sm font-black uppercase tracking-wide text-aurora dark:text-teal-200">AI Safety Assistant</p>
        <h1 className="mt-2 text-4xl font-black">Ask before you go.</h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Powered by Gemini AI with nearby incident and risk context</p>
      </div>
      <div className="glass grid min-h-[620px] grid-rows-[auto_1fr_auto] rounded-3xl">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 dark:border-white/10">
          {starterQuestions.map((question) => (
            <button key={question} type="button" onClick={() => send(question)} className="rounded-full bg-teal-500/10 px-4 py-2 text-sm font-bold text-aurora dark:text-teal-100">
              {question}
            </button>
          ))}
        </div>
        <div className="space-y-3 overflow-auto p-5">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[82%] rounded-3xl px-5 py-3 ${message.role === "user" ? "bg-aurora text-white" : "bg-white text-slate-800 dark:bg-white/10 dark:text-white"}`}>
                {message.role === "assistant" && <Bot className="mr-2 inline" size={17} />}
                {message.text}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex gap-3 border-t border-slate-200 p-4 dark:border-white/10"
        >
          <input value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/10" placeholder="Ask RakshAI..." />
          <button className="rounded-2xl bg-midnight px-5 py-3 text-white dark:bg-white dark:text-midnight" aria-label="Send message">
            <Send size={19} />
          </button>
        </form>
      </div>
    </section>
  );
}
