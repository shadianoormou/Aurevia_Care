import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiArrowUpRight, FiMapPin, FiPhoneCall, FiSearch, FiShield } from "react-icons/fi";
import api from "../api/axios.js";
import CareConcierge from "../components/CareConcierge.jsx";
import Loader from "../components/Loader.jsx";

const filters = [
  ["", "Everything"], ["doctor", "Doctors"], ["diagnostic", "Diagnostics"], ["blood_bank", "Blood support"], ["facility", "Hospitals"], ["emergency", "Emergency"],
];

const coverageLabels = { doctor: "Doctors", facility: "Hospitals", diagnostic: "Diagnostics", blood_bank: "Blood banks", emergency: "Emergency" };

const CareGuide = () => {
  const [entries, setEntries] = useState([]);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(false);

  useEffect(() => {
    api.get("/care-navigator/locations").then(({ data }) => setLocations(data.locations || [])).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    const loadDirectory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/care-navigator/directory", { params: { kind, q: query, division, district, limit: 30 } });
        setEntries(data.entries);
      } finally { setLoading(false); }
    };
    const timer = setTimeout(loadDirectory, query ? 220 : 0);
    return () => clearTimeout(timer);
  }, [kind, query, division, district]);

  useEffect(() => {
    const loadCoverage = async () => {
      setCoverageLoading(true);
      try {
        const { data } = await api.get("/care-navigator/coverage", { params: { division, district } });
        setCoverage(data.coverage || []);
      } catch { setCoverage([]); } finally { setCoverageLoading(false); }
    };
    loadCoverage();
  }, [division, district]);

  const countLabel = useMemo(() => `${entries.length} verified result${entries.length === 1 ? "" : "s"}`, [entries]);

  return (
    <div className="care-guide-page">
      <section className="bg-primary-900 text-white overflow-hidden relative">
        <div className="luxury-grid absolute inset-0 opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 relative grid lg:grid-cols-[1.05fr_.95fr] gap-8 items-start">
          <div className="pt-2"><p className="eyebrow-dark">Bangladesh, intelligently navigated</p><h1 className="font-display text-4xl sm:text-5xl leading-[.98] max-w-xl">A verified route to the right care.</h1><p className="mt-5 max-w-xl text-primary-100 leading-7">Choose a district or division, describe the symptom, and find only the source-attributed care contacts published for that location.</p><div className="flex items-center gap-2 mt-6 text-xs text-primary-200"><FiShield className="text-accent-300" /> No location fallback: unverified contacts are never invented.</div></div>
          <CareConcierge />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><p className="eyebrow">Bangladesh care directory</p><h2 className="font-display text-3xl text-primary-900 mt-1">Find a verified contact</h2><p className="text-sm text-slate-500 mt-2">Search by service and select the exact division or district. Coverage grows only through verified provider records.</p></div><div className="relative w-full lg:w-80"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field pl-9" placeholder="Doctor, test, blood bank…" /></div></div>
        <div className="grid sm:grid-cols-2 gap-3 mt-6 max-w-2xl"><label className="text-xs font-bold text-slate-600">Division<select value={division} onChange={(event) => { setDivision(event.target.value); setDistrict(""); }} className="input-field mt-1 text-sm"><option value="">All Bangladesh</option>{locations.map((item) => <option key={item.name} value={item.name}>{item.name} Division</option>)}</select></label><label className="text-xs font-bold text-slate-600">District<select value={district} onChange={(event) => setDistrict(event.target.value)} className="input-field mt-1 text-sm" disabled={!division}><option value="">All districts</option>{(locations.find((item) => item.name === division)?.districts || []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label></div>
        <div className="flex flex-wrap gap-2 mt-6">{filters.map(([value, label]) => <button key={label} onClick={() => setKind(value)} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${kind === value ? "bg-primary-900 text-white shadow-lg shadow-primary-900/15" : "bg-white text-primary-700 border border-primary-100 hover:border-primary-300"}`}>{label}</button>)}</div>
        <div className="mt-6 rounded-3xl border border-primary-100 bg-primary-50/60 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="eyebrow">Live coverage</p><p className="text-sm font-semibold text-primary-900 mt-1">{division || district ? `${district || division} coverage` : "Published Bangladesh coverage"}</p></div><a href="https://hrm.dghs.gov.bd/public/facility-registry" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary-800 hover:text-accent-700">Open DGHS registry <FiArrowUpRight /></a></div>
          {coverageLoading ? <p className="text-xs text-slate-500 mt-4">Refreshing verified coverage…</p> : coverage.length ? <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">{coverage.map((item) => <div key={item.kind} className="rounded-2xl bg-white border border-primary-100 px-3 py-3"><div className="flex items-center gap-2 text-primary-700"><FiActivity className="text-accent-700" /><span className="text-[10px] uppercase tracking-[.14em] font-bold">{coverageLabels[item.kind] || item.kind}</span></div><p className="font-display text-xl text-primary-900 mt-1">{item.recordCount}</p><p className="text-[10px] text-slate-500">verified record{item.recordCount === 1 ? "" : "s"}</p></div>)}</div> : <p className="text-xs leading-5 text-slate-600 mt-4">No published records are loaded for this scope yet. Use the official registry above, or ask the pharmacy admin to import a source-attributed record.</p>}
        </div>
        <div className="flex items-center justify-between mt-8"><p className="text-sm font-semibold text-primary-800">{loading ? "Updating results…" : countLabel}</p><p className="text-xs text-slate-500">Always call before travelling.</p></div>
        {loading ? <Loader /> : <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-4">{entries.map((entry) => <article className="directory-card" key={entry._id}><div className="flex justify-between gap-3"><span className="directory-kind">{entry.kind.replace("_", " ")}</span><span className="text-[10px] text-slate-400">Verified {new Date(entry.lastVerifiedAt).toLocaleDateString("en-GB")}</span></div><h3 className="font-display text-xl text-primary-900 mt-4">{entry.name}</h3>{entry.specialty && <p className="text-sm font-semibold text-primary-700 mt-1">{entry.specialty}</p>}<p className="flex gap-2 text-xs leading-5 text-slate-600 mt-4"><FiMapPin className="mt-0.5 shrink-0 text-primary-600" />{entry.address}</p>{entry.phone && <a href={`tel:${entry.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary-800 mt-4 hover:text-accent-700"><FiPhoneCall /> {entry.phone}</a>}{entry.email && <a href={`mailto:${entry.email}`} className="block text-xs font-semibold text-primary-700 mt-3">{entry.email}</a>}<p className="text-[11px] leading-4 text-slate-500 mt-3">{entry.availability}</p>{entry.verificationNote && <p className="text-[11px] leading-4 text-accent-700 mt-2">{entry.verificationNote}</p>}<a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-primary-700 hover:text-primary-900">View source <FiArrowUpRight /></a></article>)}</div>}
        {!loading && !entries.length && <div className="py-14 text-center"><p className="text-slate-600">No verified match yet for this location and service.</p><a href="https://hrm.dghs.gov.bd/public/facility-registry" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-primary-800 hover:text-accent-700">Check the official DGHS facility registry <FiArrowUpRight /></a></div>}
      </section>
    </div>
  );
};

export default CareGuide;
