const DEV_RELOAD_KEY = "tambaqu-dev-sw-cleanup";

export async function prepareDevelopmentServiceWorkerSafety() {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const localRegistrations = registrations.filter(
      (registration) =>
        new URL(registration.scope).origin === window.location.origin,
    );
    if (!localRegistrations.length) {
      sessionStorage.removeItem(DEV_RELOAD_KEY);
      return;
    }

    await Promise.all(
      localRegistrations.map((registration) => registration.unregister()),
    );
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("workbox-precache") || key.startsWith("tambaqu-"),
          )
          .map((key) => caches.delete(key)),
      );
    }

    if (
      navigator.serviceWorker.controller &&
      sessionStorage.getItem(DEV_RELOAD_KEY) !== "done"
    ) {
      sessionStorage.setItem(DEV_RELOAD_KEY, "done");
      window.location.reload();
      await new Promise<never>(() => undefined);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Development service worker cleanup could not complete", error);
    }
  }
}
