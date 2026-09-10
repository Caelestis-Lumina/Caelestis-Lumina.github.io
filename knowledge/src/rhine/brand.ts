import favicon from '../../../static/favicon.svg?raw';

// The favicon owns the geometry; all monochrome marks use those exact strokes.
const strokes = [...favicon.matchAll(/data-mark="(c|l|signal)" d="([^"]+)"/g)];
const paths = strokes.map(([,name,d]) => `<path data-cl-stroke="${name}" d="${d}"/>`).join('');
const mark = (transform: string) => `<g transform="${transform}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
export const labelMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 48" color="#171713">${mark('translate(18 -8)')}</svg>`;
export const logo = `<svg viewBox="0 0 310 185" aria-label="Caelestis Lumina" role="img">${mark('translate(59 -20) scale(3)')}<text x="155" y="170" text-anchor="middle" font-family="MiSans,sans-serif" font-size="14" font-weight="700" letter-spacing="3">CAELESTIS LUMINA</text></svg>`;
