import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/medimart-logo.svg"
              alt="MediMart AI Logo"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-gray-900">MediMart AI</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Your trusted smart e-pharmacy for everyday healthcare needs.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/products" className="hover:text-primary-600">All Products</Link></li>
            <li><Link to="/cart" className="hover:text-primary-600">My Cart</Link></li>
            <li><Link to="/my-orders" className="hover:text-primary-600">My Orders</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Disclaimer</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            This platform does not provide medical advice. Please consult a doctor or
            pharmacist before taking any medicine. In case of a medical emergency, contact
            your local emergency services immediately.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} MediMart AI. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
