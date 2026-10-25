// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DemoPreview } from "./DemoPreview";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it("lets visitors start and stop a clearly labelled local aerator example", () => {
  render(<DemoPreview kind="aeration" />);
  fireEvent.click(screen.getByRole("button", { name: "Coba nyalakan" }));
  expect(
    screen.getByRole("heading", { name: "Simulasi menyala" }),
  ).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain(
    "Kondisi air tidak diubah otomatis",
  );
  fireEvent.click(screen.getByRole("button", { name: "Hentikan simulasi" }));
  expect(screen.getByRole("heading", { name: "Siap dicoba" })).toBeTruthy();
});
it("keeps survey requests local and prevents duplicate clicks", () => {
  render(<DemoPreview kind="billing" />);
  fireEvent.click(screen.getByRole("button", { name: "Coba ajukan survei" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Contoh permintaan tercatat",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getByRole("status").textContent).toContain(
    "Tim layanan belum dihubungi",
  );
});
