import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiCheckCircle, FiClock, FiFileText, FiUpload, FiEdit3, FiXCircle } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";

const statusStyle = {
  Pending: "bg-amber-50 text-amber-800 border-amber-200",
  Approved: "bg-primary-50 text-primary-800 border-primary-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Expired: "bg-slate-100 text-slate-700 border-slate-200",
};

const PrescriptionCenter = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("scan");
  const [submitting, setSubmitting] = useState(false);
  const scanForm = useForm();
  const manualForm = useForm();

  const load = async () => {
    try {
      const { data } = await api.get("/prescriptions/my");
      setPrescriptions(data.prescriptions);
    } catch (error) { toast.error("We could not load your prescriptions"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submitScan = async (values) => {
    if (!values.file?.[0]) { toast.error("Choose a JPG, PNG, WEBP, or PDF prescription"); return; }
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => { if (key !== "file" && value) body.append(key, value); });
    body.append("file", values.file[0]);
    setSubmitting(true);
    try {
      const { data } = await api.post("/prescriptions/scan", body);
      toast.success(data.message);
      scanForm.reset();
      await load();
    } catch (error) { toast.error(error.response?.data?.message || "Your prescription could not be uploaded"); }
    finally { setSubmitting(false); }
  };

  const submitManual = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/prescriptions/manual", values);
      toast.success(data.message);
      manualForm.reset();
      await load();
    } catch (error) { toast.error(error.response?.data?.message || "Your prescription could not be submitted"); }
    finally { setSubmitting(false); }
  };

  const viewFile = async (id) => {
    try {
      const { data } = await api.get(`/prescriptions/${id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { toast.error("The protected prescription file is not available"); }
  };

  if (loading) return <Loader fullScreen />;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-[2rem] bg-primary-900 text-white p-7 sm:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-end">
        <div><p className="text-accent-300 text-xs font-bold tracking-[0.16em] uppercase">Protected care record</p><h1 className="text-3xl font-bold mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>Prescription centre</h1><p className="text-primary-100 text-sm mt-3 max-w-xl">Send a clear scan or enter prescription details manually. Nothing is supplied until a qualified pharmacist reviews it.</p></div>
        <div className="flex gap-3 text-xs text-primary-100"><span className="flex items-center gap-1"><FiUpload /> encrypted upload</span><span className="flex items-center gap-1"><FiCheckCircle /> pharmacist review</span></div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.25fr] gap-8 mt-8">
        <section className="card p-6 h-fit">
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6"><button onClick={() => setMode("scan")} className={`flex-1 py-2 text-sm rounded-lg font-semibold ${mode === "scan" ? "bg-white shadow-sm text-primary-800" : "text-slate-500"}`}>Scan / upload</button><button onClick={() => setMode("manual")} className={`flex-1 py-2 text-sm rounded-lg font-semibold ${mode === "manual" ? "bg-white shadow-sm text-primary-800" : "text-slate-500"}`}>Enter manually</button></div>
          {mode === "scan" ? <form onSubmit={scanForm.handleSubmit(submitScan)} className="space-y-4">
            <div><label className="text-sm font-semibold text-slate-700">Prescription file</label><label className="mt-2 border-2 border-dashed border-primary-200 bg-primary-50/40 rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer hover:bg-primary-50"><FiUpload className="text-primary-700 text-2xl" /><span className="text-sm font-semibold text-primary-800 mt-2">Choose a scan or photo</span><span className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP, or PDF · up to 10 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" {...scanForm.register("file")} /></label></div>
            <div><label className="text-sm text-slate-600">Prescriber name <span className="text-slate-400">(optional)</span></label><input className="input-field mt-1" {...scanForm.register("doctorName")} /></div>
            <div><label className="text-sm text-slate-600">Reference / prescription number <span className="text-slate-400">(optional)</span></label><input className="input-field mt-1" {...scanForm.register("prescriptionNumber")} /></div>
            <div><label className="text-sm text-slate-600">Note for the pharmacist <span className="text-slate-400">(optional)</span></label><textarea rows={3} className="input-field mt-1" {...scanForm.register("note")} /></div>
            <button disabled={submitting} className="btn-primary w-full">{submitting ? "Securing your file…" : "Submit for verification"}</button>
          </form> : <form onSubmit={manualForm.handleSubmit(submitManual)} className="space-y-4">
            <div><label className="text-sm text-slate-600">Prescriber name</label><input className="input-field mt-1" {...manualForm.register("doctorName", { required: true })} /></div>
            <div><label className="text-sm text-slate-600">Registration / licence number <span className="text-slate-400">(if available)</span></label><input className="input-field mt-1" {...manualForm.register("doctorRegistration")} /></div>
            <div><label className="text-sm text-slate-600">Prescription number <span className="text-slate-400">(if available)</span></label><input className="input-field mt-1" {...manualForm.register("prescriptionNumber")} /></div>
            <div><label className="text-sm text-slate-600">Medicine and directions on the prescription</label><textarea rows={4} className="input-field mt-1" {...manualForm.register("medicationDetails", { required: true })} /></div>
            <div><label className="text-sm text-slate-600">Note for the pharmacist <span className="text-slate-400">(optional)</span></label><textarea rows={2} className="input-field mt-1" {...manualForm.register("note")} /></div>
            <button disabled={submitting} className="btn-primary w-full">{submitting ? "Submitting…" : "Submit for verification"}</button>
          </form>}
        </section>

        <section><div className="flex items-center justify-between mb-4"><div><p className="text-xs uppercase tracking-[0.16em] text-accent-600 font-bold">Your record</p><h2 className="text-xl font-bold text-primary-900 mt-1">Verification status</h2></div><span className="text-sm text-slate-500">{prescriptions.length} submitted</span></div>
          {prescriptions.length === 0 ? <div className="card p-10 text-center"><FiFileText className="mx-auto text-primary-300 text-3xl" /><p className="font-semibold text-slate-700 mt-3">No prescriptions yet</p><p className="text-sm text-slate-500 mt-1">Upload a scan or enter details when you need prescription medicine.</p></div> : <div className="space-y-4">{prescriptions.map((prescription) => <article key={prescription._id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${statusStyle[prescription.status]}`}><FiClock className="inline mr-1" />{prescription.status}</span><span className="text-xs text-slate-400 capitalize">{prescription.mode} entry</span></div><h3 className="font-bold text-primary-900 mt-3">{prescription.doctorName || "Prescription scan"}</h3><p className="text-sm text-slate-500 mt-1">Submitted {new Date(prescription.createdAt).toLocaleDateString()}</p></div>{prescription.fileName && <button onClick={() => viewFile(prescription._id)} className="btn-secondary text-xs flex items-center gap-1"><FiFileText /> View file</button>}</div>
            {prescription.medicationDetails && <p className="text-sm text-slate-600 mt-4 leading-relaxed">{prescription.medicationDetails}</p>}
            {prescription.status === "Approved" && <p className="mt-3 text-sm text-primary-700 flex items-center gap-2"><FiCheckCircle /> Approved{prescription.expiresAt ? ` until ${new Date(prescription.expiresAt).toLocaleDateString()}` : ""}</p>}
            {prescription.status === "Rejected" && <p className="mt-3 text-sm text-red-600 flex items-center gap-2"><FiXCircle /> {prescription.rejectionReason || "Please submit a clearer prescription or contact support."}</p>}
            {prescription.scanText && <details className="mt-4 text-sm"><summary className="cursor-pointer text-primary-700 font-semibold">Extracted text</summary><p className="mt-2 whitespace-pre-wrap text-slate-500 bg-slate-50 rounded-xl p-3">{prescription.scanText}</p></details>}
          </article>)}</div>}
        </section>
      </div>
    </div>
  );
};

export default PrescriptionCenter;
