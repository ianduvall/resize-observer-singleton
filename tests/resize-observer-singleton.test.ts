import { expect, test, vi, type Mock } from "vitest";
import { ResizeObserverSingleton } from "../src";

const interval = 5;

const flushAndClearInitialResizeEvents = async (
	...handlers: ReadonlyArray<Mock | ReadonlyArray<Mock>>
) => {
	const flattenedHandlers = handlers.flat();
	await vi.waitFor(
		() => {
			flattenedHandlers.forEach((handler) =>
				expect(handler).toHaveBeenCalled(),
			);
		},
		{ interval },
	);
	flattenedHandlers.forEach((handler) => handler.mockClear());
};

test("calls then handler when expected", async () => {
	const initialHeight = 100;
	const element = document.createElement("div");
	element.style.height = `${initialHeight}px`;
	element.style.width = "200px";
	document.body.append(element);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");

	const handler = vi.fn();

	resizeObserver.observe(element, handler);
	await flushAndClearInitialResizeEvents(handler);

	element.style.height = `${initialHeight + 10}px`;

	await vi.waitFor(
		() => {
			expect(handler).toHaveBeenCalledTimes(1);
		},
		{ interval },
	);
});

test("calls multiple handlers for the same element", async () => {
	const initialHeight = 100;
	const element = document.createElement("div");
	element.style.height = `${initialHeight}px`;
	element.style.width = "200px";
	document.body.append(element);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");

	const handler1 = vi.fn();
	const handler2 = vi.fn();

	resizeObserver.observe(element, handler1);
	resizeObserver.observe(element, handler2);
	await flushAndClearInitialResizeEvents(handler1, handler2);

	element.style.height = `${initialHeight + 10}px`;

	await vi.waitFor(
		() => {
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
		},
		{ interval },
	);
});

test("calls handlers for multiple elements", async () => {
	const initialWidth = 100;
	const element1 = document.createElement("div");
	element1.id = "element1";
	element1.style.height = "100px";
	element1.style.width = `${initialWidth}px`;
	document.body.append(element1);

	const element2 = document.createElement("div");
	element2.id = "element2";
	element2.style.height = "100px";
	element2.style.width = `${initialWidth}px`;
	document.body.append(element2);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");

	const handler1 = vi.fn();
	const handler2 = vi.fn();

	resizeObserver.observe(element1, handler1);
	resizeObserver.observe(element2, handler2);
	await flushAndClearInitialResizeEvents(handler1, handler2);

	expect(handler1).toHaveBeenCalledTimes(0);
	expect(handler2).toHaveBeenCalledTimes(0);

	element1.style.width = `${initialWidth + 10}px`;

	await vi.waitFor(
		() => {
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).not.toHaveBeenCalled();
		},
		{ interval },
	);

	element2.style.height = `${initialWidth + 20}px`;

	await vi.waitFor(
		() => {
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
		},
		{ interval },
	);
});

test("unobserve removes only the specified handler", async () => {
	const initialHeight = 100;
	const element = document.createElement("div");
	element.style.height = `${initialHeight}px`;
	element.style.width = "200px";
	document.body.append(element);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");

	const handler1 = vi.fn();
	const handler2 = vi.fn();

	resizeObserver.observe(element, handler1);
	resizeObserver.observe(element, handler2);
	await flushAndClearInitialResizeEvents(handler1, handler2);

	resizeObserver.unobserve(element, handler1);

	element.style.height = `${initialHeight + 10}px`;

	await vi.waitFor(
		() => {
			expect(handler1).toHaveBeenCalledTimes(0);
			expect(handler2).toHaveBeenCalledTimes(1);
		},
		{ interval },
	);
});

test("disconnect stops all observations", async () => {
	const initialHeight = 100;
	const element = document.createElement("div");
	element.style.height = `${initialHeight}px`;
	element.style.width = "200px";
	document.body.append(element);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");
	const handler = vi.fn();
	resizeObserver.observe(element, handler);
	await flushAndClearInitialResizeEvents(handler);

	resizeObserver.disconnect();

	element.style.height = `${initialHeight + 10}px`;

	// Wait a bit to ensure no handlers are called
	await new Promise((resolve) => setTimeout(resolve, interval * 5));

	expect(handler).toHaveBeenCalledTimes(0);
});

test("observing the same element with the same handler multiple times only calls handler once", async () => {
	const initialHeight = 100;
	const element = document.createElement("div");
	element.style.height = `${initialHeight}px`;
	element.style.width = "200px";
	document.body.append(element);

	using resizeObserver = ResizeObserverSingleton.getInstance("border-box");
	const handler = vi.fn();

	resizeObserver.observe(element, handler);
	resizeObserver.observe(element, handler);
	await flushAndClearInitialResizeEvents(handler);

	expect(handler).toHaveBeenCalledTimes(0);

	element.style.height = `${initialHeight + 10}px`;

	await vi.waitFor(
		() => {
			expect(handler).toHaveBeenCalledTimes(1);
		},
		{ interval },
	);
});
