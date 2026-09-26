import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  title?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WindowErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WindowErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-zinc-950 text-zinc-200 font-sans text-center space-y-4 select-none">
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-400 rounded-2xl shadow-xl animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white">
              Изолированный сбой в окне {this.props.title ? `"${this.props.title}"` : ''}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Остальные компоненты DevOS продолжить работать без потери данных (Crash-Guard Isolation).
            </p>
          </div>

          {this.state.error && (
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-mono text-red-300 max-w-lg overflow-x-auto text-left w-full">
              {this.state.error.message}
            </div>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Перезапустить окно</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
