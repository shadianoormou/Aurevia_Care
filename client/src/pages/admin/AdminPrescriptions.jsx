import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiFileText, FiFilter, FiRefreshCw, FiSearch, FiShield, FiXCircle } from "react-icons/fi";
import api from "../../api/axios.js";
import Loader from "../../components/Loader.jsx";

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Expired"];

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState({});
  const [dates, setDates] = useState({});
  const [saving, setSaving] = useState(null);

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await api.get("/prescriptions/admin");
      setPrescriptions(data.prescriptions || []);
    } catch { toast.error("Could not load the prescription queue"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const review = async (id, status) => {
    if (status === "Rejected" && !notes[id]?.trim()) { toast.error("Give the customer a reason for the rejection"); return; }
    setSaving(id);
    try {
      await api.put(`/prescriptions/admin/${id}`, { status, rejectionReason: notes[id], expiresAt: dates[id] || undefined });
      toast.success(status === "Approved" ? "Prescription approved" : "Prescription rejected");
      await load(true);
    } catch (error) { toast.error(error.response?.data?.message || "Review could not be saved"); }
    finally { setSaving(null); }
  };

  const viewFile = async (id) => {
    try {
      const { data } = await api.get(`/prescriptions/${id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { toast.error("The secure prescription file is not available"); }
  };

  const counts = useMemo(() => FILTERS.reduce((accumulator, filter) => {
    accumulator[filter] = filter === "All" ? prescriptions.length : prescriptions.filter((item) => item.status === filter).length;
    return accumulator;
  }, {}), [prescriptions]);

  const visiblePrescriptions = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return prescriptions.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesSearch = !phrase || [item.user?.name, item.user?.email, item.doctorName, item.prescriptionNumber, item.medicationDetails]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(phrase));
      return matchesStatus && matchesSearch;
    });
  }, [prescriptions, search, statusFilter]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-page-header">
        <div><p className="eyebrow">Clinical workflow</p><h1 className="admin-page-title">Prescription review queue</h1><p className="admin-page-subtitle">Protect the customer journey with a clear, pharmacist-led verification step.</p></div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary inline-flex items-center gap-2 text-xs"><FiRefreshCw className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh queue"}</button>
      </div>

      <div className="admin-metric-grid admin-prescription-metrics">
        <article className="admin-metric-card admin-metric-gold"><span className="admin-metric-icon"><FiFileText /></span><p className="admin-metric-label">Awaiting review</p><p className="admin-metric-value">{counts.Pending}</p><p className="admin-metric-foot">Needs a clinical decision</p></article>
        <article className="admin-metric-card admin-metric-green"><span className="admin-metric-icon"><FiCheckCircle /></span><p className="admin-metric-label">Approved</p><p className="admin-metric-value">{counts.Approved}</p><p className="admin-metric-foot">Ready for fulfilment</p></article>
        <article className="admin-metric-card admin-metric-violet"><span className="admin-metric-icon"><FiShield /></span><p className="admin-metric-label">Protected uploads</p><p className="admin-metric-value">{prescriptions.filter((item) => item.fileName).length}</p><p className="admin-metric-foot">Encrypted file access</p></article>
        <article className="admin-metric-card admin-metric-blue"><span className="admin-metric-icon"><FiFilter /></span><p className="admin-metric-label">Total queue</p><p className="admin-metric-value">{counts.All}</p><p className="admin-metric-foot">All submitted requests</p></article>
      </div>

      <div className="admin-panel mt-5">
        <div className="catalog-toolbar !border-0 !p-0 !shadow-none">
          <label className="relative flex-1 min-w-[15rem]"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, prescriber or medicine…" className="input-field pl-9 text-sm" /></label>
          <div className="flex flex-wrap gap-1.5">{FILTERS.map((filter) => <button key={filter} onClick={() => setStatusFilter(filter)} className={`rounded-full px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.08em] transition ${statusFilter === filter ? "bg-primary-900 text-accent-200" : "bg-primary-50 text-primary-700 hover:bg-primary-100"}`}>{filter} <span className="ml-1 opacity-60">{counts[filter]}</span></button>)}</div>
        </div>
      </div>

      {visiblePrescriptions.length === 0 ? <div className="admin-panel mt-5"><div className="admin-empty-state"><FiFileText /><p>No prescriptions match this view.</p></div></div> : <div className="space-y-5 mt-5">{visiblePrescriptions.map((item) => <article key={item._id} className="admin-panel">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="admin-status-pill admin-status-blue">{item.mode} submission</span><span className={`admin-status-pill ${item.status === "Pending" ? "admin-status-amber" : item.status === "Approved" ? "admin-status-green" : item.status === "Rejected" ? "admin-status-red" : "admin-status-violet"}`}>{item.status}</span></div><h2 className="font-display text-2xl text-primary-900 mt-2">{item.user?.name || "Customer"}</h2><p className="text-xs text-slate-500">{item.user?.email || "Phone-only account"} · submitted {new Date(item.createdAt).toLocaleString()}</p></div>{item.fileName && <button onClick={() => viewFile(item._id)} className="btn-secondary text-xs inline-flex items-center gap-1"><FiFileText /> Open protected file</button>}</div>
        <dl className="grid gap-4 sm:grid-cols-2 mt-6 text-sm"><div><dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Prescriber</dt><dd className="mt-1 font-semibold text-primary-900">{item.doctorName || "Not provided"}</dd></div><div><dt className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Reference</dt><dd className="mt-1 font-semibold text-primary-900">{item.prescriptionNumber || item.doctorRegistration || "Not provided"}</dd></div></dl>
        {item.medicationDetails && <div className="mt-5 rounded-2xl bg-primary-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-primary-600">Customer-entered medicine details</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.medicationDetails}</p></div>}
        {item.scanText && <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-primary-700">View OCR text</summary><p className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{item.scanText}</p></details>}
        {item.status === "Pending" && <div className="mt-6 grid gap-4 border-t border-primary-50 pt-5 lg:grid-cols-[1fr_auto]"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Expiry date <span className="font-normal text-slate-400">(for approval)</span><input type="date" value={dates[item._id] || ""} onChange={(event) => setDates({ ...dates, [item._id]: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-bold text-slate-600">Reason <span className="font-normal text-slate-400">(required for rejection)</span><input value={notes[item._id] || ""} onChange={(event) => setNotes({ ...notes, [item._id]: event.target.value })} className="input-field mt-1" placeholder="Clear, helpful explanation" /></label></div><div className="flex items-end gap-2"><button disabled={saving === item._id} onClick={() => review(item._id, "Rejected")} className="btn-secondary text-red-600 border-red-200"><FiXCircle className="inline mr-1" /> Reject</button><button disabled={saving === item._id} onClick={() => review(item._id, "Approved")} className="btn-primary"><FiCheckCircle className="inline mr-1" /> Approve</button></div></div>}
        {item.status === "Rejected" && <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {item.rejectionReason || "No reason recorded"}</p>}
      </article>)}</div>}
    </div>
  );
};

export default AdminPrescriptions;
