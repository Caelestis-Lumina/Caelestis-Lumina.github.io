import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodePreview, ReaderReveal} from '../src/reader-reveal.ts';

test('decoded copy preserves Unicode and always resolves to the exact original text', () => {
  const title = '档案 🗂️ / 相机内参';
  assert.equal(decodePreview(title, 1), title);
  assert.equal(decodePreview(title, 3), title);
  assert.equal(decodePreview(title, .5).startsWith(Array.from(title).slice(0, Math.floor(Array.from(title).length / 2)).join('')), true);
  assert.ok(decodePreview(title, 0).length <= 2);
});

test('load completion removes every decoration and invalidates queued updates', t => {
  const children: {textContent: string}[] = [];
  const host = {hidden: true, replaceChildren(...nodes: typeof children) {children.splice(0, children.length, ...nodes);}};
  const timers = new Map<number, () => void>();
  let clock = 0, id = 0;
  t.mock.method(globalThis, 'setTimeout', ((callback: () => void) => {timers.set(++id, callback); return id;}) as typeof setTimeout);
  t.mock.method(globalThis, 'clearTimeout', ((timer: number) => timers.delete(timer)) as typeof clearTimeout);
  t.mock.method(performance, 'now', () => clock);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {createElement: () => ({textContent: '', className: ''})}});
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'document', previous); else Reflect.deleteProperty(globalThis, 'document'); });
  const reveal = new ReaderReveal(host as unknown as HTMLElement);
  reveal.start('文章标题', '摘要', false);
  assert.equal(host.hidden, false);
  const stale = [...timers.values()][0];
  reveal.finish(); // Same operation used by iframe load, navigation, error and close.
  stale();
  assert.equal(host.hidden, true);
  assert.equal(children.length, 0);
  assert.equal(timers.size, 0);
  reveal.start('另一篇', '下一篇摘要', false);
  stale();
  assert.equal(host.hidden, false);
  assert.equal(timers.size, 1);
  clock = 1200;
  const [key, timeout] = [...timers.entries()][0];
  timers.delete(key); timeout();
  assert.equal(host.hidden, true, 'a stalled load cannot loop the effect');
  assert.equal(timers.size, 0);
  reveal.start('无动画', '', true);
  assert.equal(host.hidden, true);
  assert.equal(timers.size, 0);
});
