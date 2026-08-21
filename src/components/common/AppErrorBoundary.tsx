import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { ChunkLoadError } from "../../utils/chunkLoadError";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("TambaQu render error", error, info.componentStack);
    }
  }

  private reload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkFailure = error instanceof ChunkLoadError;
    return (
      <main className="grid min-h-screen place-items-center bg-background p-5">
        <section
          className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)] sm:p-8"
          role="alert"
          aria-labelledby="app-error-title"
        >
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--risk-warning-bg)] text-risk-warning">
            <AlertTriangle aria-hidden="true" size={23} />
          </span>
          <h1 id="app-error-title" className="mt-5 text-xl font-semibold">
            {chunkFailure
              ? "Versi aplikasi telah diperbarui."
              : "TambaQu mengalami kendala."}
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {chunkFailure
              ? "Muat versi terbaru untuk melanjutkan. Data lokal dan tindakan yang menunggu sinkronisasi tetap tersimpan."
              : "Data Anda tetap tersimpan. Muat ulang aplikasi untuk mencoba kembali."}
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-surface-muted p-3 text-left text-xs text-risk-critical">
              {error.name}: {error.message}
            </pre>
          )}
          <Button
            className="mt-6"
            leadingIcon={<RefreshCw aria-hidden="true" size={17} />}
            onClick={this.reload}
          >
            {chunkFailure ? "Muat Versi Terbaru" : "Coba Muat Ulang"}
          </Button>
        </section>
      </main>
    );
  }
}
