import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="max-w-md mx-auto px-4 py-24 text-center">
    <h1 className="text-6xl font-bold text-primary-600">404</h1>
    <p className="text-gray-600 mt-4">Sorry, the page you're looking for doesn't exist.</p>
    <Link to="/" className="btn-primary inline-block mt-6">Back to Home</Link>
  </div>
);

export default NotFound;
