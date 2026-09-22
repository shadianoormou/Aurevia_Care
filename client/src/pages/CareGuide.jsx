import { useEffect, useMemo, useState } from "react";
import { FiArrowUpRight, FiMapPin, FiPhoneCall, FiSearch, FiShield } from "react-icons/fi";
import api from "../api/axios.js";
import CareConcierge from "../components/CareConcierge.jsx";
import Loader from "../components/Loader.jsx";

const filters = [
  ["", "Everything"], ["doctor", "Doctors"], ["diagnostic", "Diagnostics"], ["blood_bank", "Blood support"], ["facility", "Hospitals"], ["emergency", "Emergency"],
];

const CareGuide = () => {
  const [entries, setEntries] = useState([]);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDirectory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/care-navigator/directory", { params: { kind, q: query, limit: 30 } });
        setEntries(data.entries);
      } finally { setLoading(false); }
    };
    const timer = setTimeout(loadDirectory, query ? 220 : 0);
    return () => clearTimeout(timer);
  }, [kind, query]);

  const countLabel = useMemo(() => `${entries.length} verified result${entries.length === 1 ? "" : "s"}`, [entries]);

  return (
    <div className="care-guide-page">
      <section className="bg-primary-900 text-white overflow-hidden relative">
        <div className="luxury-grid absolute inset-0 opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 relative grid lg:grid-cols-[1.05fr_.95fr] gap-8 items-start">
          <div className="pt-2"><p className="eyebrow-dark">Rajshahi, intelligently navigated</p><h1 className="font-display text-4xl sm:text-5xl leading-[.98] max-w-xl">A verified route to the right care.</h1><p className="mt-5 max-w-xl text-primary-100 leading-7">Doctor speciality, diagnostic centres, blood-support contacts and emergency routes—kept in an editable, source-attributed SQL directory.</p><div className="flex items-center gap-2 mt-6 text-xs text-primary-200"><FiShield className="text-accent-300" /> Every result includes its source and last verification date.</div></div>
          <CareConcierge />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><p className="eyebrow">Local care directory</p><h2 className="font-display text-3xl text-primary-900 mt-1">Find a verified contact</h2></div><div className="relative w-full lg:w-80"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field pl-9" placeholder="Doctor, test, blood bank…" /></div></div>
        <div className="flex flex-wrap gap-2 mt-6">{filters.map(([value, label]) => <button key={label} onClick={() => setKind(value)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${kind === value ? "bg-primary-900 text-white shadow-lg shadow-primary-900/15" : "bg-white text-primary-700 border border-primary-100 hover:border-primary-300"}`}>{label}</button>)}</div>
        <div className="flex items-center justify-between mt-8"><p className="text-sm font-semibold text-primary-800">{loading ? "Updating results…" : countLabel}</p><p className="text-xs text-slate-500">Always call before travelling.</p></div>
        {loading ? <Loader /> : <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-4">{entries.map((entry) => <article className="directory-card" key={entry._id}><div className="flex justify-between gap-3"><span className="directory-kind">{entry.kind.replace("_", " ")}</span><span className="text-[10px] text-slate-400">Verified {new Date(entry.lastVerifiedAt).toLocaleDateString("en-GB")}</span></div><h3 className="font-display text-xl text-primary-900 mt-4">{entry.name}</h3>{entry.specialty && <p className="text-sm font-semibold text-primary-700 mt-1">{entry.specialty}</p>}<p className="flex gap-2 text-xs leading-5 text-slate-600 mt-4"><FiMapPin className="mt-0.5 shrink-0 text-primary-600" />{entry.address}</p>{entry.phone && <a href={`tel:${entry.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary-800 mt-4 hover:text-accent-700"><FiPhoneCall /> {entry.phone}</a>}{entry.email && <a href={`mailto:${entry.email}`} className="block text-xs font-semibold text-primary-700 mt-3">{entry.email}</a>}<p className="text-[11px] leading-4 text-slate-500 mt-3">{entry.availability}</p>{entry.verificationNote && <p className="text-[11px] leading-4 text-accent-700 mt-2">{entry.verificationNote}</p>}<a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-primary-700 hover:text-primary-900">View source <FiArrowUpRight /></a></article>)}</div>}
        {!loading && !entries.length && <p className="py-14 text-center text-slate-500">No verified match yet. Try a department or service name.</p>}
      </section>
    </div>
  );
};

export default CareGuide;
