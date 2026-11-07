import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ext = path.join(repo, 'wuyi-quick-reply-extension');

test('release stays inside the extension and does not gain permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, '1.0.7');
  assert.equal(manifest.name, '梧藝客服小幫手');
  assert.deepEqual(manifest.permissions, ['sidePanel', 'scripting']);
  assert.deepEqual(manifest.host_permissions, ['https://chat.line.biz/*']);
  const diff = execFileSync('git', ['diff', '--name-only', 'dc523195102f957cc8d2a925004cd917f1df4522', 'HEAD'], { cwd: repo }).toString();
  assert.equal(diff.split('\n').includes('index.html'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'content.js'), 'utf8').includes('KeyboardEvent'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'app.js'), 'utf8').includes('3000'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'sidepanel.css'), 'utf8').includes('longPressBar'), false);
});
