import fs from 'node:fs';
import path from 'node:path';
import { boot } from './harness.mjs';

export function writeReviewPages() {

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'sidepanel.css'), 'utf8');
const outDir = '/tmp/wuyi-review';
fs.mkdirSync(outDir, { recursive: true });

function page(title, body) {
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${title}</title><style>${css} body{width:320px;margin:0;}</style></head><body>${body}</body></html>`;
}

function shell(ctx) {
  return ctx.document.getElementById('slotsPerPageControl').innerHTML
    + ctx.document.getElementById('categoryPills').innerHTML
    + ctx.document.getElementById('repliesContainer').innerHTML;
}

const stored = { '1': Array(21).fill(null) };
stored['1'][0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
stored['1'][12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
stored['1'][20] = { id: 'tail', category: '🌹', title: '合成尾', text: '合成內文尾' };
const ctx = boot({
  storage: {
    wuyi_defaults_version: '1.0.2-003851d4',
    wuyi_100_pages_data: JSON.stringify(stored)
  }
});
ctx.renderSlotsPerPageControl();
ctx.renderCategoryPills();
ctx.renderReplies();
fs.writeFileSync(path.join(outDir, 'list.html'), page('每頁 10 格', shell(ctx)));
ctx.setVisibleSlotsFromUi(20);
ctx.renderReplies();
fs.writeFileSync(path.join(outDir, 'wide.html'), page('每頁 20 格', shell(ctx)));
const sidepanel = fs.readFileSync(path.join(root, 'sidepanel.html'), 'utf8');
const marker = sidepanel.indexOf('id="btnC30"');
const start = sidepanel.lastIndexOf('<button', marker);
const end = sidepanel.indexOf('id="customAddonError"');
const quoteFragment = sidepanel.slice(start, end) + '<div id="customAddonError"></div>';
fs.writeFileSync(path.join(outDir, 'quote.html'), page('報價', quoteFragment));
fs.writeFileSync(path.join(outDir, 'window.html'), page('小視窗', `<div style="width:280px">${shell(ctx)}</div>`));
}

if (process.argv[1] && process.argv[1].endsWith('write-review-html.mjs')) writeReviewPages();
