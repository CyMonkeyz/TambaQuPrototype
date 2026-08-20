import { useState } from "react";
import type { Recommendation } from "../../domain/risk";
import { formatWibTime } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Overlay";

export function ActionConfirmationDialog({
  recommendation,
  timestamp,
  isSaving,
  onClose,
  onSave,
}: {
  recommendation: Recommendation | null;
  timestamp: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  const close = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog
      open={Boolean(recommendation)}
      onOpenChange={(open) => !open && close()}
      title="Konfirmasi Tindakan"
      description="Pastikan tindakan sudah benar-benar dilakukan di lapangan sebelum mencatatnya."
    >
      {recommendation && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(notes);
            setNotes("");
          }}
        >
          <div className="rounded-xl bg-surface-muted p-4">
            <p className="text-xs text-foreground-muted">Tindakan</p>
            <p className="mt-1 font-semibold">{recommendation.title}</p>
            <p className="mt-3 text-xs text-foreground-muted">Waktu</p>
            <p className="mt-1 text-sm font-medium">
              {formatWibTime(timestamp)}
            </p>
          </div>
          <label
            htmlFor="action-notes"
            className="mt-5 block text-sm font-semibold"
          >
            Tambahkan catatan{" "}
            <span className="font-normal text-foreground-muted">
              (opsional)
            </span>
          </label>
          <textarea
            id="action-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
            placeholder="Contoh: Aerator tambahan diaktifkan"
          />
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Simpan Tindakan
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
