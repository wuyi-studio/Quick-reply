import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ext = path.join(repo, 'wuyi-quick-reply-extension');

test('1.0.6 zip and index.html blobs stay unchanged', () => {
  const zip = execFileSync('git', ['rev-parse', 'HEAD:wuyi-quick-reply-extension.zip'], { cwd: repo }).toString().trim();
  const html = execFileSync('git', ['rev-parse', 'HEAD:index.html'], { cwd: repo }).toString().trim();
  assert.equal(zip, '0eda75cdfbb8bd19f219ebe896d82cb3a1763bc5');
  assert.equal(html, '49b2a60a586d95c4604c808f00bbf1cb00f0f0dc');
});

test('unpacked manifest keeps the 1.0.6 permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, '梧藝客服小幫手');
  assert.deepEqual(manifest.permissions, ['sidePanel', 'scripting']);
  assert.deepEqual(manifest.host_permissions, ['https://chat.line.biz/*']);
  assert.equal(fs.existsSync(path.join(ext, 'app.js')), true);
  assert.equal(fs.existsSync(path.join(ext, 'content.js')), true);
  assert.equal(fs.readFileSync(path.join(ext, 'content.js'), 'utf8').includes('KeyboardEvent'), false);
});
