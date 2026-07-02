import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [disclaimer, setDisclaimer] = useState(null);

  const keyword = searchParams.get("keyword") || "";
  const symptom = searchParams.get("symptom") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page") || 1);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    setSearchParams(next);
  };

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories);
    } catch (error) {
      // ignore
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setDisclaimer(null);
    try {
      if (symptom) {
        // AI smart symptom search
        const { data } = await api.get("/products/search", { params: { q: symptom } });
        setProducts(data.products);
        setPages(1);
        setDisclaimer(data.disclaimer);
      } else {
        const { data } = await api.get("/products", {
          params: { keyword, category, sort, page, limit: 12 },
        });
        setProducts(data.products);
        setPages(data.pages);
      }
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, symptom, category, sort, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {symptom ? `Results for symptom: "${symptom}"` : keyword ? `Search results for "${keyword}"` : "All Products"}
      </h1>

      {disclaimer && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 my-4">
          ⚠️ {disclaimer}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateParam("category", "")}
                className={`block text-sm w-full text-left px-2 py-1 rounded ${!category ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => updateParam("category", c._id)}
                  className={`block text-sm w-full text-left px-2 py-1 rounded ${category === c._id ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort By</h3>
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No products found. Try a different search or filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {!symptom && pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam("page", String(p))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
