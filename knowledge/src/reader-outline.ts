/** The outline follows the real iframe headings, including layout changes from formulas. */
export class ReaderOutline {
  private cleanup = () => {};
  constructor(private host: HTMLElement) {}

  clear() {
    this.cleanup();
    this.host.replaceChildren();
  }

  connect(doc: Document) {
    this.clear();
    const headings = [...doc.querySelectorAll<HTMLElement>('.post-content h2, .post-content h3, .post-content h4')];
    if (!headings.length) {
      this.host.textContent = '本文没有分节标题';
      return;
    }
    const list = document.createElement('ol');
    const links = headings.map((heading, index) => {
      // Existing Hugo IDs are authoritative; generated IDs are iframe-local only.
      if (!heading.id) heading.id = `reader-section-${index}`;
      const item = document.createElement('li');
      item.dataset.level = heading.tagName.slice(1);
      const link = document.createElement('a');
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent?.replace(/\s*#\s*$/, '').trim() || `章节 ${index + 1}`;
      link.addEventListener('click', event => {
        event.preventDefault();
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
        heading.scrollIntoView({block: 'start', behavior: document.documentElement.dataset.reduced === 'true' ? 'instant' : 'smooth'});
      });
      item.append(link);
      list.append(item);
      return link;
    });
    this.host.append(list);
    let frame = 0;
    let active = -1;
    const update = () => {
      frame = 0;
      let index = 0;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top > 120) break;
        index = i;
      }
      if (index === active) return;
      if (active >= 0) links[active].removeAttribute('aria-current');
      active = index;
      links[index].setAttribute('aria-current', 'location');
      // Scroll only the outline, never the parent dialog or article.
      const link = links[index];
      const top = link.getBoundingClientRect().top - this.host.getBoundingClientRect().top;
      if (top < 0 || top + link.offsetHeight > this.host.clientHeight)
        this.host.scrollTop += top - this.host.clientHeight / 3;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    doc.addEventListener('scroll', schedule, {passive: true});
    const resize = new ResizeObserver(schedule);
    resize.observe(doc.querySelector('.post-content') || doc.documentElement);
    this.cleanup = () => {
      doc.removeEventListener('scroll', schedule);
      resize.disconnect();
      cancelAnimationFrame(frame);
      this.cleanup = () => {};
    };
    update();
  }
}
