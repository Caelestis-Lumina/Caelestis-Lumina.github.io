# RhineLabUI integration

Upstream: https://github.com/LBEILC/RhineLabUI

Reference revision inspected: `e27c2b357ed7e7a8c528dcd916cb2c1a059194df`.
Files imported from the user-provided local snapshot `E:/Repository/RhineLabUI-main` on 2026-09-09. This directory is a source snapshot without Git metadata; the reference revision does not assert an exact snapshot commit.

## 2026-09-09 upstream refresh

Downloaded the GitHub repository at `5abab02367465d9189f4ae65bcb6f17fdb5938f7` into the ignored `.verification/rhine-upstream` reference directory.
Updated both GLBs and imported `appearance.ts`, `glass-reveal.ts`, and `internal-optics.ts` from that revision. The material integration adopts the new `Index_Inlay` surface and optical compositing; the blog drives glass clarity from its own extraction progress.
The six assembly groups and depth offsets from the upstream model viewer are shared by `assembly.ts`, the standalone viewer and the blog's reading transition. Scene/article transitions, cancellation, history and summary UI remain blog-owned modules.
The updated cassette is 3,565,116 bytes and the assembly is 3,343,744 bytes. Model URLs include the revision for cache invalidation. New upstream audio, PWA, responsive layouts and demo content are not imported in this iteration.

The blog owner states that the upstream author has agreed to this reuse. Upstream code is Copyright (c) 2026 LBEILC, MIT. The complete license is distributed at `static/rhine/licenses/RhineLabUI-MIT.txt`.

## Reused assets and modules

- `static/rhine/assets/*.glb`: upstream cassette and assembly models, preserved binary assets.
- `knowledge/src/rhine/{scene,appearance,archive-lighting,motion,archive-loop,boot,boot-motion,scrub-title}.ts`: upstream rendering, camera, materials, motion and interaction code.
- `knowledge/src/rhine/reference.css`: upstream interface styling, font declarations adapted for the local asset paths.
- `knowledge/src/shell.html`: adapted upstream static interface markup.
- MiSans Regular and Bold: upstream official WOFF2 assets; NOTICE and original font license included alongside them. Only the two used weights are distributed.
- The font sources live in `knowledge/assets/fonts`; Vite emits them with content hashes. License and NOTICE files remain publicly accessible in `static/rhine/fonts`.
- Three.js: package license copied to `static/rhine/licenses/three-MIT.txt`.
- Rolling Number: upstream's dependency, with its MIT notice in `static/rhine/licenses/rolling-number.txt`.

## Intentional adaptations

- Blog-authored `brand.ts` replaces the interface/printed mark with the existing C/L blog identity.
- `data.ts` bridges the independent blog catalog into the scene. Fixed demo essays are not imported.
- The scene tracks selected article identity separately from render-pool slots; asset paths respect the site's base path, and lane rebasing uses the actual column count. Row rebasing is disabled because unequal lane lengths have no small common period.
- Boot text and canvas labels identify Caelestis Lumina; calibrated spatial motion and baseline lighting are retained.
- App orchestration, catalog/navigation, preferences, search and reading are maintained outside the upstream-derived modules.
- Homepage selection uses panel-free leader lines and typography, with centered transparent column controls. `scrub-title.ts` replaces the demo's flashing black strip with an interruptible, readable title reveal.
- `reading-shot.ts` is blog-authored choreography over the upstream assembly groups. `paper-surface.ts` provides a rigid blank plane with slot occlusion; no bending or article thumbnail textures. Text loading and the bounded scan/decoding overlay in `reader-reveal.ts` start only after the reading surface opens, without changing the article DOM. No new external models or textures are included. The standalone model viewer has been removed.

Upstream's MIT grant applies to its own code, not automatically to third-party marks or non-code assets. Model assets are reused under the permission reported by the blog owner, not relabeled as MIT. Original Arknights-related rights remain with their respective owners. No reference video or upstream demo essays are distributed.
