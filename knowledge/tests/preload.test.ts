import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script = readFileSync(new URL('../../assets/js/knowledge-preload.js', import.meta.url), 'utf8');
async function preload({mobile = false, embedded = false, saveData = false, slow = false, fail = false} = {}) {
  const requests: string[] = [];
  let idle: (() => Promise<void>) | undefined;
  const window: any = {addEventListener() {}, requestIdleCallback: (fn: () => Promise<void>) => idle = fn};
  window.parent = embedded ? {} : window;
  runInNewContext(script, {window, AbortController, URL, matchMedia: () => ({matches: mobile}),
    navigator: {connection: {saveData, effectiveType: slow ? '2g' : '4g'}, onLine: true},
    location: {origin: 'https://blog.test', href: 'https://blog.test/classic/'},
    document: {documentElement: {hasAttribute: () => false}, hidden: false, readyState: 'complete', querySelector: () => ({content: '/preload.json'})},
    fetch: async (url: string | URL) => {
      requests.push(String(url));
      if (fail) throw new Error('Network unavailable');
      return {ok: true, json: async () => ['/knowledge/app-hash.js', '/rhine/assets/archive-cassette.glb?v=5abab02', 'https://external.test/asset'], arrayBuffer: async () => new ArrayBuffer(0)};
    },
  });
  assert.deepEqual(requests, [], 'No requests before idle time');
  if (idle) await idle();
  return requests;
}
test('classic idle warm-up only fetches same-origin assets and tolerates failure', async () => {
  assert.deepEqual(await preload(), ['/preload.json', 'https://blog.test/knowledge/app-hash.js', 'https://blog.test/rhine/assets/archive-cassette.glb?v=5abab02']);
  assert.deepEqual(await preload({fail: true}), ['/preload.json']);
});
test('mobile warms scripts without models; embedded, data-saving and slow connections skip warm-up', async () => {
  assert.deepEqual(await preload({mobile: true}), ['/preload.json', 'https://blog.test/knowledge/app-hash.js']);
  for (const options of [{embedded: true}, {saveData: true}, {slow: true}]) assert.deepEqual(await preload(options), []);
});
