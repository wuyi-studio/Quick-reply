import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, click } from './harness.mjs';

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

function cardContext() {
  const page = Array(20).fill(null);
  page[0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
  return boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
}

test('move, edit, and copy buttons do not paste; card body pastes once', () => {
  const ctx = cardContext();
  ctx.renderReplies();
  const html = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(html, /data-on-click="openMoveFromCard\(event, 1, 0\)"/);
  assert.match(html, />移動</);
  assert.equal(html.includes('startLongPress'), false);
  assert.equal(html.includes('3000'), false);
  const card = new ctx.__Element('div');
  card.setAttribute('data-on-click', 'handleCardClick(event, 1, 0)');
  const button = new ctx.__Element('button');
  button.setAttribute('data-on-click', 'openMoveFromCard(event, 1, 0)');
  const span = new ctx.__Element('span');
  button.appendChild(span);
  card.appendChild(button);
  click(ctx, span);
  assert.equal(ctx.__pasteLog.length, 0);
  assert.equal(ctx.document.getElementById('moveModal').classList.contains('show'), true);
  const title = new ctx.__Element('span');
  card.appendChild(title);
  click(ctx, title);
  assert.equal(ctx.__pasteLog.length, 1);
});

test('search shows a hidden card with its slot label', () => {
  const page = Array(20).fill(null);
  page[12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
  ctx.document.getElementById('searchInput').value = '合成藏';
  ctx.filterReplies();
  const filtered = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(filtered, /未顯示/);
  assert.match(filtered, /第 1 頁第 13 格/);
  assert.equal(filtered.includes('draggable="true"'), false);
});

test('category alt-left reorders pills and both dropdowns', () => {
  const ctx = boot({ storage: { wuyi_defaults_version: '1.0.2-003851d4', wuyi_100_pages_data: JSON.stringify({ '1': [] }) } });
  ctx.renderCategoryPills();
  const before = ctx.document.getElementById('categoryPills').innerHTML;
  assert.match(before, /selectCategory\('all'|onCategoryPillClick\('all'/);
  assert.match(before, /data-on-keydown="onCategoryKeyDown\(event\)"/);
  const first = ctx.WuyiModel.DEFAULT_CATEGORY_ORDER[0];
  const second = ctx.WuyiModel.DEFAULT_CATEGORY_ORDER[1];
  assert.ok(before.indexOf(first) < before.indexOf(second));
  const key = {
    key: 'ArrowLeft',
    altKey: true,
    preventDefault() {},
    target: {
      tagName: 'BUTTON',
      closest() { return this; },
      getAttribute(name) { return name === 'data-category-index' ? '1' : null; }
    }
  };
  ctx.onCategoryKeyDown(key);
  const after = ctx.document.getElementById('categoryPills').innerHTML;
  assert.ok(after.indexOf(second) < after.indexOf(first));
  assert.match(ctx.document.getElementById('newReplyCat').innerHTML, new RegExp(first));
  assert.match(ctx.document.getElementById('editReplyCat').innerHTML, new RegExp(first));
  assert.equal(ctx.localStorage.getItem('wuyi_category_order') !== null, true);
});

test('batch editor shows 20 rows and single add prefers a visible hole', () => {
  const page = Array(20).fill(null).map(() => ({ id: 'full', category: '💐', title: '合成滿', text: '滿' }));
  page[3] = null;
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page, '2': { kept: true } })
    }
  });
  ctx.renderModalTenSlots();
  const editor = ctx.document.getElementById('tenSlotsContainer').innerHTML;
  assert.equal((editor.match(/欄位 #/g) || []).length, 20);
  assert.match(editor, /未顯示/);
  ctx.document.getElementById('newReplyTitle').value = '合成新';
  ctx.document.getElementById('newReplyText').value = '新內文';
  ctx.document.getElementById('newReplyCat').value = '💐';
  ctx.saveSingleReply();
  const stored = JSON.parse(ctx.localStorage.getItem('wuyi_100_pages_data'));
  assert.equal(stored['1'][3].title, '合成新');
  assert.deepEqual(stored['2'], { kept: true });
});
