#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const buildTime = new Date().toISOString();

    const content = `export const CONFIG_VERSION = '${gitHash}';
export const BUILD_TIME = '${buildTime}';
`;

    writeFileSync(
        join(__dirname, 'version.ts'),
        content,
        'utf8'
    );
} catch {
    const fallbackVersion = Date.now().toString();
    const content = `export const CONFIG_VERSION = '${fallbackVersion}';
export const BUILD_TIME = '${new Date().toISOString()}';
`;
    writeFileSync(
        join(__dirname, 'version.ts'),
        content,
        'utf8'
    );
}
