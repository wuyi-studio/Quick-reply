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

test('slot control renders 10 cards and keeps a hidden item when switched', () => {
  const page = Array(21).fill(null);
  page[0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
  page[12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
  page[20] = { id: 'tail', category: '🌹', title: '合成尾', text: '合成內文尾' };
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
  ctx.renderReplies();
  const html = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.equal((html.match(/class="reply-card"/g) || []).length, 1);
  assert.match(html, /此頁有 2 則在目前未顯示的格子（13、21）/);
  assert.match(ctx.document.getElementById('slotsPerPageControl').innerHTML, /aria-label="每頁顯示 10 格"/);
  ctx.setVisibleSlotsFromUi(20);
  const again = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(again, /合成藏/);
  assert.equal(again.includes('replyCard_1_20'), false);
  assert.match(again, /此頁有 1 則在目前未顯示的格子（21）/);
  assert.equal(ctx.localStorage.getItem('wuyi_slots_per_page'), '20');
});
