import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	target: "es2024",
	clean: true,
	dts: true,
	platform: "browser",
});
