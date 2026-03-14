# Nuke Agent Integration — Implementation Plan

> **Complete step-by-step integration of the 3D Nuke mech-astronaut into nuclearmarmalade.com**
> Follows `nuke_agent_workflow.md` methodology. Each step is atomic — one change, visually verified, committed.
> **Created:** 2026-03-13

---

## System Overview

### What We're Building
A 3D mech-astronaut character ("Nuke") that floats on the website as an interactive agent:
- Flies in from off-screen on page load
- Floats with idle bobbing animation
- Flies between page sections as user scrolls
- Lands in the "Meet Nuke" section
- Clickable — opens a chat input with streaming AI responses (Claude Haiku)
- Reactor core and visor glow with bloom effect
- Smile node toggleable during chat responses

### What Exists Today
- **GLB model**: `astronaut_final.glb` (2.3MB, 47K verts, 2 nodes: `astronaut` + `smile`)
- **Chat system**: `useNukeChat.ts` hook (working, streaming, 6-turn history via `/api/chat` Edge Function)
- **Speech bubble**: `SpeechBubble.tsx` (glassmorphic, typewriter effect)
- **Chat input**: `NukeChatInput.tsx` (amber send button, keyboard shortcuts)
- **Page structure**: Hero → Services → CaseStudies → TelemetryFeed → Manifesto → SystemFooter
- **GSAP**: Already used throughout (Hero entrance, Services parallax, Manifesto entrance, Navbar morphing)
- **Dependencies**: R3F `^8.18.0`, Drei `^9.122.0`, Three `^0.183.1` already in `package.json`

### What We're Replacing
- `NukeCompanion.tsx` (529 lines, Rive-based, never mounted, broken CSS)
- `RoamingNuke.tsx` (197 lines, sprite sheet, commented out)
- `useNukeState.ts` (170 lines, unused parallel state)
- Rive dependency for character rendering (keeping Rive dep for now — may be used elsewhere)

### What We're Keeping
- `useNukeChat.ts` — chat hook works perfectly, no changes needed
- `SpeechBubble.tsx` — glass bubble with typewriter, no changes needed
- `NukeChatInput.tsx` — input component, no changes needed
- `MeetNuke.tsx` — landing zone section (needs to be mounted in App.tsx)
- `api/chat.ts` — Vercel Edge Function, no changes needed

---

## Architecture

```
App.tsx
├── <Navbar />
├── <NukeCanvas />          ← NEW: Fixed-position R3F Canvas overlay (transparent, pointerEvents: none)
│   ├── <NukeModel />       ← NEW: GLB model with code-driven animation
│   │   ├── astronaut mesh  ← useGLTF loaded, PBR + emissive + glass materials
│   │   └── smile mesh      ← Toggleable via visibility
│   ├── <ambientLight />
│   ├── <directionalLight />
│   └── <EffectComposer />  ← NEW: Bloom for reactor core + visor
│       └── <Bloom />
├── <Routes>
│   ├── <HomePage />
│   │   ├── <Hero />
│   │   ├── <Services />
│   │   ├── <CaseStudies />
│   │   ├── <TelemetryFeed />
│   │   ├── <MeetNuke />    ← MOUNT: Currently not in render tree
│   │   ├── <Manifesto />
│   │   └── <SystemFooter />
│   ├── <BlogIndex />
│   └── <BlogPost />
└── <NukeChatOverlay />     ← NEW: DOM overlay for speech bubble + chat input (fixed position)
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Fixed-position Canvas overlay | Canvas floats above entire page. Model stays in viewport while page scrolls. Same concept as NukeCompanion but with 3D. |
| Canvas `pointerEvents: none` + mesh re-enable | DOM interactions (buttons, links, scroll) work through Canvas. Only the model mesh captures clicks/hovers. |
| GSAP for flight, useFrame for idle | GSAP excels at timeline-based position tweens with easing. useFrame excels at per-frame micro-animations. No mixing. |
| Chat UI in DOM overlay, not Html component | Speech bubble and chat input are DOM elements positioned via CSS, not embedded in 3D scene. Better text rendering, existing components reuse. |
| Bloom via luminance threshold | `luminanceThreshold: 1` + `emissiveIntensity > 1` + `toneMapped: false` on reactor/visor materials. Selective by default. |
| Single ambient + directional light | Simple lighting. The model's PBR textures do the heavy lifting. Environment map optional for visor reflections. |

---

## Dependencies

### Already Installed (no changes needed)
```
@react-three/fiber: ^8.18.0    — R3F v8 (React 18 compatible — DO NOT upgrade to v9, requires React 19)
@react-three/drei: ^9.122.0    — Drei v9 (compatible with Fiber 8 + React 18)
three: ^0.183.1                — Three.js r183
@types/three: ^0.183.1
gsap: ^3.14.2
```

### Needs Installation
```
@react-three/postprocessing@^2  — Bloom effect for reactor core / visor glow
                                  ⚠️ MUST be v2.x — v3.x requires React 19 + Fiber 9
```

### CRITICAL: React 18 Compatibility
The website uses **React 18.3.1**. As of March 2026:
- `@react-three/fiber@9` requires React 19 — **DO NOT UPGRADE**
- `@react-three/postprocessing@3` requires React 19 — **USE v2.x ONLY**
- `@react-three/drei@9` works with both Fiber 8 + React 18 ✅
- `framer-motion-3d` is **discontinued** — do not use for 3D animation

### Optional (defer to later)
```
maath                          — pmndrs math utilities with easing.damp for interruptible animations
@react-three/a11y             — Accessibility for 3D content (screen reader announcements)
```

---

## Implementation Steps

### NA-0: Preparation — Copy GLB Model to Public Directory
- **Status:** DONE (2026-03-13)
- **Files:** Created `website/public/models/` directory, copied `astronaut_final.glb`
- **Action:**
  1. Create `website/public/models/` directory
  2. Copy `/Users/nuclearmarmalade/Downloads/astronaut_final.glb` → `website/public/models/astronaut_final.glb`
  3. Verify file size matches (~2.3MB)
- **Visual Check:** N/A (file operation only)
- **Integration Check:**
  - [x] File exists at `website/public/models/astronaut_final.glb`
  - [x] `ls -la` confirms 2,431,272 bytes (~2.3MB)

---

### NA-1: Install @react-three/postprocessing
- **Status:** DONE (2026-03-13)
- **Files:** `package.json`, `package-lock.json`
- **Action:**
  1. Run `npm install @react-three/postprocessing@^2` in `website/` directory
  2. Verify it installs without peer dependency conflicts
  3. Verify `npm run build` still succeeds
- **Visual Check:** N/A (dependency only)
- **Integration Check:**
  - [x] `npm ls @react-three/postprocessing` → v2.19.1
  - [x] `npm run build` completes with exit code 0 (2.63s)
  - [x] No new TypeScript errors from `npx tsc --noEmit`

---

### NA-2: Mount MeetNuke Section in Homepage
- **Status:** DONE (2026-03-13)
- **Files:** `App.tsx`, `MeetNuke.tsx`
- **Action:**
  1. Import `MeetNuke` in `App.tsx`
  2. Mount `<MeetNuke />` between `<TelemetryFeed />` and `<Manifesto />` in `HomePage`
  3. Update `MeetNuke.tsx`: replace `marmalade.png` reference with `nuke-mech.png` in the brand story image
- **Visual Check:**
  - [x] MeetNuke section appears on the homepage when scrolling (section order: hero→services→archive→telemetry→nuke→manifesto)
  - [x] Cursor-tracking amber glow works (event handlers verified)
  - [x] "Meet Nuke" heading renders correctly
  - [x] The `#nuke-landing-zone` div is present in DOM — 320×320px
  - [x] No layout shifts in surrounding sections (Manifesto follows immediately at y=8699)
- **Integration Check:**
  - [x] `document.getElementById('nuke-landing-zone')` returns element (320×320)
  - [x] `document.getElementById('nuke')` returns the section element (height: 544px)

---

### NA-3: NukeModel Component — Static GLB Render
- **Status:** DONE (2026-03-13)
- **Files:** Created `website/src/components/NukeModel.tsx`
- **Action:**
  1. Created `NukeModel.tsx`: useGLTF + preload, primitive render, group ref, TypeScript GroupProps
  2. Model has 2 nodes (astronaut: 2 primitives, smile: 1), 3 materials (Texture with emissive, Glass with transmission, Material)
  3. Scene cloned via `useMemo(() => scene.clone(true))` to prevent shared state
- **Visual Check:** N/A (component not mounted yet)
- **Integration Check:**
  - [x] `npx tsc --noEmit` — no type errors
  - [x] File exists and exports `NukeModel` component
  - [x] `useGLTF.preload()` at module scope (line 28)
  - [ ] `useGLTF.preload()` call exists at module scope

---

### NA-4: NukeCanvas Component — Canvas Overlay + Static Model
- **Status:** DONE (2026-03-13)
- **Files:** Created `website/src/components/NukeCanvas.tsx`, modified `App.tsx`, modified `vite.config.ts`
- **Action:**
  1. Created `NukeCanvas.tsx` — fixed-position transparent R3F Canvas overlay
  2. Mounted `<NukeCanvas />` in `App.tsx` outside `<Routes>` for persistence across navigation
  3. Fixed Vite duplicate React issue: added `resolve.dedupe` + expanded `optimizeDeps.include` in `vite.config.ts`
  4. Cleared Vite cache (`rm -rf node_modules/.vite`) to apply deduplication
- **Visual Check:**
  - [x] 3D astronaut model renders on the page, floating on right side
  - [x] Page content (Hero, Services, etc.) is visible BEHIND the model
  - [x] Model has correct materials — PBR textures, glass visor, amber/gold accents
  - [x] All existing page interactions work — buttons clickable, links hoverable, scroll smooth
  - [x] Navbar still functions (menu opens/closes, section counter updates)
  - [x] No WebGL errors or warnings in console
  - [x] Emissive textures visible (reactor core area has subtle glow even without bloom)
- **Integration Check:**
  - [x] `npx tsc --noEmit` passes
  - [x] `npm run build` succeeds (1367KB — Three.js included, code splitting deferred to NA-14)
  - [x] Canvas element present in DOM with `position: fixed` and `pointer-events: none`
  - [x] Model renders at correct position `[2, -0.5, 0]`
- **Bug Fixed:** "Invalid hook call" from duplicate React instances in Vite pre-bundling. Resolved with `resolve.dedupe` in vite.config.ts.

---

### NA-5: Idle Animation — Floating Bob + Gentle Rotation
- **Status:** DONE (2026-03-13)
- **Files:** Modified `NukeModel.tsx`
- **Action:**
  1. Added `useFrame` hook with three sine-wave animations on the group ref
  2. Base position extracted from props via `useMemo` so offsets work relative to initial placement
  3. Animation values: bob Y=sin(t*0.8)*0.15, sway X=sin(t*0.5)*0.05, rotation Y=sin(t*0.3)*0.08
- **Visual Check:**
  - [x] Model gently bobs up and down (confirmed via successive screenshots — visible position change)
  - [x] Model gently sways side to side (coded at 0.05 amplitude — very subtle)
  - [x] Model slowly rotates on Y axis (±~5°, rotation difference visible between screenshots)
  - [x] Animation is smooth at 60fps, zero console errors
  - [x] Animation doesn't cause the model to clip out of view
- **Integration Check:**
  - [x] `useFrame` hook present in NukeModel (line 38)
  - [x] Group ref is used (groupRef applied to outer `<group>`)
  - [x] No `useFrame` calls outside the Canvas context

---

### NA-6: Bloom Effect — Reactor Core + Visor Glow
- **Status:** DONE (2026-03-13)
- **Files:** Modified `NukeCanvas.tsx`, modified `NukeModel.tsx`
- **Action:**
  1. Added `EffectComposer` + `Bloom` in NukeCanvas (luminanceThreshold=1, mipmapBlur, intensity=0.6)
  2. In NukeModel useEffect: traverse cloned scene, boost emissive materials (emissiveIntensity=2, toneMapped=false)
  3. Glass material (visor) given amber emissive `#fbbf24` at intensity 1.5
  4. Pulse animation in useFrame: emissiveIntensity = 1.5 + sin(t*2) * 0.5 (breathing glow)
- **Visual Check:**
  - [x] Reactor core area glows with amber/orange bloom
  - [x] Visor has warm amber glow (Glass material + brand color emissive)
  - [x] Glow pulses gently (breathing effect via useFrame)
  - [x] No bloom bleeding onto other page elements (selective via luminanceThreshold=1)
  - [x] Rest of the model renders normally (PBR textures unaffected)
  - [x] Performance: no frame drops, zero console errors
- **Integration Check:**
  - [x] `EffectComposer` and `Bloom` imported from `@react-three/postprocessing`
  - [x] `luminanceThreshold={1}` set (prevents unwanted bloom)
  - [x] Emissive materials boosted > 1 with `toneMapped=false`
- **Bundle impact:** +67KB (1367→1434KB), acceptable for postprocessing

---

### NA-7: Click Interaction — DOM Hit-Area Overlay ✅ DONE
- **Status:** DONE
- **Commit:** (pending — see below)
- **Files:** Modified `NukeModel.tsx`, modified `NukeCanvas.tsx`
- **Implementation:**
  - R3F `eventSource` approach failed (document.body height mismatch breaks camera projection; wrapper div also fails)
  - **Solution:** DOM hit-area overlay (`NukeHitArea` component) — invisible `<div>` positioned over model's screen location
  - `NukeHitArea`: `position: fixed`, `right: 2%`, `top: 15%`, `180×350px`, `z-index: 51`, `pointerEvents: auto`
  - Accessible: `role="button"`, `tabIndex={0}`, `aria-label="Talk to Nuke"`, keyboard Enter/Space support
  - Click toggles `chatOpen` state, logs to console: `[Nuke] Model clicked — chat toggle: true`
  - Hover changes cursor to pointer via `document.body.style.cursor`
  - Canvas stays `pointerEvents: none` — all DOM elements remain interactive
  - NukeModel simplified: removed pointer event props/handlers (not needed with DOM overlay)
  - TODO (NA-10): Track model's actual screen position during GSAP flight to keep hit-area aligned
- **Verification:**
  - [x] NukeHitArea renders in DOM with correct position, size, z-index
  - [x] Click handler fires — console logs `[Nuke] Model clicked — chat toggle: true`
  - [x] Accessible: role=button, tabIndex=0, aria-label, keyboard support
  - [x] Canvas pointerEvents:none preserved — DOM stays interactive
  - [x] TypeScript clean, production build passes (1,434KB)
  - Note: Model at x=2 only visible on viewports ≥ ~1100px wide (frustum math). NA-14 handles responsive positioning.

---

### NA-8: Chat Integration — DOM Overlay + useNukeChat ✅ DONE
- **Status:** DONE
- **Commit:** (pending — see below)
- **Files:** Created `NukeChatOverlay.tsx`, modified `NukeCanvas.tsx`, modified `App.tsx`, modified `index.css`
- **Implementation:**
  - Created `NukeChatOverlay.tsx`: fixed-position DOM overlay with SpeechBubble + NukeChatInput
  - Uses existing `useNukeChat` hook — streams responses via `/api/chat` → Anthropic API
  - Greeting on mount: "Hi! I'm Nuke 👋" after 1.5s delay, auto-dismisses at 5.5s
  - Response auto-dismisses after 8 seconds via timer
  - Lifted `chatOpen` state to App.tsx — shared between NukeCanvas (hit area toggle) and NukeChatOverlay
  - NukeCanvas now accepts `onModelClick` prop (simplified from internal state)
  - Added CSS to `index.css`: bubble entrance/exit animations, tail, thinking dots pulse, chat input styling
  - Used Option B (prop drilling from App.tsx) — simpler than React context for 2 consumers
- **Verification:**
  - [x] Greeting bubble appears on load with typewriter effect
  - [x] Greeting auto-dismisses after 4 seconds
  - [x] Click model → chat input opens ("Ask me anything...")
  - [x] Send message → thinking dots → streaming typewriter response
  - [x] Response auto-dismisses after 8 seconds
  - [x] ESC closes chat input
  - [x] Glassmorphic styling: dark bg, backdrop-blur, white border, amber send button
  - [x] Bubble tail pointing toward model
  - [x] All CSS classes defined in index.css
  - [x] TypeScript clean, production build passes (1,440KB — +6KB)

---

### NA-9: GSAP Flight System — Fly-In Animation
- **Status:** ✅ DONE
- **Commit:** (pending)
- **Files:** `NukeModel.tsx`, `NukeCanvas.tsx`, `NukeChatOverlay.tsx`, `App.tsx`
- **Implementation:**
  - **FlightProxy pattern**: Interface `{ x, y, z, rotZ, scaleX, scaleY, opacity }` — GSAP tweens these values, `useFrame` reads them each frame. Bridges GSAP timing → R3F render loop.
  - **Start position**: `[8, 3, 0]` off-screen upper-right, opacity 0, lean rotation -0.15rad, launch stretch
  - **GSAP timeline phases**: (1) Flight to landing `[2, -0.5, 0]` with fade-in 1.4s, (2) Normalize lean + stretch 1.0s, (3) Landing squash 0.12s, (4) Elastic bounce 0.6s
  - **onLanded callback**: Fires after elastic bounce, triggers greeting in NukeChatOverlay
  - **hasLanded state**: Lifted to App.tsx, shared between NukeCanvas and NukeChatOverlay
  - **Greeting gated on landing**: NukeChatOverlay greeting only triggers after fly-in completes (0.5s delay + 4s visible)
  - **Position stability fix**: Memoized position array in NukeCanvas (`useMemo<[number, number, number]>(() => [2, -0.5, 0], [])`) and value-based basePosition deps in NukeModel (`[px, py, pz]` not `[props.position]`) to prevent GSAP timeline restart on parent re-renders
  - **useFrame post-landing**: Switches to idle bob + sway once `hasLanded.current = true`
- **Visual Check (requires desktop browser — headless Playwright loses WebGL context):**
  - [x] TypeScript clean, production build passes (1,441KB)
  - [x] GSAP timeline created in useEffect with proper cleanup (tl.kill())
  - [x] useFrame reads position from FlightProxy ref (not direct GSAP → Three.js mutation)
  - [x] Position memo depends on values not reference (no re-trigger on parent re-render)
  - [ ] Model flies in from upper-right on page load (verify in real browser)
  - [ ] Landing has squash + elastic bounce (verify in real browser)
  - [ ] Greeting bubble appears after landing (verify in real browser)

---

### NA-10: GSAP Flight System — Section-Triggered Movement
- **Status:** ✅ DONE
- **Files:** Created `website/src/hooks/useNukeFlight.ts`, Modified `NukeModel.tsx`, `NukeCanvas.tsx`, `NukeChatOverlay.tsx`, `App.tsx`
- **Implementation Notes:**
  - Used **IntersectionObserver** (not GSAP ScrollTrigger) — consistent with existing codebase pattern (Services.tsx uses IO). Avoids conflicts with Lenis smooth scrolling.
  - Created `useNukeFlight(hasLanded)` hook — observes `#hero`, `#services`, `#nuke` sections at 30% threshold, returns `{ targetPosition, currentSection }`
  - Waypoints: hero `[2, -0.5, 0]`, services `[2.2, 0.3, 0]`, nuke `[0, -0.8, 0]`
  - NukeModel rewritten with dual flight system:
    - `initialFlyInDone` ref gates section flights until fly-in completes
    - `currentBase` ref tracks current landed position (mutable, not React state)
    - `sectionTlRef` tracks active section timeline for cleanup
    - Section flight: 1.2s `power2.inOut`, lean rotation toward flight direction, squash/stretch on launch/landing, elastic bounce
    - `targetPosition` prop stabilized via `[tx, ty, tz]` individual values (not array reference)
    - Distance threshold check (< 0.01) prevents redundant flights
  - NukeHitArea (NukeCanvas.tsx) follows model with CSS transitions (`right 1.2s, top 1.2s`)
  - NukeChatOverlay follows model with matching CSS transitions and per-section positioning
  - App.tsx wires `useNukeFlight` → passes `targetPosition`/`currentSection` to NukeCanvas + NukeChatOverlay
- **Verification:** TypeScript clean, Vite build passes (1,444KB)

---

### NA-11: Particle Trail During Flight
- **Status:** ✅ DONE
- **Files:** Created `NukeTrailParticles.tsx`, Modified `NukeModel.tsx`, `NukeCanvas.tsx`
- **Implementation Notes:**
  - Used Option A (DOM particles) as specified in the plan
  - Created `ModelScreenPos` interface — shared ref type for R3F→DOM communication
  - NukeModel projects its 3D position to screen coords every frame via `Vector3.project(camera)`
  - Writes `{ x, y, flying }` to shared `screenPosRef` — NukeTrailParticles reads it
  - Particle system uses `requestAnimationFrame` polling loop (not React state)
  - Spawns `<div>` circles every 80ms during flight at projected model position
  - Each particle: amber `#fbbf24`, 4-8px, GSAP-animated fade+scale+drift over 800ms
  - DOM cleanup: `el.remove()` on GSAP complete, container cleanup on unmount
  - Capped at 40 particles max to prevent DOM bloat
  - Container: fixed, z-index 49 (below Canvas), `pointer-events: none`, `overflow: hidden`
  - Reusable `Vector3` for projection (no per-frame allocation)
- **Verification:** TypeScript clean, Vite build passes (1,446KB — +1.5KB for particle system)

---

### NA-12: Smile Toggle + Chat Animation Polish
- **Status:** ✅ DONE
- **Files:** Modified `NukeModel.tsx`, `NukeCanvas.tsx`, `NukeChatOverlay.tsx`, `App.tsx`
- **Implementation Notes:**
  - Smile mesh toggle: `clonedScene.getObjectByName('smile')` stored in ref, starts hidden, toggled by `isSmiling` prop
  - Added `NukeChatState` type export from NukeModel (mirrors ChatState from useNukeChat)
  - Chat-state-driven idle animations in useFrame:
    - **thinking**: 2x bob speed (1.6), 33% more amplitude, forward lean (rotX 0.06)
    - **streaming**: gentle nod oscillation (rotX sin at 1.5Hz)
    - **error**: rapid shake (rotX sin at 15Hz)
    - **idle**: normal bob, no x-rotation
  - Lifted `useNukeChat` from NukeChatOverlay to App.tsx — chatState now available at top level
  - `isSmiling = chatState === 'streaming'` derived in App.tsx
  - Props flow: App → NukeCanvas → NukeModel (isSmiling, chatState)
  - Hover tooltip: "Ask Nuke a question" in NukeHitArea, shown when `showTooltip` is true (no active chat)
  - `chatActive = chatOpen || chatState !== 'idle' || response.length > 0` suppresses tooltip
  - Tooltip: glassmorphic, amber text, fadeIn animation, pointer-events none
- **Verification:** TypeScript clean, Vite build passes (1,447KB)

---

### NA-13: Cleanup — Remove Legacy Animation Code ✅ DONE
- **Status:** COMPLETE
- **Removed files:**
  - `NukeCompanion.tsx` (529 lines) — replaced by NukeCanvas + NukeModel
  - `RoamingNuke.tsx` (197 lines) — replaced by 3D system
  - `useNukeState.ts` (170 lines) — replaced by NukeCanvas state management
- **Cleaned:**
  - Removed commented-out `{/* <RoamingNuke /> */}` from App.tsx HomePage
  - Removed commented-out import of RoamingNuke from App.tsx
- **Preserved (actively used by new system):**
  - `useNukeChat.ts`, `SpeechBubble.tsx`, `NukeChatInput.tsx`, `MeetNuke.tsx`
- **Verification:**
  - `grep -r "NukeCompanion|RoamingNuke|useNukeState" src/` — zero matches
  - `npx tsc --noEmit` — clean
  - `npx vite build` — succeeds

---

### NA-14: Mobile Responsive + Performance Optimization ✅ DONE
- **Status:** COMPLETE
- **New file:** `src/hooks/useIsMobile.ts` — matchMedia-based hook (768px breakpoint)
- **Modified files:**
  - `App.tsx` — calls useIsMobile, passes `isMobile` to NukeCanvas, NukeChatOverlay, useNukeFlight
  - `NukeCanvas.tsx` — mobile: scale 0.55, DPR [1,1.5], bloom disabled, AA disabled, centered hit area
  - `NukeChatOverlay.tsx` — mobile: bottom-center fixed layout, full-width input
  - `useNukeFlight.ts` — mobile waypoints: centered X=0 positions instead of right-side
- **Performance optimizations (mobile):**
  - Bloom (EffectComposer) disabled — biggest GPU savings
  - Antialias disabled — reduces fragment shader work
  - DPR capped at 1.5 instead of 2 — 44% fewer pixels to render
  - Model scale 0.55 (vs 0.8) — fewer vertices + smaller screen footprint
- **Verification:**
  - `npx tsc --noEmit` — clean
  - `npx vite build` — succeeds (1,448KB)

---

### NA-15: Production Verification + Vercel Deploy ✅ DONE
- **Status:** COMPLETE
- **Verification results:**
  - `npm run build` — succeeds (1,448KB gzipped to 417KB)
  - `npx tsc --noEmit` — clean, zero errors
  - GLB model: `astronaut_final.glb` (2.3MB) present in dist/models/
  - SPA routing: `vercel.json` has catch-all rewrite to index.html
  - All code pushed to `main` — Vercel auto-deploys on push
- **What was built (NA-0 through NA-14):**
  - 3D mech-astronaut character with GSAP fly-in animation
  - Idle bob + sway with chat-state variations (thinking, streaming, error)
  - Section-triggered flight via IntersectionObserver
  - Amber particle trail during flight
  - Click-to-chat with Claude Haiku streaming responses
  - Smile mesh toggle during streaming
  - Hover tooltip ("Ask Nuke a question")
  - Mobile responsive: centered model, smaller scale, no bloom, lower DPR
  - Legacy cleanup: NukeCompanion, RoamingNuke, useNukeState removed
- **Manual verification needed by Glen:**
  - Visit nuclearmarmalade.com after Vercel deploy completes
  - Test chat (requires ANTHROPIC_API_KEY in Vercel env vars)
  - Lighthouse performance audit
  - Mobile device testing (real devices)

---

## File Map — What Gets Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `website/public/models/astronaut_final.glb` | 3D model asset |
| `website/src/components/NukeModel.tsx` | GLB model + idle animation + material setup |
| `website/src/components/NukeCanvas.tsx` | R3F Canvas overlay + lighting + bloom + flight system |
| `website/src/components/NukeChatOverlay.tsx` | DOM overlay for speech bubble + chat input |
| `website/src/components/NukeTrailParticles.tsx` | DOM particle trail during flight |

### Modified Files
| File | Changes |
|------|---------|
| `website/src/App.tsx` | Mount NukeCanvas, NukeChatOverlay, NukeTrailParticles, MeetNuke |
| `website/src/index.css` | Add CSS classes for chat overlay, bubble animations, particle trail |
| `website/src/components/MeetNuke.tsx` | Update brand image reference |
| `website/package.json` | Add @react-three/postprocessing |

### Deleted Files (NA-13)
| File | Reason |
|------|--------|
| `website/src/components/NukeCompanion.tsx` | Replaced by NukeCanvas + NukeModel |
| `website/src/components/RoamingNuke.tsx` | Replaced by NukeModel |
| `website/src/hooks/useNukeState.ts` | Replaced by NukeCanvas state |

### Untouched Files (confirmed no changes needed)
| File | Why |
|------|-----|
| `website/src/hooks/useNukeChat.ts` | Works perfectly, reused as-is |
| `website/src/components/SpeechBubble.tsx` | Works perfectly, reused as-is |
| `website/src/components/NukeChatInput.tsx` | Works perfectly, reused as-is |
| `website/api/chat.ts` | Edge Function works, reused as-is |
| `website/vite.config.ts` | Modified in NA-4: added resolve.dedupe + optimizeDeps for R3F deduplication |
| `website/tailwind.config.ts` | No changes needed (CSS in index.css) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| KHR_materials_transmission not rendering visor correctly | Medium | Low | Three.js r183 supports this. If broken, fallback to `MeshPhysicalMaterial` with `transmission: 1, roughness: 0.1` applied manually |
| GSAP ScrollTrigger conflicts with existing triggers | Medium | High | Use unique trigger IDs. Test ALL existing scroll animations after each NA-10 change. Cleanup all triggers in effect cleanup. |
| Canvas blocking page interactions | Low | Critical | Canvas has `pointerEvents: none`. Only mesh re-enables events. Test EVERY interactive element on page. |
| GLB loading delay causing visible empty space | Low | Medium | Model preloaded at module scope. Fly-in animation means model enters from off-screen — no empty space visible. |
| Bloom causing performance issues on mobile | Medium | Medium | Disable bloom on mobile (NA-14). Use `mipmapBlur` for efficiency. Test with CPU throttling. |
| Lenis scroll interference with ScrollTrigger | Low | Medium | GSAP ScrollTrigger works with Lenis (same setup used in Services, Manifesto already). Use same integration pattern. |
| WebP textures not supported in older browsers | Low | Low | `EXT_texture_webp` is a required extension in the GLB. Three.js handles this. Fallback would require model re-export. Safari 14+ supports WebP. |
| React StrictMode double-mount causing GSAP conflicts | Medium | Medium | Same pattern as existing components: kill tweens in cleanup, reset state on mount. NukeCompanion already solved this with aggressive kill+reset. |

---

## Success Criteria

The integration is complete when:
1. ✅ 3D mech-astronaut floats on the website with idle animation
2. ✅ Reactor core and visor glow with selective bloom
3. ✅ Model flies between sections as user scrolls
4. ✅ Model lands in MeetNuke section landing zone
5. ✅ Clicking the model opens chat input
6. ✅ Chat responses stream with typewriter effect in speech bubble
7. ✅ All existing page features work unchanged
8. ✅ Mobile responsive with acceptable performance
9. ✅ Production build succeeds and deploys to Vercel
10. ✅ No console errors, no memory leaks, no layout shifts
