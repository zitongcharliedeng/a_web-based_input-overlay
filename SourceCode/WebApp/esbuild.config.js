import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWatch = process.argv.includes('--watch');
// Plugin to resolve .js imports to .ts files (TypeScript convention)
const resolveTsPlugin = {
    name: 'resolve-ts',
    setup(build) {
        build.onResolve({ filter: /\.js$/ }, async (args) => {
            // Resolve relative to importer directory
            const resolvedPath = path.resolve(path.dirname(args.importer), args.path);
            const tsPath = resolvedPath.replace(/\.js$/, '.ts');
            // Check if .ts file exists
            try {
                const fs = await import('fs');
                await fs.promises.access(tsPath);
                return { path: tsPath };
            }
            catch {
                // Fallback to original .js path
                return { path: resolvedPath };
            }
        });
    }
};
const config = {
    entryPoints: [path.join(__dirname, 'viewWhichRendersConfigurationAndUi/default.ts')],
    bundle: true,
    outfile: path.join(__dirname, 'dist/bundle.js'),
    format: 'esm',
    sourcemap: true,
    minify: !isWatch,
    keepNames: true,
    plugins: [resolveTsPlugin]
};
(async () => {
    if (isWatch) {
        const ctx = await esbuild.context(config);
        await ctx.watch();
        console.log('👀 Watching for changes...');
    }
    else {
        await esbuild.build(config);

        // Copy index.html to dist/ for GitHub Pages deployment
        const distDir = path.join(__dirname, 'dist');
        if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
        }

        copyFileSync(
            path.join(__dirname, 'index.html'),
            path.join(distDir, 'index.html')
        );

        // Copy assets directory to dist/
        const assetsSource = path.join(__dirname, 'viewWhichRendersConfigurationAndUi/_assets');
        const assetsDest = path.join(distDir, '_assets');
        if (existsSync(assetsSource)) {
            cpSync(assetsSource, assetsDest, { recursive: true });
        }

        console.log('✅ Build complete (copied index.html and assets to dist/)');
    }
})();
//# sourceMappingURL=esbuild.config.js.map