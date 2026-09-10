/** UTF-16 ranges keep emoji and surrogate pairs intact when measuring real text. */
export function textRanges(text: string) {
  let offset = 0;
  return Array.from(text, char => {
    const start = offset; offset += char.length;
    return {char, start, end: offset};
  });
}

export function decodedCount(length: number, elapsed: number) {
  return Math.min(length, Math.floor(length * Math.max(0, elapsed) / 800));
}

type Glyph = {left: number; top: number; width: number; height: number; font: string; color: string};

/** Measure visible prose in its real iframe layout. Never duplicate or reflow the article. */
function measureGlyphs(doc: Document): Glyph[] {
  const view = doc.defaultView!;
  const glyphs: Glyph[] = [];
  const range = doc.createRange();
  for (const block of doc.querySelectorAll<HTMLElement>('.post-title, .post-content h2, .post-content h3, .post-content p')) {
    const rect = block.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top >= view.innerHeight) continue;
    const walker = doc.createTreeWalker(block, 4 /* SHOW_TEXT */);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement!;
      if (parent.closest('pre, code, math, mjx-container, svg, table, script, style, .katex') || /\$|\\[([]/.test(node.textContent || '')) continue;
      const style = view.getComputedStyle(parent);
      for (const {char, start, end} of textRanges(node.textContent || '')) {
        if (/\s/.test(char)) continue;
        range.setStart(node, start); range.setEnd(node, end);
        const box = range.getBoundingClientRect();
        if (!box.width || box.top < 0 || box.bottom > view.innerHeight || box.right < 0 || box.left >= view.innerWidth) continue;
        glyphs.push({left: box.left, top: box.top, width: box.width, height: box.height,
          font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, color: style.color});
        if (glyphs.length >= 600) return glyphs;
      }
    }
  }
  return glyphs;
}

export class ReaderReveal {
  private timer?: ReturnType<typeof setTimeout>;
  private version = 0;
  private runs = 0;
  private cleanup = () => {};

  start(doc: Document, reduced: boolean) {
    this.finish();
    const view = doc.defaultView;
    if (reduced || !view) return;
    const glyphs = measureGlyphs(doc);
    if (!glyphs.length) return;
    const canvas = doc.createElement('canvas');
    canvas.className = 'reader-glyph-reveal';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
    const ratio = Math.min(view.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.innerWidth * ratio);
    canvas.height = Math.round(view.innerHeight * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    doc.body.append(canvas);
    doc.documentElement.dataset.readerReveal = 'active';
    doc.documentElement.dataset.readerRevealRun = String(++this.runs);
    const version = this.version;
    const finish = () => this.finish();
    // Interactions or layout changes end the decoration instead of leaving stale masks.
    const events = ['scroll', 'pointerdown', 'keydown'] as const;
    for (const event of events) doc.addEventListener(event, finish, {capture: true, passive: true});
    view.addEventListener('resize', finish);
    doc.fonts?.addEventListener('loadingdone', finish);
    const content = doc.querySelector('.post-content') || doc.body;
    const initial = content.getBoundingClientRect();
    const observer = new ResizeObserver(() => {
      const rect = content.getBoundingClientRect();
      if (Math.abs(rect.height - initial.height) > 1 || Math.abs(rect.width - initial.width) > 1) finish();
    });
    observer.observe(content);
    this.cleanup = () => {
      canvas.remove(); observer.disconnect();
      for (const event of events) doc.removeEventListener(event, finish, true);
      view.removeEventListener('resize', finish);
      doc.fonts?.removeEventListener('loadingdone', finish);
      delete doc.documentElement.dataset.readerReveal;
    };
    const began = performance.now();
    const tick = () => {
      if (version !== this.version) return;
      const elapsed = performance.now() - began;
      if (elapsed >= 850) { this.finish(); return; }
      ctx.clearRect(0, 0, view.innerWidth, view.innerHeight);
      const decoded = decodedCount(glyphs.length, elapsed);
      const symbols = '01▒░⌁<>/';
      for (let i = decoded; i < glyphs.length; i++) {
        const glyph = glyphs[i];
        ctx.fillStyle = '#f5f2ec';
        ctx.fillRect(glyph.left - .3, glyph.top, glyph.width + .6, glyph.height);
        if (i >= decoded + 8) continue;
        ctx.save();
        ctx.beginPath(); ctx.rect(glyph.left, glyph.top, glyph.width, glyph.height); ctx.clip();
        ctx.globalAlpha = Math.floor(elapsed / 90) % 3 === 1 ? .55 : .85;
        ctx.font = glyph.font; ctx.fillStyle = glyph.color; ctx.textBaseline = 'middle';
        ctx.fillText(symbols[(i + Math.floor(elapsed / 45)) % symbols.length], glyph.left, glyph.top + glyph.height / 2, glyph.width);
        ctx.restore();
      }
      this.timer = setTimeout(tick, 45);
    };
    tick();
  }

  finish() {
    this.version++;
    clearTimeout(this.timer); this.timer = undefined;
    this.cleanup(); this.cleanup = () => {};
  }
}
