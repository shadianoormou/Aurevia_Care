import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiFileText, FiXCircle } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [dates, setDates] = useState({});
  const [saving, setSaving] = useState(null);

  const load = async () => {
    try { const { data } = await api.get("/prescriptions/admin"); setPrescriptions(data.prescriptions); }
    catch { toast.error("Could not load the prescription queue"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const review = async (id, status) => {
    if (status === "Rejected" && !notes[id]?.trim()) { toast.error("Give the customer a reason for the rejection"); return; }
    setSaving(id);
    try {
      await api.put(`/prescriptions/admin/${id}`, { status, rejectionReason: notes[id], expiresAt: dates[id] || undefined });
      toast.success(status === "Approved" ? "Prescription approved" : "Prescription rejected");
      await load();
    } catch (error) { toast.error(error.response?.data?.message || "Review could not be saved"); }
    finally { setSaving(null); }
  };

  const viewFile = async (id) => {
    try { const { data } = await api.get(`/prescriptions/${id}/file`, { responseType: "blob" }); const url = URL.createObjectURL(data); window.open(url, "_blank", "noopener,noreferrer"); setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    catch { toast.error("The secure prescription file is not available"); }
  };

  if (loading) return <Loader fullScreen />;
  const pending = prescriptions.filter((item) => item.status === "Pending");
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p className="text-xs uppercase tracking-[0.16em] text-accent-600 font-bold">Clinical workflow</p><h1 className="text-2xl font-bold text-primary-900 mt-1">Prescription review queue</h1><p className="text-sm text-slate-500 mt-2">Approve only legitimate, current prescriptions. Explain rejections clearly to the customer.</p></div><span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-sm font-bold px-3 py-1.5">{pending.length} awaiting review</span></div>
    {prescriptions.length === 0 ? <div className="card p-12 text-center text-slate-500">No prescriptions have been submitted.</div> : <div className="space-y-5">{prescriptions.map((item) => <article key={item._id} className="card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-primary-600">{item.mode} submission · {item.status}</p><h2 className="font-bold text-primary-900 mt-1">{item.user?.name}</h2><p className="text-sm text-slate-500">{item.user?.email} · submitted {new Date(item.createdAt).toLocaleString()}</p></div>{item.fileName && <button onClick={() => viewFile(item._id)} className="btn-secondary text-xs flex items-center gap-1"><FiFileText /> Open protected file</button>}</div>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-5 text-sm"><div><dt className="text-slate-400">Prescriber</dt><dd className="text-slate-800 font-medium">{item.doctorName || "Not provided"}</dd></div><div><dt className="text-slate-400">Reference</dt><dd className="text-slate-800 font-medium">{item.prescriptionNumber || item.doctorRegistration || "Not provided"}</dd></div></dl>
      {item.medicationDetails && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer-entered medicine details</p><p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{item.medicationDetails}</p></div>}
      {item.scanText && <details className="mt-4"><summary className="cursor-pointer text-sm text-primary-700 font-semibold">View OCR text</summary><p className="mt-2 text-sm bg-slate-50 text-slate-600 whitespace-pre-wrap rounded-xl p-3">{item.scanText}</p></details>}
      {item.status === "Pending" && <div className="mt-5 border-t border-slate-100 pt-5 grid lg:grid-cols-[1fr_auto] gap-4"><div className="grid sm:grid-cols-2 gap-3"><div><label className="text-sm text-slate-600">Expiry date <span className="text-slate-400">(for approval)</span></label><input type="date" value={dates[item._id] || ""} onChange={(event) => setDates({ ...dates, [item._id]: event.target.value })} className="input-field mt-1" /></div><div><label className="text-sm text-slate-600">Reason <span className="text-slate-400">(required for rejection)</span></label><input value={notes[item._id] || ""} onChange={(event) => setNotes({ ...notes, [item._id]: event.target.value })} className="input-field mt-1" placeholder="Clear, helpful explanation" /></div></div><div className="flex gap-2 items-end"><button disabled={saving === item._id} onClick={() => review(item._id, "Rejected")} className="btn-secondary text-red-600 border-red-200"><FiXCircle className="inline mr-1" /> Reject</button><button disabled={saving === item._id} onClick={() => review(item._id, "Approved")} className="btn-primary"><FiCheckCircle className="inline mr-1" /> Approve</button></div></div>}
      {item.status === "Rejected" && <p className="mt-4 text-sm text-red-600">Reason: {item.rejectionReason}</p>}
    </article>)}</div>}
  </div>;
};

export default AdminPrescriptions;
