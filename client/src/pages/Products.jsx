import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiChevronRight, FiFilter, FiGrid, FiSearch, FiShield, FiSliders } from "react-icons/fi";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";

const CATEGORY_VISUALS = {
  "Medicines & Wellness": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900",
  "Skin Care": "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=900",
  "Hair & Scalp": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=900",
  "Oral & Dental": "https://images.unsplash.com/photo-1559591937-abc7f8a9c700?w=900",
  "Creams & First Aid": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900",
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [disclaimer, setDisclaimer] = useState(null);

  const keyword = searchParams.get("keyword") || "";
  const symptom = searchParams.get("symptom") || "";
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const sort = searchParams.get("sort") || "popular";
  const page = Number(searchParams.get("page") || 1);
  const featuredCategories = useMemo(() => categories.filter((item) => item.isFeatured), [categories]);
  const activeCategory = useMemo(() => categories.find((item) => item._id === category), [categories, category]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    next.delete("page");
    setSearchParams(next);
  };

  const chooseCategory = (nextCategory) => {
    updateParams({ category: nextCategory, subcategory: "", symptom: "" });
  };

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories);
    } catch { setCategories([]); }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setDisclaimer(null);
    try {
      if (symptom) {
        const { data } = await api.get("/products/search", { params: { q: symptom } });
        setProducts(data.products); setPages(1); setTotal(data.products.length); setDisclaimer(data.disclaimer);
      } else {
        const { data } = await api.get("/products", { params: { keyword, category, subcategory, sort, page, limit: 16 } });
        setProducts(data.products); setPages(data.pages); setTotal(data.total);
      }
    } catch { setProducts([]); setTotal(0); } finally { setLoading(false); }
  }, [keyword, symptom, category, subcategory, sort, page]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const pageTitle = symptom ? `Results for “${symptom}”` : keyword ? `Search results for “${keyword}”` : activeCategory ? activeCategory.name : "The Aurevia shop";
  const pageCopy = activeCategory?.description || "Explore intentional pharmacy, skin, hair, oral and first-aid essentials—clearly organised for everyday care.";

  return (
    <div className="catalog-page pb-16">
      <section className="catalog-hero relative overflow-hidden bg-primary-900 text-white">
        <div className="luxury-grid absolute inset-0 opacity-20" />
        <div className="catalog-orb" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div><p className="eyebrow-dark">Aurevia collection house</p><h1 className="font-display text-4xl sm:text-5xl leading-[.95] mt-3">Care, curated<br /><em className="font-normal text-accent-200">beautifully.</em></h1><p className="max-w-xl mt-5 text-sm sm:text-base leading-7 text-primary-100">Shop medicine, skincare, hair, oral care and pharmaceutical creams through a calm, category-first pharmacy experience.</p></div>
          <a href="https://info.dgda.gov.bd/allopathic-medicines?page=1" target="_blank" rel="noreferrer" className="catalog-registry-link"><FiShield /><span><b>Need a medicine not listed?</b><br />Check Bangladesh’s DGDA registry</span><FiArrowUpRight /></a>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-7 relative z-10">
        <div className="catalog-rail" aria-label="Shop by primary category">
          {featuredCategories.map((item) => <button key={item._id} onClick={() => chooseCategory(item._id)} className={`catalog-category group ${category === item._id ? "catalog-category-active" : ""}`}><img src={CATEGORY_VISUALS[item.name]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-110 transition-transform duration-700" /><span className="catalog-category-overlay" /><span className="relative flex items-end justify-between gap-3 h-full"><span><span className="text-xl">{item.icon}</span><span className="block mt-4 text-sm font-extrabold">{item.name}</span><span className="block mt-1 text-[11px] text-white/75 line-clamp-2">{item.description}</span><span className="block mt-3 text-[10px] font-bold uppercase tracking-[.13em] text-accent-200">{item.subcategories?.length || 0} collections</span></span><FiChevronRight className="mb-1 opacity-70" /></span></button>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-11">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div><p className="eyebrow">Shop the collection</p><h2 className="font-display text-3xl sm:text-4xl text-primary-900 mt-2">{pageTitle}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{pageCopy}</p></div>
          <div className="flex flex-wrap gap-2"><Link to="/care" className="catalog-quiet-action"><FiShield /> Care concierge</Link><button onClick={() => chooseCategory("")} className="catalog-quiet-action"><FiGrid /> All collections</button></div>
        </div>

        {activeCategory?.subcategories?.length > 0 && <div className="catalog-subcategory-row mt-7"><button onClick={() => updateParams({ subcategory: "", symptom: "" })} className={`catalog-subcategory ${!subcategory ? "catalog-subcategory-active" : ""}`}>All {activeCategory.name}</button>{activeCategory.subcategories.map((item) => <button key={item._id} onClick={() => updateParams({ subcategory: item._id, symptom: "" })} className={`catalog-subcategory ${subcategory === item._id ? "catalog-subcategory-active" : ""}`}>{item.icon} {item.name}</button>)}</div>}

        {disclaimer && <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠️ {disclaimer}</div>}

        <div className="catalog-toolbar mt-8"><div className="flex items-center gap-2 text-sm font-bold text-primary-800"><FiFilter /> {loading ? "Updating collection…" : `${total} items curated for you`}</div><div className="flex items-center gap-3"><label className="relative hidden sm:block"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(event) => updateParams({ keyword: event.target.value, symptom: "" })} className="rounded-xl border border-primary-100 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Search the shop" /></label><label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600"><FiSliders /><select value={sort} onChange={(event) => updateParams({ sort: event.target.value })} className="bg-transparent focus:outline-none"><option value="popular">Most loved</option><option value="rating">Top rated</option><option value="price_asc">Price: low first</option><option value="price_desc">Price: high first</option></select></label></div></div>

        {loading ? <Loader /> : products.length === 0 ? <div className="catalog-empty"><p className="font-display text-2xl text-primary-900">Nothing here just yet.</p><p>Try another category, a simpler search, or ask the Care Concierge for help finding the right route.</p><button onClick={() => chooseCategory("")} className="btn-primary mt-5">View all collections</button></div> : <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-5">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}

        {!symptom && pages > 1 && <div className="flex justify-center gap-2 mt-10">{Array.from({ length: pages }, (_, index) => index + 1).slice(0, 8).map((item) => <button key={item} onClick={() => updateParams({ page: String(item) })} className={`w-10 h-10 rounded-xl text-sm font-bold ${item === page ? "bg-primary-800 text-white" : "bg-white border border-primary-100 text-primary-700 hover:bg-primary-50"}`}>{item}</button>)}</div>}

        <div className="catalog-safety-note mt-12"><FiShield /><p><b>Responsible catalogue policy.</b> Registered medicines, availability, price and packaging must be sourced from licensed suppliers and pharmacist-reviewed before publication. A registry record does not mean an item is in stock or suitable for self-treatment.</p></div>
      </section>
    </div>
  );
};

export default Products;
