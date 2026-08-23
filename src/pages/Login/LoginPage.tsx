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
    toast.info("Akun tim belum aktif di versi ini. Silakan gunakan Mode Demo.");
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
        <div className="relative w-24 rounded-3xl border border-white/20 bg-white p-3 shadow-xl shadow-black/10">
          <img
            src="/brand/tambaqu-lockup.png"
            alt="TambaQu"
            width={720}
            height={1000}
            className="h-auto w-full object-contain"
          />
        </div>
        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
            Ruang kerja operasional tambak
          </span>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.045em]">
            Lihat yang berubah. Tentukan apa yang perlu dilakukan.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/72">
            Data kualitas air, peringatan, dan catatan tindakan disatukan agar
            tim tambak tidak perlu menebak langkah berikutnya.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">24 jam</strong>
              <span className="mt-1 block text-white/70">Pemantauan</span>
            </div>
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">4 kolam</strong>
              <span className="mt-1 block text-white/70">Data contoh</span>
            </div>
            <div className="rounded-xl bg-white/[.08] p-4">
              <strong className="block text-xl">1 alur</strong>
              <span className="mt-1 block text-white/70">Pantau–tindak</span>
            </div>
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck size={17} />
          Panduan keputusan untuk budidaya udang vaname
        </p>
      </section>
      <section className="flex items-start justify-center px-5 py-8 lg:items-center lg:py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <AppLogo />
          </div>
          <p className="text-sm font-semibold text-primary">Coba TambaQu</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Buka ruang kerja tambak
          </h1>
          <p className="mt-3 leading-7 text-foreground-muted">
            Masuk ke mode demo untuk mencoba pemantauan kolam dan alur tindak
            lanjut dengan data contoh yang konsisten.
          </p>
          <Button className="mt-8 w-full" onClick={startDemo}>
            Masuk ke Mode Demo <ArrowRight size={17} />
          </Button>
          <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4 text-sm leading-6 text-foreground-muted">
            <strong className="text-foreground">Tentang data demo</strong>
            <span className="mt-1 block">
              Angka dan kejadian dibuat untuk memperagakan alur produk, bukan
              hasil pengamatan lapangan.
            </span>
          </div>
          <div className="my-6 flex items-center gap-3 text-xs font-medium text-foreground-muted">
            <span className="h-px flex-1 bg-border" />
            Akses tim tambak
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="mb-5 text-sm leading-6 text-foreground-muted">
            Akun operasional belum dihubungkan pada versi demo ini.
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
              required
            />
            <label className="block text-sm font-semibold" htmlFor="password">
              Kata sandi
            </label>
            <div className="relative -mt-3">
              <input
                id="password"
                className="h-12 w-full rounded-xl border border-border bg-white px-4 pr-12 outline-none transition-colors focus:border-primary"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                required
              />
              <button
                type="button"
                className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button className="w-full" type="submit">
              Masuk dengan Akun
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
