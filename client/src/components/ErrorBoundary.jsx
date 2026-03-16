import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // keep console for dev; in prod you can wire to Sentry later
    console.error("UI ERROR BOUNDARY:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-10 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FiAlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-gray-900 dark:text-slate-50 tracking-tight">Something went wrong</h2>
                <p className="text-sm font-bold text-gray-500 dark:text-slate-300 mt-2 leading-relaxed">
                  The UI crashed on this screen. Your data is safe — try reloading, or navigate to another module.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="px-5 py-3 rounded-2xl bg-gray-900 text-white dark:bg-slate-50 dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                    onClick={() => window.location.reload()}
                  >
                    Reload
                  </button>
                  <button
                    className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                    onClick={() => this.setState({ hasError: false, error: null })}
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

