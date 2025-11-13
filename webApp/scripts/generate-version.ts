#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const buildTime = new Date().toISOString();

    const content = `export const CONFIG_VERSION = '${gitHash}';
export const BUILD_TIME = '${buildTime}';
`;

    fs.writeFileSync(
        path.join(__dirname, '../browserInputOverlayView/_helpers/version.ts'),
        content,
        'utf8'
    );
} catch (error) {
    const fallbackVersion = Date.now().toString();
    const content = `export const CONFIG_VERSION = '${fallbackVersion}';
export const BUILD_TIME = '${new Date().toISOString()}';
`;
    fs.writeFileSync(
        path.join(__dirname, '../browserInputOverlayView/_helpers/version.ts'),
        content,
        'utf8'
    );
}
