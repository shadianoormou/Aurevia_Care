import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiShield, FiTruck, FiClock } from "react-icons/fi";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";

const SYMPTOM_CHIPS = ["Fever", "Headache", "Cough", "Cold", "Allergy", "Acidity"];

const Home = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symptomQuery, setSymptomQuery] = useState("");

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const { data } = await api.get("/products", { params: { limit: 8, sort: "rating" } });
        setFeatured(data.products);
      } catch (error) {
        // fail silently on homepage
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSymptomSearch = (e) => {
    e.preventDefault();
    if (symptomQuery.trim()) {
      navigate(`/products?symptom=${encodeURIComponent(symptomQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Smart Symptom Search
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Your medicines, delivered with care.
            </h1>
            <p className="mt-4 text-gray-600">
              Tell us your symptoms and we'll point you toward relevant over-the-counter
              products — fast, simple, and reliable.
            </p>

            <form onSubmit={handleSymptomSearch} className="mt-6 flex bg-white rounded-full shadow-sm border border-gray-200 p-1">
              <input
                type="text"
                value={symptomQuery}
                onChange={(e) => setSymptomQuery(e.target.value)}
                placeholder="e.g. fever, headache, cough..."
                className="flex-1 px-4 py-2 rounded-full focus:outline-none text-sm"
              />
              <button type="submit" className="btn-primary rounded-full flex items-center gap-2">
                <FiSearch /> Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {SYMPTOM_CHIPS.map((s) => (
                <button
                  key={s}
                  onClick={() => navigate(`/products?symptom=${encodeURIComponent(s.toLowerCase())}`)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-primary-400 hover:text-primary-700"
                >
                  {s}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-5 max-w-md">
              ⚠️ This platform does not provide medical advice. Please consult a doctor or
              pharmacist before taking medicine.
            </p>
          </div>

          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700"
              alt="Pharmacy shelf with medicines"
              className="rounded-2xl shadow-lg w-full h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: <FiShield />, title: "Verified Products", desc: "Checked by our pharmacist team" },
          { icon: <FiTruck />, title: "Fast Delivery", desc: "Free shipping over ৳500" },
          { icon: <FiClock />, title: "Order Tracking", desc: "Know your order status anytime" },
        ].map((f) => (
          <div key={f.title} className="card p-5 flex items-start gap-3">
            <div className="text-primary-600 text-xl mt-1">{f.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Top Rated Products</h2>
          <Link to="/products" className="text-sm font-medium text-primary-600 hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : featured.length === 0 ? (
          <p className="text-gray-500 text-sm">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
