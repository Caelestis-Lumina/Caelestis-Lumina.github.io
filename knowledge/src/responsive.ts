/** Layout follows available space; touch devices start with a lighter render budget. */
export const compactLayout = () => matchMedia('(max-width: 900px)').matches;
export const lightRendering = () => compactLayout() || matchMedia('(pointer: coarse)').matches;
