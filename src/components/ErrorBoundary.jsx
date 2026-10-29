import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[WildShield ErrorBoundary caught error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 bg-[#0b0f19] border border-rose-500/30 rounded-2xl text-left my-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-300 font-sans tracking-wide uppercase">
                {this.props.title || "Section Render Interrupted"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                WildShield AI caught an unexpected component state and prevented a screen crash.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-900 text-[11px] font-mono text-rose-300/90 overflow-x-auto mb-4">
            {this.state.error?.message || "An unexpected error occurred during audio or state playback."}
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reload & Recover Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
