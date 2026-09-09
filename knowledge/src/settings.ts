import { Dialog } from "./dialog.ts";
import { element, siteURL } from "./dom.ts";
import { Preferences } from "./preferences.ts";

export class Settings extends Dialog {
  constructor(private prefs: Preferences, apply: () => void, replay: () => void) {
    super("knowledge-settings", "显示与动效设置");
    this.root.innerHTML = `<header class="dialog-header"><div><span>DISPLAY & MOTION</span><h2>显示与动效</h2></div><button data-close>关闭 <kbd>ESC</kbd></button></header>
      <label class="setting-row"><span><strong>完整画质</strong><small>环境遮蔽、景深与更高分辨率</small></span><input id="setting-quality" type="checkbox"></label>
      <label class="setting-row"><span><strong>减少动态效果</strong><small>降低场景运动并跳过开场；始终尊重系统偏好</small></span><input id="setting-motion" type="checkbox"></label>
      <button class="settings-replay">重播开场 ↗</button>
      <div class="settings-credits"><p>三维资产与动效基于 <a href="https://github.com/LBEILC/RhineLabUI" target="_blank" rel="noopener">LBEILC / RhineLabUI</a> 改编。</p><p><a href="${siteURL("rhine/licenses/RhineLabUI-MIT.txt")}" target="_blank" rel="noopener">RhineLabUI 许可</a> · <a href="${siteURL("rhine/fonts/MiSans-license.pdf")}" target="_blank" rel="noopener">MiSans 许可</a> · <a href="${siteURL("rhine/licenses/rolling-number.txt")}" target="_blank" rel="noopener">Rolling Number 许可</a></p><a href="${siteURL("about/")}">关于博客与开源致谢 ↗</a></div>`;
    element<HTMLInputElement>("#setting-quality", this.root).addEventListener("change", event => {
      prefs.setQuality((event.target as HTMLInputElement).checked); apply();
    });
    element<HTMLInputElement>("#setting-motion", this.root).addEventListener("change", event => {
      prefs.setReduced((event.target as HTMLInputElement).checked); apply();
    });
    element(".settings-replay", this.root).addEventListener("click", () => { this.close(); replay(); });
  }
  override open() {
    element<HTMLInputElement>("#setting-quality", this.root).checked = this.prefs.quality;
    element<HTMLInputElement>("#setting-motion", this.root).checked = this.prefs.reduced;
    element<HTMLInputElement>("#setting-motion", this.root).disabled = this.prefs.systemMotion.matches;
    super.open();
  }
}
