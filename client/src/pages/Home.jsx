import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiFileText, FiShield, FiShoppingBag, FiStar } from "react-icons/fi";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";
import CareConcierge from "../components/CareConcierge.jsx";

const CATEGORY_VISUALS = {
  "Medicines & Wellness": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900",
  "Skin Care": "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900",
  "Hair & Scalp": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=900",
  "Oral & Dental": "https://images.unsplash.com/photo-1559591937-abc7f8a9c700?w=900",
  "Creams & First Aid": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900",
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [{ data: productData }, { data: categoryData }] = await Promise.all([
          api.get("/products", { params: { limit: 8, sort: "rating" } }),
          api.get("/categories"),
        ]);
        setFeatured(productData.products);
        setCategories(categoryData.categories || []);
      } finally { setLoading(false); }
    };
    loadFeatured();
  }, []);

  return (
    <div className="home-page overflow-hidden">
      <section className="luxury-hero relative bg-primary-900 text-white">
        <div className="luxury-grid absolute inset-0 opacity-30" /><div className="luxury-orb luxury-orb-one" /><div className="luxury-orb luxury-orb-two" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-11 pb-14 lg:pt-16 lg:pb-20 relative grid lg:grid-cols-[1.02fr_.98fr] gap-10 xl:gap-16 items-center">
          <div className="max-w-2xl"><p className="eyebrow-dark"><span className="w-1.5 h-1.5 rounded-full bg-accent-300 inline-block mr-2" />Bangladesh care, elevated</p><h1 className="font-display text-[2.9rem] sm:text-6xl lg:text-[4.25rem] leading-[.92] tracking-[-.04em] mt-5">Your personal<br /><em className="text-accent-200 font-normal">care concierge.</em></h1><p className="mt-6 max-w-xl text-base leading-7 text-primary-100">A polished pharmacy experience, secure prescription review and a location-aware Bangladesh care network—thoughtfully connected in one private space.</p><div className="flex flex-wrap gap-3 mt-8"><Link to="/care" className="luxury-primary-action">Meet the concierge <FiArrowUpRight /></Link><Link to="/prescriptions" className="luxury-secondary-action"><FiFileText /> Upload prescription</Link></div><div className="grid grid-cols-3 gap-3 mt-11 max-w-xl">{[{ value: "64+", label: "district-ready" }, { value: "Voice", label: "ask naturally" }, { value: "Source", label: "verified results" }].map((metric) => <div key={metric.value} className="border-l border-white/15 pl-3"><p className="font-display text-xl text-accent-200">{metric.value}</p><p className="text-[10px] uppercase tracking-[.1em] text-primary-200 mt-1">{metric.label}</p></div>)}</div></div>
          <div className="relative lg:pt-3"><div className="absolute -inset-8 rounded-[2.6rem] bg-accent-400/10 blur-3xl" /><CareConcierge className="relative" /></div>
        </div>
      </section>

      <section className="relative -mt-5 z-10 max-w-7xl mx-auto px-4 sm:px-6"><div className="luxury-rail grid md:grid-cols-3 gap-px overflow-hidden">{[{ icon: <FiShield />, overline: "Care intelligence", title: "Source before suggestion", desc: "Every local result links back to its published source." }, { icon: <FiFileText />, overline: "Prescription vault", title: "Private by design", desc: "Secure uploads with pharmacist review before fulfilment." }, { icon: <FiShoppingBag />, overline: "Pharmacy edit", title: "Only the essential", desc: "Clear product detail and accountable order progress." }].map((item) => <article key={item.overline} className="bg-white px-6 py-5 flex gap-4"><div className="mt-0.5 w-9 h-9 rounded-xl bg-primary-50 text-primary-800 flex items-center justify-center shrink-0">{item.icon}</div><div><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-accent-700">{item.overline}</p><h2 className="text-sm font-extrabold text-primary-900 mt-1">{item.title}</h2><p className="text-xs text-slate-500 leading-5 mt-1">{item.desc}</p></div></article>)}</div></section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-10"><div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p className="eyebrow">Shop by intention</p><h2 className="font-display text-4xl text-primary-900 leading-none mt-3">A considered edit<br />for everyday care.</h2></div><Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-primary-800 hover:text-accent-700">Explore all collections <FiArrowUpRight /></Link></div><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{categories.filter((item) => item.isFeatured).map((category) => <Link key={category._id} to={`/products?category=${category._id}`} className="home-collection-card group"><img src={CATEGORY_VISUALS[category.name]} alt="" /><span className="home-collection-shade" /><span className="relative flex h-full flex-col justify-end p-4 text-white"><span className="text-xl">{category.icon}</span><span className="mt-2 text-sm font-extrabold">{category.name}</span><span className="mt-1 text-[10px] leading-4 text-white/75">{category.subcategories?.length || 0} curated subcategories</span></span></Link>)}</div></section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-center"><div><p className="eyebrow">The care layer</p><h2 className="font-display text-4xl text-primary-900 leading-none mt-3">Less searching.<br />More certainty.</h2><p className="text-sm leading-7 text-slate-600 mt-5 max-w-md">Speak in Bangla or English. Start with a symptom, a blood-bank request or a diagnostic need; the concierge reads your district or division and shows only verified records available for that location.</p><Link to="/care" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-primary-800 hover:text-accent-700">Explore Bangladesh care guide <FiArrowUpRight /></Link></div><div className="care-steps-grid">{[["01", "Choose your location", "Mention a district or division in Bangla or English."], ["02", "Get a safe route", "It suggests a department—not a diagnosis or a dose."], ["03", "Confirm directly", "Call the displayed source-attributed contact before travel."]].map(([number, title, desc]) => <article key={number} className="care-step"><span>{number}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12"><div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p className="eyebrow"><FiStar className="inline mr-1" /> The Aurevia edit</p><h2 className="font-display text-3xl text-primary-900 mt-2">Pharmacy, pared back to what matters.</h2></div><Link to="/products" className="text-sm font-bold text-primary-700 hover:text-accent-700">View pharmacy <FiArrowUpRight className="inline" /></Link></div>{loading ? <Loader /> : featured.length === 0 ? <p className="text-gray-500 text-sm">No products are available yet.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">{featured.map((product) => <ProductCard key={product._id} product={product} />)}</div>}</section>
    </div>
  );
};

export default Home;
