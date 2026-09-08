# RhineLabUI integration

Upstream: https://github.com/LBEILC/RhineLabUI

Reference revision inspected: `e27c2b357ed7e7a8c528dcd916cb2c1a059194df`.
Files imported from the user-provided local snapshot `E:/Repository/RhineLabUI-main` on 2026-09-09. This directory is a source snapshot without Git metadata; the reference revision does not assert an exact snapshot commit.

The blog owner states that the upstream author has agreed to this reuse. Upstream code is Copyright (c) 2026 LBEILC, MIT. The complete license is distributed at `static/rhine/licenses/RhineLabUI-MIT.txt`.

## Reused assets and modules

- `static/rhine/assets/*.glb`: upstream cassette and assembly models, preserved binary assets.
- `knowledge/src/rhine/{scene,appearance,archive-lighting,motion,archive-loop,boot,boot-motion,scrub-title,model-viewer}.ts`: upstream rendering, camera, materials, motion and interaction code.
- `knowledge/src/rhine/reference.css`: upstream interface styling, font declarations adapted for the local asset paths.
- `knowledge/src/shell.html`: adapted upstream static interface markup.
- MiSans Regular and Bold: upstream official WOFF2 assets; NOTICE and original font license included alongside them. Only the two used weights are distributed.
- Rolling Number: upstream's dependency, with its MIT notice in `static/rhine/licenses/rolling-number.txt`.

## Intentional adaptations

- Blog-authored `brand.ts` replaces the interface/printed mark with the existing C/L blog identity.
- `data.ts` bridges the independent blog catalog into the scene. Fixed demo essays are not imported.
- The scene tracks selected article identity separately from render-pool slots; asset paths respect the site's base path, and lane rebasing uses the actual column count. Row rebasing is disabled because unequal lane lengths have no small common period.
- Boot text and canvas labels identify Caelestis Lumina; calibrated spatial motion and baseline lighting are retained.
- App orchestration, catalog/navigation, preferences, search and reading are maintained outside the upstream-derived modules.

Upstream's MIT grant applies to its own code, not automatically to third-party marks or non-code assets. Model assets are reused under the permission reported by the blog owner, not relabeled as MIT. Original Arknights-related rights remain with their respective owners. No reference video or upstream demo essays are distributed.
