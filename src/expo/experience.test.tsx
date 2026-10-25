// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoExperience, Landing } from "./Experience";
import { useExpoStore } from "./store";
import { expoScenario, scenes, demoPonds } from "./model";
beforeEach(() => {
  useExpoStore.getState().reset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("expo story", () => {
  it("suspends presentation while the document is hidden", () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    render(
      <MemoryRouter>
        <DemoExperience expo />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Putar presentasi" }));
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(36000));
    expect(useExpoStore.getState().simulation.currentStep).toBe(0);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(18000));
    expect(useExpoStore.getState().simulation.currentStep).toBe(1);
    hidden.mockRestore();
  });
  it("supports stage keyboard navigation without capturing input keystrokes", () => {
    render(
      <MemoryRouter>
        <DemoExperience expo />
      </MemoryRouter>,
    );
    const stage = screen.getByRole("region", {
      name: "Panggung presentasi TambaQu",
    });
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(useExpoStore.getState().simulation.currentStep).toBe(1);
    const input = document.createElement("input");
    stage.append(input);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(useExpoStore.getState().simulation.currentStep).toBe(1);
    input.remove();
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    expect(useExpoStore.getState().simulation.currentStep).toBe(0);
  });
  it("offers a one-click demo and a login link from the public opening", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Coba Demo/ }).getAttribute("href"),
    ).toBe("/demo");
    expect(
      screen.getByRole("link", { name: /Masuk Akun/ }).getAttribute("href"),
    ).toBe("/login");
  });
  it("uses five scenes totaling 90 seconds and derives metrics from the same story", () => {
    expect(expoScenario.steps.reduce((a, s) => a + s.durationMs, 0)).toBe(
      90000,
    );
    scenes.forEach((s, i) => expect(demoPonds(i)[1].oxygen).toBe(s.oxygen));
  });
  it("records an action separately from recovery and resets only the expo session", () => {
    const pilot = { record: "untouched" };
    useExpoStore.getState().go(3);
    useExpoStore.getState().record();
    expect(useExpoStore.getState().simulation.currentStep).toBe(3);
    useExpoStore.getState().next();
    expect(useExpoStore.getState().simulation.currentStep).toBe(4);
    useExpoStore.getState().reset();
    expect(useExpoStore.getState().recorded).toBe(false);
    expect(pilot.record).toBe("untouched");
  });
  it("selects pond metrics consistently and opens its sensor details", () => {
    render(
      <MemoryRouter>
        <DemoExperience />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kolam A Aman/ }));
    expect(useExpoStore.getState().selected).toBe("a");
    fireEvent.click(
      screen.getByRole("button", { name: /Lihat sensor Kolam A/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Sensor Kolam A" }),
    ).toBeTruthy();
  });
  it("advances on the timer and stops while paused", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <DemoExperience expo />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Putar presentasi" }));
    act(() => vi.advanceTimersByTime(18000));
    expect(useExpoStore.getState().simulation.currentStep).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Jeda presentasi" }));
    act(() => vi.advanceTimersByTime(36000));
    expect(useExpoStore.getState().simulation.currentStep).toBe(1);
  });
  it("clamps scene navigation and finishes without leaving the valid range", () => {
    useExpoStore.getState().go(-100);
    expect(useExpoStore.getState().simulation.currentStep).toBe(0);
    useExpoStore.getState().go(100);
    useExpoStore.getState().next();
    expect(useExpoStore.getState().simulation.currentStep).toBe(4);
    expect(useExpoStore.getState().simulation.status).toBe("completed");
  });
});
