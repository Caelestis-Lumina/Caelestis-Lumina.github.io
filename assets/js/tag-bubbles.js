(() => {
  const cloud = document.querySelector('.tag-bubbles');
  if (!cloud || !cloud.children.length) return;

  const items = [...cloud.children].map((element, index) => {
    element.style.setProperty('--bubble-duration', `${8 + (index * 7 % 6)}s`);
    element.style.setProperty('--bubble-delay', `${-(index * 1.73 % 11)}s`);
    return { element, index };
  });
  let lastWidth = 0;
  let frame = 0;

  const layout = () => {
    frame = 0;
    const width = cloud.clientWidth;
    if (!width || width === lastWidth) return;
    lastWidth = width;

    const padding = 12;
    // Leave clearance for both bubbles' drift, hover lift, and focus outlines.
    const gap = 22;
    const placed = [];
    const bubbles = items.map(item => ({
      ...item,
      radius: item.element.querySelector('a').offsetWidth / 2,
    })).sort((a, b) => b.radius - a.radius || a.index - b.index);

    for (const bubble of bubbles) {
      const { radius, index } = bubble;
      let best = null;
      let bestScore = Infinity;
      const consider = (x, y) => {
        if (x - radius < padding || x + radius > width - padding) return;
        if (placed.some(other => Math.hypot(x - other.x, y - other.y) < radius + other.radius + gap - 0.1)) return;
        // A broad oval cloud, with no shared row or column baselines.
        const score = (x - width / 2) ** 2 + (y * 1.35) ** 2;
        if (score < bestScore) {
          bestScore = score;
          best = { x, y };
        }
      };

      if (!placed.length) consider(width / 2, 0);
      for (const anchor of placed) {
        const distance = radius + anchor.radius + gap;
        for (let step = 0; step < 24; step++) {
          const angle = (step / 24) * Math.PI * 2 + index * 2.399963;
          consider(anchor.x + Math.cos(angle) * distance, anchor.y + Math.sin(angle) * distance);
        }
      }
      // A guaranteed non-overlapping position for narrow screens or dense clouds.
      if (!best) {
        best = {
          x: width / 2,
          y: placed.length ? Math.max(...placed.map(other => other.y + other.radius)) + radius + gap : 0,
        };
      }
      placed.push({ ...bubble, ...best });
    }

    const top = Math.min(...placed.map(bubble => bubble.y - bubble.radius));
    const bottom = Math.max(...placed.map(bubble => bubble.y + bubble.radius));
    for (const bubble of placed) {
      bubble.element.style.setProperty('--bubble-x', `${bubble.x - bubble.radius}px`);
      bubble.element.style.setProperty('--bubble-y', `${bubble.y - bubble.radius - top + padding}px`);
    }
    cloud.style.height = `${bottom - top + padding * 2}px`;
    cloud.classList.add('is-packed');
  };

  const scheduleLayout = () => {
    if (!frame) frame = requestAnimationFrame(layout);
  };
  layout();
  new ResizeObserver(scheduleLayout).observe(cloud);
})();
