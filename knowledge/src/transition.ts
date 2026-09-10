/** A cancelled visual transition resolves false and never commits its final frame. */
export function tween(duration: number, signal: AbortSignal, paint: (progress: number) => void,
  easing = (t: number) => t * t * (3 - 2 * t)): Promise<boolean> {
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
      paint(easing(progress));
      if (progress === 1) finish(true);
      else frame = requestAnimationFrame(tick);
    };
    signal.addEventListener("abort", abort, {once: true});
    paint(0);
    frame = requestAnimationFrame(tick);
  });
}

/** Transform/opacity animations run on the compositor, with the same cancellation contract. */
export async function animateElement(element: HTMLElement, keyframes: Keyframe[], duration: number, signal: AbortSignal) {
  if (signal.aborted) return false;
  if (!duration) return true;
  const animation = element.animate(keyframes, {duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both'});
  const abort = () => animation.cancel();
  signal.addEventListener('abort', abort, {once: true});
  const completed = await animation.finished.then(() => true, () => false);
  signal.removeEventListener('abort', abort);
  animation.cancel();
  return completed && !signal.aborted;
}
