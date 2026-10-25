// @vitest-environment jsdom
import "fake-indexeddb/auto";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, it, expect } from "vitest";
import Dexie from "dexie";
import { OperationsWorkspace } from "./Workspace";
import { LoginPage } from "../pages/Login/LoginPage";
afterEach(async () => {
  cleanup();
  await Dexie.delete("tambaqu-operations-demo");
});
it("offers local account signup without guest access", () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("button", { name: /Coba Demo/ })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Belum punya akun? Daftar" }),
  );
  expect(
    screen.getByRole("heading", { name: "Buat akun TambaQu" }),
  ).toBeTruthy();
  expect(
    screen.queryByText("Gunakan akun undangan dari tim tambakmu."),
  ).toBeNull();
});
it("loads a complete feed demo and keeps a rejected form editable", async () => {
  render(
    <MemoryRouter initialEntries={["/modules/feed"]}>
      <Routes>
        <Route
          path="/modules/:section"
          element={<OperationsWorkspace demo />}
        />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText("177", { exact: false }, { timeout: 20000 });
  fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
  fireEvent.change(screen.getByLabelText("Jenis pakan"), {
    target: { value: "Pakan pembesaran" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: /Jenis catatan/ }), {
    target: { value: "actual" },
  });
  fireEvent.change(screen.getByLabelText("Berat (kg)"), {
    target: { value: "999" },
  });
  fireEvent.change(screen.getByLabelText("Jadwal"), {
    target: { value: "2026-10-24T10:00" },
  });
  fireEvent.change(screen.getByLabelText("Catatan"), {
    target: { value: "Input tetap ada" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan catatan" }).closest("form")!,
  );
  await screen.findByText("Stok pakan tidak mencukupi.");
  expect((screen.getByLabelText("Catatan") as HTMLInputElement).value).toBe(
    "Input tetap ada",
  );
  fireEvent.change(screen.getByLabelText("Berat (kg)"), {
    target: { value: "1" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan catatan" }).closest("form")!,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog"),
    ).toBeNull(),
  );
  expect(await screen.findByText("176", { exact: false })).toBeTruthy();
}, 25000);

