import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary-900 text-white mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div><div className="flex items-center gap-2.5"><img src="/aurevia-mark.svg" alt="" className="w-9 h-9" /><span className="flex flex-col leading-none"><span className="font-display text-lg font-bold tracking-tight">Aurevia <em className="not-italic text-accent-300">Care</em></span><span className="mt-1 text-[8px] font-extrabold uppercase tracking-[.16em] text-primary-300">Private pharmacy · Bangladesh</span></span></div><p className="text-sm text-primary-200 mt-3 leading-relaxed">A refined pharmacy and verified local-care experience—prescriptions, fulfilment, and Bangladesh-wide location-aware navigation in one considered system.</p></div>
      <div><h4 className="text-sm font-bold text-accent-300 mb-3">Care access</h4><ul className="space-y-2 text-sm text-primary-100"><li><Link to="/care" className="hover:text-white">Bangladesh care guide</Link></li><li><Link to="/products" className="hover:text-white">Shop essentials</Link></li><li><Link to="/prescriptions" className="hover:text-white">Prescription centre</Link></li><li><Link to="/my-orders" className="hover:text-white">Order tracking</Link></li></ul></div>
      <div><h4 className="text-sm font-bold text-accent-300 mb-3">Safety first</h4><p className="text-xs text-primary-200 leading-relaxed">Aurevia Care does not diagnose conditions or provide medical advice. In an emergency, contact local emergency services. Speak with a pharmacist or licensed clinician before taking medicine.</p></div>
    </div>
    <div className="border-t border-primary-800 py-4 text-center text-xs text-primary-300">© {new Date().getFullYear()} Aurevia Care. Secure digital pharmacy.</div>
  </footer>
);

export default Footer;
