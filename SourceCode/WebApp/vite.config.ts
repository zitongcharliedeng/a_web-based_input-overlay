import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Get git hash for version
let gitHash: string;
try {
	gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
	gitHash = Date.now().toString();
}

export default defineConfig({
	build: {
		outDir: '_bundleAllCompiledJavascriptForWebapp',
		emptyOutDir: true,
		// Sourcemaps: disabled (usecase: debug TypeScript in DevTools via .ts.map files, not needed for production overlay)
		sourcemap: false,
		// Minification: enabled for smaller bundle size (keepNames below preserves class names for serialization)
		minify: 'esbuild',
		rollupOptions: {
			output: {
				entryFileNames: 'bundle.js',
				assetFileNames: '[name].[ext]' // Stable filenames for CSS/images
			}
		}
	},
	esbuild: {
		keepNames: true // CRITICAL: Preserve class names for serialization/deserialization
	},
	define: {
		'__CURRENT_PROJECT_GIT_HASH__': JSON.stringify(gitHash)
	}
});
