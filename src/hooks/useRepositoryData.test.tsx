// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { useRepositoryData } from "./useRepositoryData";
it("preserves a loaded chart during refresh and clears it when the pond changes", async () => {
  let resolve: (v: string) => void = () => {};
  let loader = () => Promise.resolve("Kolam A");
  const { result, rerender, unmount } = renderHook(
    ({ revision, scope }) => useRepositoryData(loader, revision, scope),
    { initialProps: { revision: "a:1", scope: "a" } },
  );
  await waitFor(() => expect(result.current.data).toBe("Kolam A"));
  loader = () =>
    new Promise<string>((r) => {
      resolve = r;
    });
  rerender({ revision: "a:2", scope: "a" });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.data).toBe("Kolam A");
  await act(async () => resolve("A diperbarui"));
  expect(result.current.data).toBe("A diperbarui");
  rerender({ revision: "b:1", scope: "b" });
  expect(result.current.data).toBeNull();
  expect(result.current.isLoading).toBe(true);
  await act(async () => resolve("Kolam B"));
  expect(result.current.data).toBe("Kolam B");
  unmount();
});
