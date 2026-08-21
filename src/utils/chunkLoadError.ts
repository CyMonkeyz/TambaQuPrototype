export class ChunkLoadError extends Error {
  constructor(cause?: unknown) {
    super("Versi aplikasi tidak lagi cocok dengan aset yang tersimpan.", {
      cause,
    });
    this.name = "ChunkLoadError";
  }
}
