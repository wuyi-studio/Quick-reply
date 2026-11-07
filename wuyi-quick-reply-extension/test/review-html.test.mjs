import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('review html is rendered from the real side panel functions', () => {
  const list = fs.readFileSync('/tmp/wuyi-review/list.html', 'utf8');
  const wide = fs.readFileSync('/tmp/wuyi-review/wide.html', 'utf8');
  const quote = fs.readFileSync('/tmp/wuyi-review/quote.html', 'utf8');
  const popup = fs.readFileSync('/tmp/wuyi-review/window.html', 'utf8');
  assert.match(list, /移動/);
  assert.match(list, /合成甲/);
  assert.equal(list.includes('startLongPress'), false);
  assert.match(wide, /合成藏/);
  assert.match(wide, /格子（21）/);
  assert.match(quote, /數字蠟燭 \$30/);
  assert.match(quote, /自訂品項名稱/);
  assert.match(popup, /每頁顯示 20 格/);
});
