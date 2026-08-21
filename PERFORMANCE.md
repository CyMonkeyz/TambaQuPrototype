# Performance Review

## Bundle Result

| Build | Initial main chunk | Gzip |
| --- | ---: | ---: |
| Before Phase 6 | 1,015.47 kB | 301.49 kB |
| After Phase 6 | 396.67 kB | 125.10 kB |

The Phase 6 result is the emitted `index` entry. The first HTML also preloads shared UI modules, so this number is a bundle boundary measurement rather than a claim about complete transfer cost or field performance.

## Code-Splitting Decisions

- Kept Login, the application shell, and Dashboard routing eager for a stable first experience.
- Lazy-loaded Ponds, Pond Detail, PondBrain, Peringatan, Reports, Devices, Settings, and Demo Control.
- Lazy-loaded the desktop Operations Dashboard after monitoring data resolves.
- Kept Water Quality and Risk Trend charts as deferred components.
- Added user-controlled recovery for stale dynamic-import chunks; it never reloads automatically.
- Did not raise `chunkSizeWarningLimit` and did not create many artificial manual vendor chunks.

## Known Heavy Dependencies

- Recharts and its graph dependencies emit a separate `LineChart` chunk of about 351.34 kB minified / 101.96 kB gzip. It is loaded only by chart-bearing routes/components.
- React Router, Dexie, Radix Dialog/Tooltip, Lucide, Sonner, and shared product code remain in the initial/shared graph.

## Runtime Review

- The simulator advances by scenario steps using one timeout, not by animation frames.
- The P0 Zustand object selector was replaced with a granular primitive selector.
- Expensive farm trend generation and pond sorting remain memoized at the data-boundary components where the calculation is meaningful.
- Reduced-motion preferences disable nonessential animation and smooth scrolling.

## Future Improvement

- Capture Lighthouse and Chrome performance traces on the target presentation laptop and representative Android hardware.
- Use field telemetry before setting real performance SLAs.
- Revisit chart-library weight only if measured load or interaction traces show it is a meaningful bottleneck.
