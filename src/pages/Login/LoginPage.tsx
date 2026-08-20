import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppLogo } from "../../components/common/AppLogo";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/toast-api";
import { getDemoSession } from "../../services/demoSession";
import { useAppStore } from "../../store/app-store";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Masuk");
  const [showPassword, setShowPassword] = useState(false);
  const enterDemo = useAppStore((state) => state.enterDemo);
  const hasSession = useAppStore((state) => Boolean(state.activeUser));
  const navigate = useNavigate();

  if (hasSession) return <Navigate to="/app/dashboard" replace />;

  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    toast.info("Autentikasi nyata belum tersedia pada MVP. Gunakan Mode Demo.");
  };

  const startDemo = () => {
    const { user, farm } = getDemoSession();
    enterDemo(user, farm);
    navigate("/app/dashboard");
  };

  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden bg-[#0b4f50] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 top-28 size-72 rounded-full border border-white/10" />
        <div className="absolute -right-6 top-44 size-72 rounded-full border border-white/10" />
        <AppLogo inverted />
        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
            Aquaculture intelligence platform
          </span>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.045em]">
            Keputusan tambak yang lebih cepat, sebelum risiko membesar.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/72">
            Pantau kualitas air, pahami tingkat risiko, dan tentukan tindakan
            berikutnya dalam satu ruang kerja.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">24/7</strong>
              <span className="mt-1 block text-white/65">Monitoring</span>
            </div>
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">4</strong>
              <span className="mt-1 block text-white/65">Kolam demo</span>
            </div>
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">1 ruang</strong>
              <span className="mt-1 block text-white/65">Kerja terpadu</span>
            </div>
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck size={17} />
          Decision-support untuk budidaya udang vaname
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <AppLogo />
          </div>
          <p className="text-sm font-semibold text-primary">Selamat datang</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Masuk ke TambaQu
          </h1>
          <p className="mt-3 leading-7 text-foreground-muted">
            Monitoring tambak yang jelas, preventif, dan mudah ditindaklanjuti.
          </p>
          <form className="mt-8 space-y-5" onSubmit={submitLogin}>
            <label className="block text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="-mt-3 h-12 w-full rounded-xl border border-border bg-white px-4 outline-none transition-colors focus:border-primary"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
            />
            <label className="block text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <div className="relative -mt-3">
              <input
                id="password"
                className="h-12 w-full rounded-xl border border-border bg-white px-4 pr-12 outline-none transition-colors focus:border-primary"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button className="w-full" type="submit">
              Login
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-foreground-muted">
            <span className="h-px flex-1 bg-border" />
            atau
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button className="w-full" variant="secondary" onClick={startDemo}>
            Masuk sebagai Demo <ArrowRight size={17} />
          </Button>
          <div className="mt-6 rounded-xl bg-surface-muted p-4 text-sm leading-6 text-foreground-muted">
            <strong className="text-foreground">Mode Demo</strong> · Data yang
            ditampilkan merupakan simulasi untuk kebutuhan demonstrasi, bukan
            hasil validasi lapangan.
          </div>
        </div>
      </section>
    </main>
  );
}
