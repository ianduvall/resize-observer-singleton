interface ROEntry<TElement extends Element> extends ResizeObserverEntry {
	target: TElement;
}
type ResizeHandler<TElement extends Element = Element> = (
	entry: ROEntry<TElement>,
) => void;

export class SharedResizeObserver {
	box: ResizeObserverBoxOptions;
	#observers: WeakMap<Element, Array<ResizeHandler>>;
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
		const resizeObserverCallback: ResizeObserverCallback = (
			entries,
			observer,
		) => {
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
		};
		this.#observer = new Implementation(resizeObserverCallback);
	}

	observe = <TElement extends Element>(
		target: TElement,
		handler: ResizeHandler<TElement>,
	): (() => void) => {
		const unobserve = () => this.unobserve(target, handler as ResizeHandler);
		const observers = this.#observers.get(target);
		if (observers) {
			observers.push(handler as ResizeHandler);
			return unobserve;
		}

		this.#observers.set(target, [handler as ResizeHandler]);
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

		const idx = handlers.indexOf(handler);
		if (idx !== -1) {
			handlers.splice(idx, 1);
		}

		if (handlers.length === 0) {
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
