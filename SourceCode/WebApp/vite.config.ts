import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig({
	base: './', // Relative paths for subdirectory deployments (GitHub Pages /experimental/)
	build: {
		outDir: '_bundleAllCompiledJavascriptForWebapp',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'bundle.js',
				assetFileNames: '[name].[ext]' // ext in Vite means non-JS files
			}
		}
	},
	esbuild: {
		keepNames: true // Preserve class names for ALL_CANVAS_OBJECT_CLASSES_BY_CLASSNAME
	},
	define: {
		'__CURRENT_PROJECT_GIT_HASH__': JSON.stringify(
			execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
		)
	}
});
