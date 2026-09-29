import { downloadText } from './download';

/** Replaces var(--token) references with their current computed values so the file stands alone. */
function resolveCssVariables(text: string, rootStyle: CSSStyleDeclaration): string {
  return text.replace(/var\((--[\w-]+)\)/g, (match, name: string) => rootStyle.getPropertyValue(name).trim() || match);
}

/**
 * Downloads an on-screen SVG as a standalone file: framed to its drawing (ignoring the current
 * zoom/pan transform on `contentSelector`), on the app's dark background, with CSS variables inlined.
 */
export function downloadSvgElement(svg: SVGSVGElement, filename: string, contentSelector = ':scope > g') {
  const content = svg.querySelector<SVGGraphicsElement>(contentSelector);
  if (!content) return;

  const box = content.getBBox();
  const pad = 24;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelector(contentSelector)?.removeAttribute('transform');

  const width = Math.ceil(box.width + pad * 2);
  const height = Math.ceil(box.height + pad * 2);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${width} ${height}`);
  clone.removeAttribute('style');

  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('x', String(box.x - pad));
  background.setAttribute('y', String(box.y - pad));
  background.setAttribute('width', String(width));
  background.setAttribute('height', String(height));
  background.setAttribute('fill', '#090d16');
  clone.insertBefore(background, clone.firstChild);

  const markup = resolveCssVariables(
    new XMLSerializer().serializeToString(clone),
    getComputedStyle(document.documentElement)
  );
  downloadText(filename, `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`, 'image/svg+xml');
}
