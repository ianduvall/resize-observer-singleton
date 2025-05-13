interface ROEntry<TElement extends Element> extends ResizeObserverEntry {
	target: TElement;
}
type ResizeHandler<TElement extends Element = Element> = (
	entry: ROEntry<TElement>,
) => void;

export class SharedResizeObserver {
	box: ResizeObserverBoxOptions;
	#observers: WeakMap<Element, Set<ResizeHandler>>;
	#observer: ResizeObserver;

	constructor({
		box,
		implementation,
	}: {
		box: ResizeObserverBoxOptions;
		implementation?: typeof ResizeObserver;
	}) {
		this.box = box;
		this.#observers = new WeakMap();
		const Implementation = implementation || ResizeObserver;
		this.#observer = new Implementation((entries, observer) => {
			for (const entry of entries) {
				const handlers = this.#observers.get(entry.target);
				if (!handlers) {
					observer.unobserve(entry.target);
					continue;
				}
				for (const handler of handlers) {
					handler(entry);
				}
			}
		});
	}

	observe = <TElement extends Element>(
		target: TElement,
		handler: ResizeHandler<TElement>,
	): (() => void) => {
		const unobserve = () => this.unobserve(target, handler as ResizeHandler);
		const existingObservers = this.#observers.get(target);
		if (existingObservers) {
			existingObservers.add(handler as ResizeHandler);
			return unobserve;
		}

		this.#observers.set(target, new Set([handler as ResizeHandler]));
		this.#observer.observe(target, {
			box: this.box,
		});

		return unobserve;
	};

	unobserve = (target: Element, handler: ResizeHandler): void => {
		const handlers = this.#observers.get(target);
		if (!handlers) {
			return;
		}

		handlers.delete(handler);

		if (handlers.size === 0) {
			this.#observer.unobserve(target);
			this.#observers.delete(target);
		}
	};

	disconnect = (): void => {
		this.#observer.disconnect();
		this.#observers = new WeakMap();
	};

	[Symbol.dispose]: typeof this.disconnect = this.disconnect;
}
