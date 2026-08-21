import { ChunkLoadError } from "./chunkLoadError";

function isChunkLoadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|loading chunk|chunkloaderror|failed to fetch/i.test(
    message,
  );
}

export async function loadWithRecovery<Module>(
  loader: () => Promise<Module>,
): Promise<Module> {
  try {
    return await loader();
  } catch (error) {
    if (isChunkLoadFailure(error)) throw new ChunkLoadError(error);
    throw error;
  }
}
