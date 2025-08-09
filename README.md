# resize-observer-singleton

[![npm](https://img.shields.io/npm/v/resize-observer-singleton.svg)](https://npmjs.com/package/resize-observer-singleton)
[![CI](https://github.com/ianduvall/resize-observer-singleton/actions/workflows/ci.yml/badge.svg)](https://github.com/ianduvall/resize-observer-singleton/actions/workflows/ci.yml)

A singleton wrapper for the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) that optimizes performance and simplifies usage.

## Motivation

The browser's built-in ResizeObserver API is powerful but can lead to performance issues when many observers are created, often one for each element to observe. Common scenarios where this happens include:

- Multiple components independently observing the same DOM elements
- Libraries that each create their own ResizeObserver instances
- Complex UIs that need to react to size changes of many elements

This package solves these problems by:

1. **Sharing a single ResizeObserver instance** across your application and libraries
2. **Managing multiple handlers** for the same elements
3. **Supporting different box options** with separate observer instances
4. **Providing a clean disposal API** to prevent memory leaks
5. **Supporting polyfills** for older browsers

## Installation

```bash
# npm
npm install resize-observer-singleton

# yarn
yarn add resize-observer-singleton

# pnpm
pnpm add resize-observer-singleton
```

## Basic Usage

```javascript
import { ResizeObserverSingleton } from "resize-observer-singleton";

// Get a shared instance (defaults to 'border-box')
const resizeObserver = ResizeObserverSingleton.getInstance();

// Observe an element with a handler
const element = document.querySelector(".my-element");
const unobserve = resizeObserver.observe(element, (entry) => {
	console.log("Element resized:", entry.contentRect);
});

// Later, when you no longer need to observe:
unobserve();

// Or manually:
resizeObserver.unobserve(element, handler);

// To completely disconnect all observations (rarely needed):
resizeObserver.disconnect();
```

## React Usage

```jsx
import { useEffect, useRef } from "react";
import { ResizeObserverSingleton } from "resize-observer-singleton";

function ResizeAwareComponent() {
	const ref = useRef(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		// You can specify box options: 'border-box', 'content-box', 'device-pixel-content-box'
		const resizeObserver = ResizeObserverSingleton.getInstance("content-box");

		const handleResize = (entry) => {
			const { width, height } = entry.contentRect;
			setDimensions({ width, height });
		};

		// The observe method returns an unsubscribe function
		const unobserve = resizeObserver.observe(element, handleResize);

		// Clean up when component unmounts
		return unobserve;
	}, []);

	return (
		<div ref={ref} className="resizable-component">
			Width: {dimensions.width}px, Height: {dimensions.height}px
		</div>
	);
}
```

## Custom Hook

```jsx
import { useEffect, useRef, useState } from "react";
import { ResizeObserverSingleton } from "resize-observer-singleton";

export function useResizeObserver(box = "border-box") {
	const ref = useRef(null);
	const [entry, setEntry] = useState(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const resizeObserver = ResizeObserverSingleton.getInstance(box);

		const unobserve = resizeObserver.observe(element, (resizeEntry) => {
			setEntry(resizeEntry);
		});

		return unobserve;
	}, [box]);

	return [ref, entry];
}

// Usage
function MyComponent() {
	const [ref, entry] = useResizeObserver();

	return (
		<div ref={ref} style={{ width: "100%", height: "100%" }}>
			{entry && (
				<div>
					Width: {entry.contentRect.width}px Height: {entry.contentRect.height}
					px
				</div>
			)}
		</div>
	);
}
```

## Polyfill Support

For older browsers, you can register a polyfill implementation:

```javascript
import ResizeObserverPolyfill from "resize-observer-polyfill";
import {
	registerResizeObserverImplementation,
	ResizeObserverSingleton,
} from "resize-observer-singleton";

// Register the polyfill before using the singleton
registerResizeObserverImplementation(ResizeObserverPolyfill);

// Now you can use ResizeObserverSingleton as normal
const resizeObserver = ResizeObserverSingleton.getInstance();
```

## Using Multiple Box Options

```javascript
// Create instances with different box options
const borderBoxObserver = ResizeObserverSingleton.getInstance("border-box");
const contentBoxObserver = ResizeObserverSingleton.getInstance("content-box");
const devicePixelObserver = ResizeObserverSingleton.getInstance(
	"device-pixel-content-box",
);

// Each will maintain its own shared ResizeObserver
```

## Publishing / Releasing

This project uses semantic versioning and a simple release script powered by `bumpp` and `pnpm publish`.

### Prerequisites

- You have publish rights on npm for `resize-observer-singleton`
- Node.js >= 20.18.0 (see `engines` in `package.json`)
- Two‑factor auth (2FA) configured for npm (recommended)
- A clean working tree (no uncommitted changes)

### Standard Release Flow

1. Update local main branch:
   ```bash
   git checkout main
   git pull origin main --ff-only
   pnpm install
   ```
2. Run quality gates locally (optional but recommended):
   ```bash
   pnpm run lint && pnpm test && pnpm run typecheck
   ```
3. Pick and publish a new version (interactive prompt will suggest bumps):
   ```bash
   pnpm run release
   ```
   What happens:
   - `bumpp` updates `package.json` (and creates a git commit + tag)
   - `prepublishOnly` runs `pnpm run build` (via `tsdown`)
   - `pnpm publish` publishes the new `dist` output
4. Push the commit + tag to GitHub (if you didn't choose auto‑push in the prompt):
   ```bash
   git push origin main --tags
   ```

### Choosing the Version

Use semantic versioning:

- Patch: bug fixes / internal changes (`0.0.x`)
- Minor: backward compatible feature additions (`0.x.y` while <1.0.0 still considered minor enhancements)
- Major: breaking changes (after 1.0.0; before 1.0.0 treat breaking changes as minor bump to the 0.x line if you prefer, or document clearly)

### Dry Run / Verification

To inspect what would be published without actually publishing:

```bash
pnpm run build
pnpm publish --dry-run
```

Check the file list (only `dist` and expected metadata should appear).

### If Something Goes Wrong

- Tag created but publish failed: fix the issue, rebuild, then rerun `pnpm publish --tag <same-version>` (no version bump). If necessary, delete the tag locally + remotely (`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`) and redo the release.
- Published but forgot to push tags: just run `git push origin --tags`.
- Need to deprecate a version: `npm deprecate resize-observer-singleton@X.Y.Z "message"`.
