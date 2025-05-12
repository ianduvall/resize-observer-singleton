import { SharedResizeObserver } from "./shared-resize-observer";

let implementation: typeof ResizeObserver | undefined;

class ROSingleton {
	#instances: Record<ResizeObserverBoxOptions, SharedResizeObserver | null> = {
		"border-box": null,
		"content-box": null,
		"device-pixel-content-box": null,
	};

	getInstance = (
		box: ResizeObserverBoxOptions = "border-box",
	): SharedResizeObserver => {
		if (!this.#instances[box]) {
			this.#instances[box] = new SharedResizeObserver({ box, implementation });
		}
		return this.#instances[box];
	};

	dispose = (box?: ResizeObserverBoxOptions): void => {
		if (box) {
			const instance = this.#instances[box];
			if (instance) {
				instance.disconnect();
				this.#instances[box] = null;
			}
			return;
		}

		for (const instance of Object.values(this.#instances)) {
			if (instance) {
				instance.disconnect();
			}
		}
		this.#instances = {
			"border-box": null,
			"content-box": null,
			"device-pixel-content-box": null,
		};
	};

	[Symbol.dispose]: () => void = this.dispose;
}

/**
 * Useful for polyfilling the ResizeObserver API.
 *
 * Must be called before using the ResizeObserverSingleton.
 */
export const registerResizeObserverImplementation = (
	impl: typeof ResizeObserver | undefined,
): void => {
	implementation = impl;
};

export const ResizeObserverSingleton: ROSingleton = new ROSingleton();
