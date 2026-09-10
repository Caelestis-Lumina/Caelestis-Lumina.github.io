/** Decorative text only; article DOM, formulas and accessibility text are never scrambled. */
export function decodePreview(text: string, progress: number) {
  const chars = Array.from(text);
  const count = Math.floor(chars.length * Math.max(0, Math.min(1, progress)));
  const glyphs = ['░', '⌁', '·', '▒'];
  return chars.slice(0, count).join('') + (count < chars.length
    ? glyphs[count % glyphs.length] + glyphs[(count + 1) % glyphs.length] : '');
}

export class ReaderReveal {
  private timer?: ReturnType<typeof setTimeout>;
  private version = 0;
  private host: HTMLElement;
  constructor(host: HTMLElement) { this.host = host; }

  start(title: string, summary: string, reduced: boolean) {
    this.finish();
    if (reduced) return;
    const version = this.version;
    const heading = document.createElement('h2');
    const excerpt = document.createElement('p');
    const scan = document.createElement('i');
    scan.className = 'reader-scan';
    this.host.replaceChildren(heading, excerpt, scan);
    this.host.hidden = false;
    const began = performance.now();
    const tick = () => {
      if (version !== this.version) return;
      const elapsed = performance.now() - began;
      if (elapsed >= 1100) { this.finish(); return; }
      heading.textContent = decodePreview(title, elapsed / 650);
      excerpt.textContent = decodePreview(summary.slice(0, 140), Math.max(0, elapsed - 180) / 800);
      this.timer = setTimeout(tick, 45);
    };
    tick();
  }

  finish() {
    this.version++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.host.hidden = true;
    this.host.replaceChildren();
  }
}
