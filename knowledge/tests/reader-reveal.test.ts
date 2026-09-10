import {test} from 'node:test';
import assert from 'node:assert/strict';
import {textRanges, decodedCount, ReaderReveal} from '../src/reader-reveal.ts';

test('glyph measurement uses exact UTF-16 ranges and decoding ends at the full text', () => {
  const text = '字🗂️A';
  for (const range of textRanges(text)) assert.equal(text.slice(range.start, range.end), range.char);
  assert.equal(textRanges(text)[1].end - textRanges(text)[1].start, 2);
  assert.equal(decodedCount(50, 0), 0);
  assert.equal(decodedCount(50, 400), 25);
  assert.equal(decodedCount(50, 900), 50);
});

test('each cached opening replays once and stale callbacks cannot affect another opening', t => {
  const timers = new Map<number, () => void>();
  let clock = 0, id = 0, overlays = 0;
  t.mock.method(globalThis, 'setTimeout', ((callback: () => void) => {timers.set(++id, callback); return id;}) as typeof setTimeout);
  t.mock.method(globalThis, 'clearTimeout', ((timer: number) => timers.delete(timer)) as typeof clearTimeout);
  t.mock.method(performance, 'now', () => clock);
  const originalObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
  Object.defineProperty(globalThis, 'ResizeObserver', {configurable:true, value:class {observe() {} disconnect() {}}});
  t.after(() => {if(originalObserver) Object.defineProperty(globalThis,'ResizeObserver',originalObserver); else Reflect.deleteProperty(globalThis,'ResizeObserver');});
  const events = new Map<string, () => void>();
  const bounds = () => ({top:10,bottom:30,left:10,right:90,width:80,height:20});
  const node = {textContent:'文章标题', parentElement:{closest:()=>null}};
  const dataset: Record<string,string> = {};
  const noop = () => {};
  const doc = {
    defaultView:{innerWidth:1000,innerHeight:700,devicePixelRatio:1,getComputedStyle:()=>({fontStyle:'normal',fontWeight:'400',fontSize:'20px',fontFamily:'sans-serif',color:'#111'}), addEventListener:noop, removeEventListener:noop},
    createRange:()=>({setStart:noop,setEnd:noop,getBoundingClientRect:bounds}),
    querySelectorAll:()=>[{getBoundingClientRect:bounds}],
    querySelector:()=>({getBoundingClientRect:bounds}),
    createTreeWalker:()=>{let visited=false;return {nextNode:()=>visited?null:(visited=true,node)};},
    createElement:()=>({className:'',style:{cssText:''},setAttribute:noop,remove:()=>overlays--,
      getContext:()=>({scale:noop,clearRect:noop,fillRect:noop,save:noop,beginPath:noop,rect:noop,clip:noop,fillText:noop,restore:noop})}),
    body:{append:()=>overlays++}, documentElement:{dataset},
    addEventListener:(type:string,fn:()=>void)=>events.set(type,fn),removeEventListener:(type:string)=>events.delete(type),
  } as unknown as Document;
  const reveal = new ReaderReveal();
  reveal.start(doc,false);
  assert.equal(dataset.readerRevealRun,'1');
  const stale = [...timers.values()][0];
  reveal.finish();
  assert.equal(overlays,0);
  reveal.start(doc,false);
  stale();
  assert.equal(overlays,1);
  assert.equal(dataset.readerRevealRun,'2');
  assert.equal(timers.size,1);
  events.get('scroll')!();
  assert.equal(overlays,0);
  assert.equal(timers.size,0);
  reveal.start(doc,false);
  clock=900;
  const [key,tick]=[...timers.entries()][0]; timers.delete(key); tick();
  assert.equal(overlays,0);
  assert.equal(dataset.readerReveal,undefined);
  reveal.start(doc,true);
  assert.equal(overlays,0);
  assert.equal(timers.size,0);
});
