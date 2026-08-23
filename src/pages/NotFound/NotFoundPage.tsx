import { ArrowLeft, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#dff3f0] text-primary">
          <Waves size={27} />
        </span>
        <p className="mt-6 text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-foreground-muted">
          Alamat yang Anda buka tidak tersedia atau telah berpindah.
        </p>
        <Button
          className="mt-7"
          leadingIcon={<ArrowLeft size={17} />}
          onClick={() => history.back()}
        >
          Kembali
        </Button>
        <Link
          className="mt-4 block text-sm font-semibold text-primary"
          to="/app/dashboard"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
