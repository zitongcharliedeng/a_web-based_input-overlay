import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Get git hash for version
let gitHash: string;
try {
	gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
	gitHash = Date.now().toString();
}

// Plugin to resolve .js imports to .ts files (TypeScript convention)
const resolveTsPlugin: esbuild.Plugin = {
	name: 'resolve-ts',
	setup(build: esbuild.PluginBuild) {
		build.onResolve({ filter: /\.js$/ }, async (args: esbuild.OnResolveArgs) => {
			// Resolve relative to importer directory
			const resolvedPath = path.resolve(path.dirname(args.importer), args.path);
			const tsPath = resolvedPath.replace(/\.js$/, '.ts');

			// Check if .ts file exists
			try {
				const fs = await import('fs');
				await fs.promises.access(tsPath);
				return { path: tsPath };
			} catch {
				// Fallback to original .js path
				return { path: resolvedPath };
			}
		});
	}
};

const config: esbuild.BuildOptions = {
	entryPoints: [path.join(__dirname, 'viewWhichRendersConfigurationAndUi/default.ts')],
	bundle: true,
	outfile: path.join(__dirname, '_bundleAllCompiledJavascriptForWebapp/bundle.js'),
	format: 'esm',
	sourcemap: true,
	minify: !isWatch,
	keepNames: true,
	plugins: [resolveTsPlugin],
	define: {
		'CONFIG_VERSION': JSON.stringify(gitHash)
	}
};

(async () => {
	if (isWatch) {
		const ctx = await esbuild.context(config);
		await ctx.watch();
		console.log('👀 Watching for changes...');
	} else {
		await esbuild.build(config);
		console.log('✅ Build complete');
	}
})();
