/** A cancelled visual transition resolves false and never commits its final frame. */
export function tween(duration: number, signal: AbortSignal, paint: (progress: number) => void): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (!duration) { paint(1); return Promise.resolve(true); }
  return new Promise(resolve => {
    let frame = 0;
    const start = performance.now();
    const finish = (completed: boolean) => {
      cancelAnimationFrame(frame);
      signal.removeEventListener("abort", abort);
      resolve(completed);
    };
    const abort = () => finish(false);
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      paint(progress * progress * (3 - 2 * progress));
      if (progress === 1) finish(true);
      else frame = requestAnimationFrame(tick);
    };
    signal.addEventListener("abort", abort, {once: true});
    paint(0);
    frame = requestAnimationFrame(tick);
  });
}
