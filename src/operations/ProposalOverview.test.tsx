// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProposalOverview } from "./ProposalOverview";
import { productScope } from "./productScope";
afterEach(cleanup);
it("keeps advanced feeding separate from the MVP scope", () => {
  expect(productScope.feed.label).toBe("Tahap lanjutan");
  expect(productScope.aeration.label).toBe("Uji terkontrol");
  expect(productScope.biofloc.label).toBe("Catatan & uji air");
});
it("changes node placement without changing independent safety or transmitting requests", () => {
  render(<ProposalOverview />);
  expect(screen.getByText("Kolam A")).toBeTruthy();
  expect(screen.getByText("Data, akses, dan pengaman setiap kolam tetap terpisah.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "1 kolam besar" }));
  expect(screen.getByText("Titik 1")).toBeTruthy();
  expect(screen.queryByText("Kolam A")).toBeNull();
  expect(screen.getByRole("button", { name: "1 kolam besar" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "3 kolam berdekatan" }));
  expect(screen.getByText("Bagaimana pembagian biaya?")).toBeTruthy();
});
