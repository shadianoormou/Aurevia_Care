import { useState } from "react";
import {
  FiAlertTriangle, FiArrowUpRight, FiMapPin, FiMic, FiPhoneCall, FiSend, FiShield,
} from "react-icons/fi";
import api from "../api/axios.js";

const QUICK_PROMPTS = [
  "Rajshahi blood bank",
  "কাশি হলে কোন ডাক্তার?",
  "হাড়ে ব্যথা হলে কোথায় যাব?",
];

const EntryCards = ({ entries = [] }) => (
  <div className="mt-3 grid gap-2">
    {entries.slice(0, 3).map((entry) => (
      <article key={entry._id} className="rounded-2xl bg-white/90 border border-primary-100 px-3 py-3 text-left shadow-sm">
        <div className="flex gap-2 justify-between">
          <div className="min-w-0">
            <p className="font-bold text-primary-900 text-xs leading-5">{entry.name}</p>
            {entry.specialty && <p className="text-[11px] text-primary-600 mt-0.5">{entry.specialty}</p>}
          </div>
          <span className="shrink-0 uppercase tracking-[.13em] text-[9px] font-extrabold text-accent-700">{entry.kind.replace("_", " ")}</span>
        </div>
        <div className="flex gap-2 mt-2 text-[11px] leading-4 text-slate-600">
          <FiMapPin className="mt-0.5 shrink-0 text-primary-600" /> <span>{entry.address}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] font-semibold">
          {entry.phone && <a href={`tel:${entry.phone.replace(/[^+\d]/g, "")}`} className="inline-flex gap-1 items-center text-primary-700 hover:text-primary-900"><FiPhoneCall /> {entry.phone}</a>}
          {entry.email && <a href={`mailto:${entry.email}`} className="text-primary-700 hover:text-primary-900">Email contact</a>}
          <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex gap-1 items-center text-slate-500 hover:text-primary-800">Source <FiArrowUpRight /></a>
        </div>
      </article>
    ))}
  </div>
);

const CareConcierge = ({ className = "" }) => {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState([
    {
      id: "welcome", role: "assistant",
      text: "আমি Rajshahi Care Concierge। সমস্যা লিখুন বা বলুন—আমি verified contact ও কোন department দিয়ে শুরু করবেন তা দেখাব।",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const submit = async (rawMessage) => {
    const message = String(rawMessage || input).trim();
    if (!message || sending) return;
    setInput("");
    setConversation((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: message }]);
    setSending(true);
    try {
      const { data } = await api.post("/care-navigator/ask", { message });
      setConversation((current) => [...current, {
        id: `answer-${Date.now()}`, role: "assistant", text: data.careRoute.message,
        route: data.careRoute, entries: data.entries,
      }]);
    } catch (error) {
      setConversation((current) => [...current, {
        id: `error-${Date.now()}`, role: "assistant",
        text: error.response?.data?.message || "Directory-তে এখন সংযোগ হচ্ছে না। জরুরি হলে 999 বা নিকটস্থ emergency department-এ যোগাযোগ করুন।",
      }]);
    } finally { setSending(false); }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognition?.stop();
    const nextRecognition = new SpeechRecognition();
    nextRecognition.lang = "bn-BD";
    nextRecognition.interimResults = false;
    nextRecognition.maxAlternatives = 1;
    nextRecognition.onresult = (event) => submit(event.results[0][0].transcript);
    nextRecognition.onend = () => setRecognition(null);
    setRecognition(nextRecognition);
    nextRecognition.start();
  };

  return (
    <section className={`concierge-panel ${className}`} aria-label="Rajshahi Care Concierge">
      <div className="flex items-start justify-between gap-3 border-b border-primary-100 pb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-900 text-accent-300 flex items-center justify-center shadow-lg shadow-primary-900/20"><FiShield /></div>
          <div><p className="text-[10px] uppercase tracking-[.19em] font-extrabold text-accent-700">Aurevia intelligence</p><h2 className="font-display text-xl text-primary-900 leading-tight">Care Concierge</h2></div>
        </div>
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700">Rajshahi</span>
      </div>

      <div className="concierge-scroll py-4 space-y-3" aria-live="polite">
        {conversation.map((item) => (
          <div key={item.id} className={item.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[94%] rounded-2xl px-3.5 py-3 text-sm leading-5 ${item.role === "user" ? "bg-primary-900 text-white rounded-br-md" : item.route?.urgency === "emergency" ? "bg-red-50 text-red-950 border border-red-100 rounded-bl-md" : "bg-primary-50 text-slate-700 rounded-bl-md"}`}>
              {item.route?.urgency === "emergency" && <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-red-700"><FiAlertTriangle /> জরুরি বার্তা</p>}
              <p>{item.text}</p>
              {item.route?.nextStep && <p className="mt-2 text-xs font-semibold text-primary-800">পরের ধাপ: {item.route.nextStep}</p>}
              <EntryCards entries={item.entries} />
            </div>
          </div>
        ))}
        {sending && <div className="inline-flex items-center gap-2 bg-primary-50 rounded-2xl px-3 py-2 text-xs text-primary-700"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" /> যাচাই করা directory খোঁজা হচ্ছে…</div>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {QUICK_PROMPTS.map((prompt) => <button key={prompt} onClick={() => submit(prompt)} className="rounded-full border border-primary-100 bg-white px-2.5 py-1 text-[10px] font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50">{prompt}</button>)}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex items-center gap-1.5 rounded-2xl bg-primary-900 px-2 py-2 shadow-lg shadow-black/15">
        <input value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-primary-300 focus:outline-none" placeholder="লক্ষণ বা service লিখুন…" maxLength={800} />
        <button type="button" onClick={startVoice} disabled={sending} title="Speak your question" className={`rounded-xl p-2 text-primary-200 hover:bg-white/10 hover:text-white ${recognition ? "animate-pulse text-accent-300" : ""}`}><FiMic /></button>
        <button type="submit" disabled={sending || !input.trim()} className="rounded-xl bg-accent-400 p-2 text-primary-900 hover:bg-accent-300 disabled:opacity-40"><FiSend /></button>
      </form>
      <p className="mt-3 text-[10px] leading-4 text-slate-500">Source-attributed directory navigation only—not a diagnosis, prescription, or medicine-dose service. Always call to confirm availability.</p>
    </section>
  );
};

export default CareConcierge;
