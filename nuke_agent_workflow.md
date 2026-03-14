# Nuke Agent Integration — Workflow

> **Proven methodology.** Adapted from backend WORKFLOW.md (CHATV5 40/40, Codebase Audit 54/54).
> Extended with 3D/WebGL-specific guardrails derived from production research.
> **Created:** 2026-03-13

---

## The Rule

**One step. One change. Visually verified. Committed. Pushed. Then next.**

No batch edits across multiple systems. No "while I'm here" tangents. No marking complete until the Visual Proof Gate passes.

---

## Before Every Session

1. **Read `nuke_agent_workflow.md`** — you are here. This is the process.
2. **Read `nuke_agent_integration.md`** — this is the integration plan and source of truth.
3. **Read `git log --oneline -5`** — verify last commit matches integration state.
4. **Pick ONE step** — follow the integration plan order. No skipping.
5. **State what you're implementing** — quote the step ID (e.g., "Implementing NA-3: NukeScene component").
6. **Do not touch anything outside the step scope.**

---

## The Fix Loop (8 steps, no skipping)

### Step 1: REGROUND

Before touching any code:
- Read the integration plan in full
- Run `git pull origin main`
- Read `git log --oneline -5`
- Confirm the step is still PENDING (not completed by a previous session)
- Confirm no 3D-related components have been added outside this workflow

### Step 2: READ (understand before touching)

Read **every file involved** in the step. For 3D integration this is critical:

Checklist:
- [ ] Read every component that will be modified
- [ ] Read the CSS classes referenced by those components
- [ ] Read `App.tsx` to understand the render tree
- [ ] Read `vite.config.ts` if build config changes are needed
- [ ] Read `package.json` to verify dependency versions
- [ ] Read `tailwind.config.ts` if animation classes are being added
- [ ] If modifying GSAP: read ALL existing GSAP usages (Hero, Services, Manifesto, Navbar, NukeCompanion)
- [ ] If modifying scroll behavior: read `SmoothScrollProvider.tsx` (Lenis config)
- [ ] If the step involves the Canvas: read all existing event handlers in surrounding DOM

**Do NOT proceed to Step 3 until all reads are done.**

### Step 3: PLAN (state the exact change)

Write out in plain English:
- What file(s) will be created or edited
- What the component does (expected behavior)
- How it connects to the existing render tree
- Why this approach is correct (reference specific code, not memory)
- **What could break** — identify collision risks with existing GSAP, Lenis, or event systems

**Do NOT proceed to Step 4 until the plan is stated.**

### Step 4: EDIT (make the change)

- Edit the minimum number of lines needed
- Follow existing code patterns (glassmorphic style, Tailwind + custom CSS approach)
- **Never inline >20 lines of CSS in JSX** — use CSS classes in `index.css`
- If adding a new component: also add the mount point in the same step
- If adding GSAP: use the same `gsap.registerPlugin()` + cleanup pattern as existing components

### Step 5: VERIFY — Code Correctness

Run ALL of these:
```
1. npx tsc --noEmit                              # TypeScript type check
2. Verify no new TS errors introduced
3. grep for the component — confirm it's imported and mounted
4. grep for any duplicate component names or IDs
5. npm run build                                  # Full Vite production build
```

**If any check fails, go back to Step 4. Do NOT proceed.**

### Step 6: VERIFY — Visual Proof Gate (MANDATORY)

This replaces the backend "Integration Proof Gate" with visual verification.

For EVERY step, verify:
1. **Dev server starts** — `npm run dev` runs without errors
2. **No console errors** — browser console is clean (no WebGL warnings, no missing textures, no CORS)
3. **No layout shifts** — existing page sections (Hero, Services, TelemetryFeed, Manifesto, SystemFooter) are unaffected
4. **No interaction breakage** — existing hover effects, scroll animations, and click handlers still work
5. **Step-specific visual check** — described in the integration plan for each step

#### 3D-Specific Visual Checks:
- Canvas renders with transparent background (no black/white rectangle)
- Model is visible and correctly positioned
- No z-fighting between 3D and DOM layers
- Pointer events pass through to DOM where expected
- Frame rate stays above 30fps on the dev machine
- No memory leaks on navigation (check browser Performance tab)

**If any Visual Check fails: the step is incomplete. Go back to Step 4.**

### Step 7: RECORD (update the integration plan)

- Update the integration plan: change step status from `PENDING` to `DONE`
- Add date and one-line description of what was implemented
- Record which Visual Checks passed
- Note any NEW issues discovered during the step (add as notes)
- **Do NOT update the plan until Steps 5 AND 6 both pass**

### Step 8: COMMIT AND PUSH

```bash
git add <specific files>
git commit -m "feat(website): [NA-N] one-line description"
git push origin main
```

- Verify push succeeded (Vercel auto-deploys from main)
- Check Vercel deployment — confirm build succeeds
- **If push fails, do NOT mark as complete. Fix the push issue first.**

---

## 3D Integration Rules — NEVER Violate

### Rule 1: ONE Canvas, ONE Scene
There is **one** R3F `<Canvas>` in the entire application. It lives in a fixed-position overlay component. All 3D content goes inside this single Canvas. Never create a second Canvas.

### Rule 2: Canvas MUST Be Transparent
The Canvas uses `gl={{ alpha: true }}` and has CSS `background: transparent`. It must never obscure the DOM content beneath it. The Canvas is a floating layer — the page scrolls beneath it.

### Rule 3: Pointer Events — Canvas Does NOT Block DOM
The Canvas element itself has `pointerEvents: 'none'` in CSS. The 3D model mesh re-enables pointer events only on itself (`onPointerOver`/`onPointerOut`/`onClick`). This ensures all page interactions (buttons, links, scroll, hover effects) work through the Canvas layer.

### Rule 4: Never Import `THREE` Directly for Rendering
Use R3F declarative JSX (`<mesh>`, `<meshStandardMaterial>`, etc.) and Drei helpers (`useGLTF`, `Html`, `useAnimations`). Direct `new THREE.Mesh()` is only acceptable for geometry helpers or math utilities, never for scene graph objects.

### Rule 5: GSAP Drives Position, useFrame Drives Idle
- **GSAP** controls macro movement: fly-in, section-to-section flight, landing. These are tweens on a React ref that updates the `<group>` position.
- **useFrame** controls micro animation: idle bobbing, gentle rotation, reactor pulse. These run every frame inside the R3F render loop.
- **Never mix**: Don't use `useFrame` for position flight. Don't use GSAP to animate materials.

### Rule 6: Model Must Be Preloaded
Call `useGLTF.preload('/models/astronaut_final.glb')` at module scope. The model MUST load before the Canvas mounts, not lazily. This prevents flash-of-empty-canvas.

### Rule 7: No Orphaned Components
Every component created must be:
1. Imported somewhere
2. Mounted in the render tree
3. Have its CSS classes defined (if any)
4. Have cleanup in `useEffect` return

### Rule 8: Respect Existing Scroll System
The site uses **Lenis** for smooth scrolling. GSAP `ScrollTrigger` is used in Hero, Services, and the previous NukeCompanion. When reading scroll position for 3D updates:
- Use `window.scrollY` or ScrollTrigger — these work with Lenis
- Do NOT create a competing scroll listener that fights Lenis interpolation
- Test that existing GSAP scroll animations (Services parallax, Manifesto entrance) still work after changes

### Rule 9: Emissive Bloom — Selective Only
When adding bloom for the reactor core/visor glow:
- Use `@react-three/postprocessing` `Bloom` with `luminanceThreshold={1}` and `mipmapBlur`
- Only materials with `emissiveIntensity > 1` and `toneMapped={false}` will glow
- This prevents the entire scene from blooming
- Test on both light and dark system themes

### Rule 10: Mobile Performance Gate
Before any step is marked complete:
- The 3D model must not exceed 60MB GPU memory (check Chrome DevTools > Performance)
- Frame budget: <16ms per frame on desktop, <33ms on mobile
- If the model causes >100ms first paint delay, add a loading indicator
- Test with Chrome DevTools device emulation (iPhone 14 Pro viewport)

---

## Commit Message Format

```
feat(website): [NA-N] one-line description

- What was changed
- Why it was necessary
- Visual verification results

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Anti-Patterns — Do NOT Repeat

These are specific mistakes from the previous Nuke animation attempts:

| Anti-Pattern | What Happened | Correct Approach |
|---|---|---|
| CSS classes used but never defined | NukeCompanion used ~15 classes (`nuke-overlay`, `nuke-pos`, `nuke-bob`, etc.) that exist NOWHERE in any CSS file | Define all CSS classes in `index.css` BEFORE using them in JSX |
| Component built but never mounted | NukeCompanion.tsx is 529 lines but never imported in `App.tsx` | Every component MUST be mounted in the render tree in the same step |
| Duplicate state management | `useNukeState.ts` built separately from NukeCompanion's inline state | ONE state system. Don't build parallel state hooks. |
| Rive rendering failed | Rive `.riv` character assembled from body parts — rendering was broken | GLB + Three.js replaces Rive entirely for character rendering |
| Sprite sheet approach abandoned | `RoamingNuke.tsx` used 2D sprite sheet — limited, no 3D feel | GLB model with code-driven animation replaces sprite sheet |
| Fixed overlay + scroll compensation was fragile | `pageTop()` + `gsap.ticker` scroll anchor system was complex and brittle | Use R3F Canvas in fixed overlay, read `window.scrollY` in `useFrame` for position updates |

---

## Production Basis

- **Vercel** is the deployment platform for the website
- Vercel project: `nuclear-marmalade` (prj_t8byHcb8Fv2vEytgxWF8kDpOXg9E)
- `git push origin main` triggers auto-deploy
- Build command: `tsc && vite build`
- Chat API key: `ANTHROPIC_API_KEY` set in Vercel env vars
- All verification must account for Vercel Edge Function environment
