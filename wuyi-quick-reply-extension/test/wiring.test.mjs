import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.mjs';

test('harness renders a synthetic card through the real builder', () => {
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': [{ id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' }] })
    }
  });
  const html = ctx.buildReplyCardHtml({ id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' }, 1, 0);
  assert.match(html, /id="replyCard_1_0"/);
  assert.match(html, /合成甲/);
  assert.equal(typeof ctx.openMoveModal, 'function');
});
