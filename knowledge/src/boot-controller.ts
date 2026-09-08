import { BootSequence } from "./rhine/boot.ts";
import { element } from "./dom.ts";

const ease = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };

/** Preserve the reference time line, then hand control to the real catalog. */
export class BootController {
  private sequence: BootSequence;
  private started = 0;
  constructor(private stage: HTMLElement, private complete: () => void) {
    element("#boot-background").insertAdjacentHTML("beforeend", '<div class="boot-white"></div>');
    this.sequence = new BootSequence(stage);
  }
  start() { this.started = performance.now() / 1000 - 1.76; }
  reset() {
    this.sequence.reset();
    this.stage.dataset.boot = "done";
    element("#cinema-caption").textContent = "";
    element(".callout-rule").style.removeProperty("transform");
  }
  update(time: number) {
    const t = time - this.started;
    if (t >= 25.6) { this.complete(); return undefined; }
    const motion = this.sequence.update(t);
    this.stage.dataset.boot = t >= 22 ? "array" : motion.step;
    element("#cinema-caption").textContent = t >= 22 ? "知识档案已就绪" :
      motion.step === "welcome" ? "欢迎访问 Caelestis Lumina 知识库" : "";
    this.stage.style.setProperty("--entry-opacity", String(ease((t - 21.9) / 0.13)));
    element(".callout-rule").style.transform = `scaleX(${ease((t - 22.08) / 0.9)})`;
    return { reveal: ease((t - 22) / 0.4), lift: 0, zoom: 0, time: t };
  }
}
