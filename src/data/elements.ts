/**
 * Inbuilt decorative graphics library — badges, speech bubbles, frames,
 * dividers, arrows and accents authored as self-contained SVGs on a 100×100
 * viewBox. `{COLOR}` is replaced with the picked color at insert time, so the
 * result inserts as an ordinary image element (renders, exports and filters
 * like any other image) with zero network dependency.
 */
export interface GraphicDef {
  name: string;
  category: 'badges' | 'bubbles' | 'frames' | 'dividers' | 'arrows' | 'accents';
  /** Inner SVG markup; may contain the {COLOR} placeholder. */
  svg: string;
}

export const GRAPHICS: GraphicDef[] = [
  // Badges
  {
    name: 'star',
    category: 'badges',
    svg: '<path d="M50 8 61 38 93 38 67 57 77 88 50 69 23 88 33 57 7 38 39 38Z" fill="{COLOR}"/>',
  },
  {
    name: 'sparkle',
    category: 'badges',
    svg: '<path d="M50 6c4 24 20 40 44 44-24 4-40 20-44 44-4-24-20-40-44-44 24-4 40-20 44-44Z" fill="{COLOR}"/>',
  },
  {
    name: 'burst',
    category: 'badges',
    svg:
      '<path d="M50 4 58 30 78 14 70 40 96 34 74 50 96 66 70 60 78 86 58 70 50 96 42 70 22 86 30 60 4 66 26 50 4 34 30 40 22 14 42 30Z" fill="{COLOR}"/>',
  },
  {
    name: 'seal',
    category: 'badges',
    svg:
      '<circle cx="50" cy="50" r="34" fill="{COLOR}"/><circle cx="50" cy="50" r="26" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 5"/><path d="M38 50l8 8 16-18" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'lightning',
    category: 'badges',
    svg: '<path d="M56 6 24 56h20l-6 38 34-54H50l6-34Z" fill="{COLOR}"/>',
  },
  {
    name: 'heart',
    category: 'badges',
    svg: '<path d="M50 86S14 64 14 38a18 18 0 0 1 36-8 18 18 0 0 1 36 8c0 26-36 48-36 48Z" fill="{COLOR}"/>',
  },
  // Bubbles
  {
    name: 'speech bubble',
    category: 'bubbles',
    svg:
      '<rect x="10" y="14" width="80" height="52" rx="18" fill="{COLOR}"/><path d="M28 62 22 84 48 64Z" fill="{COLOR}"/>',
  },
  {
    name: 'square bubble',
    category: 'bubbles',
    svg:
      '<rect x="10" y="14" width="80" height="52" rx="6" fill="{COLOR}"/><path d="M30 64 24 86 50 64Z" fill="{COLOR}"/>',
  },
  {
    name: 'thought bubble',
    category: 'bubbles',
    svg:
      '<path d="M26 40a16 16 0 1 1 8-30 20 20 0 0 1 38 6 15 15 0 0 1 4 29 14 14 0 0 1-18 12l-12 8 2-10a16 16 0 0 1-22-15Z" fill="{COLOR}"/><circle cx="24" cy="76" r="6" fill="{COLOR}"/><circle cx="12" cy="88" r="4" fill="{COLOR}"/>',
  },
  // Frames
  {
    name: 'round frame',
    category: 'frames',
    svg: '<rect x="8" y="8" width="84" height="84" rx="22" fill="none" stroke="{COLOR}" stroke-width="6"/>',
  },
  {
    name: 'double frame',
    category: 'frames',
    svg:
      '<rect x="8" y="8" width="84" height="84" rx="10" fill="none" stroke="{COLOR}" stroke-width="5"/><rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="{COLOR}" stroke-width="2.5"/>',
  },
  {
    name: 'bracket frame',
    category: 'frames',
    svg:
      '<path d="M30 12H14v14M70 12h16v14M30 88H14V74M70 88h16V74" fill="none" stroke="{COLOR}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'ticket',
    category: 'frames',
    svg:
      '<path d="M12 30a10 10 0 0 0 0 40v12h76V70a10 10 0 0 1 0-40V18H12Z" fill="{COLOR}"/><path d="M58 22v56" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 6"/>',
  },
  // Dividers
  {
    name: 'diamond divider',
    category: 'dividers',
    svg:
      '<path d="M4 50h30M66 50h30" stroke="{COLOR}" stroke-width="4" stroke-linecap="round"/><path d="M50 34 64 50 50 66 36 50Z" fill="{COLOR}"/>',
  },
  {
    name: 'wave divider',
    category: 'dividers',
    svg: '<path d="M4 54c12-16 24-16 36 0s24 16 36 0 14-12 20-6" fill="none" stroke="{COLOR}" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    name: 'dotted divider',
    category: 'dividers',
    svg: '<path d="M6 50h88" stroke="{COLOR}" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.5 14"/>',
  },
  {
    name: 'three dots',
    category: 'dividers',
    svg: '<circle cx="22" cy="50" r="9" fill="{COLOR}"/><circle cx="50" cy="50" r="9" fill="{COLOR}"/><circle cx="78" cy="50" r="9" fill="{COLOR}"/>',
  },
  // Arrows
  {
    name: 'curved arrow',
    category: 'arrows',
    svg:
      '<path d="M14 76c30-52 50-52 72-52" fill="none" stroke="{COLOR}" stroke-width="7" stroke-linecap="round"/><path d="M72 12 88 24 74 40" fill="none" stroke="{COLOR}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    name: 'block arrow',
    category: 'arrows',
    svg: '<path d="M8 38h48V20l36 30-36 30V62H8Z" fill="{COLOR}"/>',
  },
  {
    name: 'double chevron',
    category: 'arrows',
    svg: '<path d="M22 18 52 50 22 82M48 18 78 50 48 82" fill="none" stroke="{COLOR}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  // Accents
  {
    name: 'marker stroke',
    category: 'accents',
    svg: '<path d="M8 58c20-14 40-20 60-24 10-2 18-2 24-2-6 10-16 20-30 28-18 10-38 12-54 10Z" fill="{COLOR}" opacity="0.85"/>',
  },
  {
    name: 'underline swoosh',
    category: 'accents',
    svg: '<path d="M8 62c24 14 60 14 84-6" fill="none" stroke="{COLOR}" stroke-width="8" stroke-linecap="round"/>',
  },
  {
    name: 'brush stroke',
    category: 'accents',
    svg: '<path d="M10 60c8-18 20-30 34-34 10-3 16 2 14 10-3 12 2 22 14 26 8 3 14 8 18 16-18 6-38 4-54-2-12-4-20-8-26-16Z" fill="{COLOR}"/>',
  },
  {
    name: 'ribbon',
    category: 'accents',
    svg:
      '<path d="M14 20h72v40L64 48 50 68 36 48 14 60Z" fill="{COLOR}"/>',
  },
  {
    name: 'pin',
    category: 'accents',
    svg:
      '<path d="M50 8a24 24 0 0 1 24 24c0 16-24 40-24 40S26 48 26 32A24 24 0 0 1 50 8Z" fill="{COLOR}"/><circle cx="50" cy="32" r="9" fill="#ffffff"/>',
  },
  {
    name: 'flag',
    category: 'accents',
    svg: '<path d="M22 12v76" stroke="{COLOR}" stroke-width="6" stroke-linecap="round"/><path d="M28 16h48L60 34l16 18H28Z" fill="{COLOR}"/>',
  },
  {
    name: 'sunburst',
    category: 'accents',
    svg:
      '<circle cx="50" cy="50" r="20" fill="{COLOR}"/><g stroke="{COLOR}" stroke-width="5" stroke-linecap="round"><path d="M50 6v12M50 82v12M6 50h12M82 50h12M19 19l8 8M73 73l8 8M81 19l-8 8M27 73l-8 8"/></g>',
  },
];

export const GRAPHIC_CATEGORIES: { value: GraphicDef['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'badges', label: 'Badges' },
  { value: 'bubbles', label: 'Bubbles' },
  { value: 'frames', label: 'Frames' },
  { value: 'dividers', label: 'Dividers' },
  { value: 'arrows', label: 'Arrows' },
  { value: 'accents', label: 'Accents' },
];

/** Build a self-contained SVG data URL for a graphic at a given color/size. */
export function graphicToDataUrl(graphic: GraphicDef, color = '#6366f1', size = 320): string {
  const body = graphic.svg.replaceAll('{COLOR}', color);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">` +
    `${body}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Emoji that insert as large text elements. */
export const EMOJIS: string[] = [
  '😀', '😂', '🤔', '😍', '🤩', '😎', '🥳', '😴',
  '👍', '👎', '👏', '🙏', '💪', '🤝', '👀', '🧠',
  '❤️', '🔥', '⭐', '✨', '💡', '⚡', '🎉', '🏆',
  '🚀', '📈', '📉', '📊', '🎯', '✅', '❌', '⚠️',
  '📅', '⏰', '🔍', '📌', '🔔', '🔒', '🔑', '💰',
  '📱', '💻', '🎨', '✏️', '📝', '📷', '🎵', '🌍',
  '🌱', '☀️', '🌙', '☕', '🍕', '🐾', '🏠', '✈️',
];
