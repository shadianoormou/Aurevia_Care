import { Component } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error("Aurevia Care UI error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen bg-[#f2f6f4] px-6 py-20 text-center">
        <div className="mx-auto max-w-md rounded-[2rem] border border-primary-100 bg-white p-8 shadow-xl shadow-primary-900/10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-600"><FiAlertTriangle /></span>
          <p className="eyebrow mt-6">Aurevia Care</p>
          <h1 className="font-display mt-2 text-3xl text-primary-900">A calm reset is needed.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">This screen hit an unexpected issue. Your account and orders are safe; refresh to continue.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6 inline-flex items-center gap-2"><FiRefreshCw /> Refresh securely</button>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
