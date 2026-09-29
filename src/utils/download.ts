/** Saves text as a file via a temporary object URL. */
export function downloadText(filename: string, text: string, mimeType = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }));
  downloadUrl(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Saves a data: or object URL as a file. */
export function downloadUrl(filename: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** A filesystem-friendly slug for download names, e.g. "NFA from Regex: /a*b/" → "nfa-from-regex-a-b". */
export function slugify(name: string, fallback = 'export'): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}
