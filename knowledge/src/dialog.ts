/** Native modal isolation also covers the WebGL canvas and keyboard navigation. */
export class Dialog {
  readonly root = document.createElement("dialog");
  private opener: HTMLElement | null = null;
  onClose?: () => void;
  constructor(className: string, label: string) {
    this.root.className = `knowledge-dialog ${className}`;
    this.root.setAttribute("aria-label", label);
    document.body.appendChild(this.root);
    this.root.addEventListener("cancel", event => { event.preventDefault(); this.close(); });
    this.root.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest("[data-close]")) this.close();
    });
  }
  get isOpen() { return this.root.open; }
  open() {
    if (this.isOpen) return;
    this.opener = document.activeElement as HTMLElement | null;
    this.root.showModal();
  }
  close(notify = true) {
    if (!this.isOpen) return;
    this.root.close();
    if (this.opener?.isConnected && !this.opener.closest("[inert]")) this.opener.focus({ preventScroll: true });
    if (notify) this.onClose?.();
  }
}
