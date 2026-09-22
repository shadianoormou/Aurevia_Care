import { useEffect, useState } from "react";
import { FiArchive, FiEdit3, FiExternalLink, FiPlus, FiRefreshCw, FiSave, FiX } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";

const kinds = ["doctor", "facility", "diagnostic", "blood_bank", "emergency"];
const blankEntry = () => ({ kind: "doctor", name: "", specialty: "", conditions: "", address: "", phone: "", email: "", availability: "", verificationNote: "", sourceLabel: "", sourceUrl: "", lastVerifiedAt: new Date().toISOString().slice(0, 10), isPublished: true });
const fromEntry = (entry) => ({ ...entry, conditions: (entry.conditions || []).join(", "), lastVerifiedAt: String(entry.lastVerifiedAt || "").slice(0, 10) });

const AdminCareDirectory = () => {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/care-directory"); setEntries(data.entries); } catch (error) { setNotice(error.response?.data?.message || "Could not load the directory."); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice("");
    try {
      const payload = { ...form, conditions: form.conditions.split(",").map((item) => item.trim()).filter(Boolean) };
      const response = form._id ? await api.put(`/admin/care-directory/${form._id}`, payload) : await api.post("/admin/care-directory", payload);
      setEntries((current) => form._id ? current.map((entry) => entry._id === form._id ? response.data.entry : entry) : [response.data.entry, ...current]);
      setForm(null); setNotice("Directory record saved with its source and verification date.");
    } catch (error) { setNotice(error.response?.data?.message || "Could not save this directory record."); } finally { setSaving(false); }
  };

  const archive = async (entry) => {
    if (!window.confirm(`Archive ${entry.name}? It will disappear from the public care guide.`)) return;
    try { await api.delete(`/admin/care-directory/${entry._id}`); setEntries((current) => current.map((item) => item._id === entry._id ? { ...item, isPublished: false } : item)); setNotice("Directory record archived."); } catch (error) { setNotice(error.response?.data?.message || "Could not archive this record."); }
  };

  if (loading) return <Loader fullScreen />;
  const field = (label, key, props = {}) => <label className="block text-xs font-bold text-slate-700">{label}<input value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="input-field mt-1 text-sm" {...props} /></label>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7"><div><p className="eyebrow">Operations</p><h1 className="font-display text-3xl text-primary-900 mt-1">Rajshahi care directory</h1><p className="text-sm text-slate-500 mt-2">Publish only provider-sourced records. Schedule and stock claims must be rechecked before publishing.</p></div><div className="flex gap-2"><button onClick={load} className="btn-secondary text-sm inline-flex items-center gap-2"><FiRefreshCw /> Refresh</button><button onClick={() => { setForm(blankEntry()); setNotice(""); }} className="btn-primary text-sm inline-flex items-center gap-2"><FiPlus /> Add verified record</button></div></div>
      {notice && <p className="mb-5 rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 text-sm text-primary-800">{notice}</p>}
      {form && <form onSubmit={save} className="card p-5 mb-7 border-primary-200"><div className="flex justify-between gap-4"><div><p className="eyebrow">{form._id ? "Update record" : "New record"}</p><h2 className="font-display text-2xl text-primary-900 mt-1">Source first, then publish.</h2></div><button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700"><FiX size={22} /></button></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5"><label className="block text-xs font-bold text-slate-700">Directory type<select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} className="input-field mt-1 text-sm">{kinds.map((kind) => <option key={kind} value={kind}>{kind.replace("_", " ")}</option>)}</select></label>{field("Name", "name", { required: true })}{field("Specialty", "specialty")}{field("Search terms (comma separated)", "conditions")}{field("Address", "address", { required: true })}{field("Phone", "phone")}{field("Email", "email", { type: "email" })}{field("Availability note", "availability")}{field("Source label", "sourceLabel", { required: true })}{field("Source URL", "sourceUrl", { type: "url", required: true, placeholder: "https://…" })}{field("Last verified", "lastVerifiedAt", { type: "date", required: true })}<label className="block text-xs font-bold text-slate-700 md:col-span-2 xl:col-span-3">Verification note<textarea value={form.verificationNote || ""} onChange={(event) => setForm((current) => ({ ...current, verificationNote: event.target.value }))} className="input-field mt-1 text-sm min-h-20" /></label></div><label className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-primary-800"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} /> Publish to public guide</label><div className="flex gap-3 mt-5"><button disabled={saving} className="btn-primary text-sm inline-flex items-center gap-2"><FiSave /> {saving ? "Saving…" : "Save verified record"}</button><button type="button" onClick={() => setForm(null)} className="btn-secondary text-sm">Cancel</button></div></form>}
      <div className="grid lg:grid-cols-2 gap-4">{entries.map((entry) => <article key={entry._id} className={`card p-5 ${entry.isPublished ? "" : "opacity-55"}`}><div className="flex items-start justify-between gap-3"><div><p className="directory-kind inline-block">{entry.kind.replace("_", " ")}</p><h2 className="font-bold text-primary-900 mt-3">{entry.name}</h2><p className="text-sm text-primary-700 mt-1">{entry.specialty}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.isPublished ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-500"}`}>{entry.isPublished ? "Published" : "Archived"}</span></div><p className="text-xs text-slate-500 mt-4">Last verified: {new Date(entry.lastVerifiedAt).toLocaleDateString("en-GB")} · {entry.sourceLabel}</p><a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex gap-1 items-center text-xs font-bold text-primary-700 hover:text-primary-900 mt-2">Open source <FiExternalLink /></a><div className="flex gap-2 mt-5"><button onClick={() => { setForm(fromEntry(entry)); setNotice(""); }} className="btn-secondary text-xs inline-flex items-center gap-1"><FiEdit3 /> Edit</button>{entry.isPublished && <button onClick={() => archive(entry)} className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex gap-1 items-center px-2"><FiArchive /> Archive</button>}</div></article>)}</div>
    </div>
  );
};

export default AdminCareDirectory;
