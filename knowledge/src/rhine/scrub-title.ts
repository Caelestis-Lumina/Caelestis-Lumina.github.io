/** Keep titles readable during continuous dragging; newer selections replace the old reveal. */
export class ScrubTitle {
  private animation?: Animation;

  constructor(private host: HTMLElement) {}

  update(value: string, animated: boolean) {
    if (value === this.host.textContent) {
      if (!animated) this.reset();
      return;
    }
    this.reset();
    this.host.textContent = value;
    if (animated) {
      this.animation = this.host.animate(
        [{ opacity: .55, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 240, easing: "cubic-bezier(.22, 1, .36, 1)" },
      );
    }
  }

  reset() {
    this.animation?.cancel();
    this.animation = undefined;
  }
}
