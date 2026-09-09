// Monochrome adaptation of this blog's existing C/L favicon, shared by labels and boot.
export const bootMarkStrokes = [
  "M167 25C75-18 37 127 145 128",
  "M188 24V125H261",
  "M258 16V42M245 29H271",
];
const paths = `<path d="${bootMarkStrokes.join(" ")}" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M285 128h8" stroke="currentColor" stroke-width="5"/>`;
export const labelMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 145" color="#171713">${paths}</svg>`;
export const logo = `<svg viewBox="0 0 310 185" aria-label="Caelestis Lumina" role="img">${paths}<text x="155" y="170" text-anchor="middle" font-family="MiSans,sans-serif" font-size="14" font-weight="700" letter-spacing="3">CAELESTIS LUMINA</text></svg>`;
