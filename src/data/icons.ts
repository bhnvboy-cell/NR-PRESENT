/**
 * Bundled offline icon library. Each icon is a set of SVG path `d` strings drawn
 * on a 24×24 viewBox with stroke styling (Feather/Lucide-style geometry). Icons
 * are turned into standalone SVG data-URLs so they insert as ordinary image
 * elements — meaning they render, filter, transform, group and EXPORT exactly
 * like any other image, with zero network dependency.
 */
export interface IconDef {
  name: string;
  category: 'ui' | 'arrows' | 'media' | 'business' | 'social' | 'tech' | 'education' | 'commerce' | 'devices' | 'weather';
  paths: string[];
}

export const ICONS: IconDef[] = [
  // UI
  { name: 'home', category: 'ui', paths: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5'] },
  { name: 'search', category: 'ui', paths: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm21 21-4.3-4.3'] },
  { name: 'settings', category: 'ui', paths: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z'] },
  { name: 'star', category: 'ui', paths: ['m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z'] },
  { name: 'heart', category: 'ui', paths: ['M12 20s-7-4.4-9.2-8.4A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.2 5.6C19 15.6 12 20 12 20Z'] },
  { name: 'bookmark', category: 'ui', paths: ['M6 3h12v18l-6-4-6 4V3Z'] },
  { name: 'bell', category: 'ui', paths: ['M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8', 'M13.7 21a2 2 0 0 1-3.4 0'] },
  { name: 'calendar', category: 'ui', paths: ['M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z', 'M4 9h16', 'M8 3v4', 'M16 3v4'] },
  { name: 'clock', category: 'ui', paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 7v5l3 2'] },
  { name: 'check-circle', category: 'ui', paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'm8 12 3 3 5-6'] },
  { name: 'info', category: 'ui', paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 11v5', 'M12 8h.01'] },
  { name: 'alert', category: 'ui', paths: ['M12 3 2 20h20L12 3Z', 'M12 10v4', 'M12 17h.01'] },
  { name: 'lock', category: 'ui', paths: ['M6 11h12v9H6z', 'M8 11V7a4 4 0 0 1 8 0v4'] },
  { name: 'unlock', category: 'ui', paths: ['M6 11h12v9H6z', 'M8 11V7a4 4 0 0 1 7.5-2'] },
  { name: 'user', category: 'ui', paths: ['M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M4 21a8 8 0 0 1 16 0'] },
  { name: 'users', category: 'ui', paths: ['M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z', 'M2 21a7 7 0 0 1 14 0', 'M17 4.3a3.5 3.5 0 0 1 0 6.9', 'M18 21h4a6 6 0 0 0-4-5.7'] },
  // Arrows
  { name: 'arrow-right', category: 'arrows', paths: ['M4 12h16', 'm14 6 6 6-6 6'] },
  { name: 'arrow-left', category: 'arrows', paths: ['M20 12H4', 'm10 6-6 6 6 6'] },
  { name: 'arrow-up', category: 'arrows', paths: ['M12 20V4', 'm6 10 6-6 6 6'] },
  { name: 'arrow-down', category: 'arrows', paths: ['M12 4v16', 'm6 14 6 6 6-6'] },
  { name: 'refresh', category: 'arrows', paths: ['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M3 21v-5h5'] },
  { name: 'shuffle', category: 'arrows', paths: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'm15 15 6 6', 'M4 4l5 5'] },
  // Media
  { name: 'play', category: 'media', paths: ['m7 4 13 8-13 8V4Z'] },
  { name: 'pause', category: 'media', paths: ['M7 4h4v16H7z', 'M13 4h4v16h-4z'] },
  { name: 'camera', category: 'media', paths: ['M4 8h3l2-2h6l2 2h3v12H4z', 'M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z'] },
  { name: 'image', category: 'media', paths: ['M4 5h16v14H4z', 'm4 15 4-4 3 3 4-5 5 6', 'M9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'] },
  { name: 'video', category: 'media', paths: ['M3 6h11v12H3z', 'm14 10 7-4v12l-7-4'] },
  { name: 'music', category: 'media', paths: ['M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M9 15V4l11-2v11', 'M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'] },
  { name: 'mic', category: 'media', paths: ['M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z', 'M6 11a6 6 0 0 0 12 0', 'M12 17v4'] },
  // Business
  { name: 'chart-bar', category: 'business', paths: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  { name: 'chart-line', category: 'business', paths: ['M3 3v18h18', 'm7 14 3-4 3 2 4-6'] },
  { name: 'chart-pie', category: 'business', paths: ['M12 3a9 9 0 1 0 9 9h-9V3Z', 'M14 2.2A9 9 0 0 1 21.8 10H14V2.2Z'] },
  { name: 'trending-up', category: 'business', paths: ['m3 17 6-6 4 4 8-8', 'M21 7v6h-6'] },
  { name: 'dollar', category: 'business', paths: ['M12 2v20', 'M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.7 5 3.3 5 1.4 5 3.7-2.2 3.5-5 3.5-5-1.1-5-3'] },
  { name: 'briefcase', category: 'business', paths: ['M3 8h18v12H3z', 'M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M3 13h18'] },
  { name: 'pie-chart', category: 'business', paths: ['M12 3a9 9 0 1 0 9 9h-9V3Z'] },
  { name: 'target', category: 'business', paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 12h.01'] },
  // Social
  { name: 'share', category: 'social', paths: ['M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'm8.6 13.5 6.8 4', 'm15.4 6.5-6.8 4'] },
  { name: 'message', category: 'social', paths: ['M4 5h16v11H8l-4 4V5Z'] },
  { name: 'send', category: 'social', paths: ['m3 11 18-8-8 18-2-8-8-2Z'] },
  { name: 'globe', category: 'social', paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M3 12h18', 'M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z'] },
  { name: 'link', category: 'social', paths: ['M9 15 15 9', 'M7 11 5.5 12.5a3.5 3.5 0 0 0 5 5L12 16', 'M17 13l1.5-1.5a3.5 3.5 0 0 0-5-5L12 8'] },
  // Tech
  { name: 'code', category: 'tech', paths: ['m8 6-6 6 6 6', 'm16 6 6 6-6 6'] },
  { name: 'cpu', category: 'tech', paths: ['M6 6h12v12H6z', 'M9 9h6v6H9z', 'M9 2v4', 'M15 2v4', 'M9 18v4', 'M15 18v4', 'M2 9h4', 'M2 15h4', 'M18 9h4', 'M18 15h4'] },
  { name: 'server', category: 'tech', paths: ['M4 4h16v6H4z', 'M4 14h16v6H4z', 'M8 7h.01', 'M8 17h.01'] },
  { name: 'cloud', category: 'tech', paths: ['M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 18H7Z'] },
  { name: 'zap', category: 'tech', paths: ['m13 2-9 12h7l-1 8 9-12h-7l1-8Z'] },
  { name: 'shield', category: 'tech', paths: ['M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z'] },
  { name: 'database', category: 'tech', paths: ['M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z', 'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'] },
  { name: 'layers', category: 'tech', paths: ['m12 3 9 5-9 5-9-5 9-5Z', 'm3 13 9 5 9-5', 'm3 17 9 5 9-5'] },
  // Education
  { name: 'book', category: 'education', paths: ['M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V4Z', 'M18 7h2v13H7'] },
  { name: 'book-open', category: 'education', paths: ['M12 6C10 4.5 7 4 4 4v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2Z', 'M12 6v14'] },
  { name: 'graduation-cap', category: 'education', paths: ['m2 9 10-5 10 5-10 5L2 9Z', 'M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5', 'M22 9v6'] },
  { name: 'pencil', category: 'education', paths: ['m4 20 1-4L16 5l3 3L8 19l-4 1Z', 'm14 7 3 3'] },
  { name: 'clipboard', category: 'education', paths: ['M8 4h8v3H8z', 'M8 5.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-2', 'M9 11h6', 'M9 15h4'] },
  { name: 'award', category: 'education', paths: ['M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z', 'm8.5 13.5-1.5 8 5-3 5 3-1.5-8'] },
  { name: 'ruler', category: 'education', paths: ['M3 15 15 3l6 6L9 21l-6-6Z', 'm7 11 2 2', 'm10 8 2 2', 'm13 5 2 2'] },
  { name: 'calculator', category: 'education', paths: ['M5 3h14v18H5z', 'M8 7h8', 'M8 11h.01', 'M12 11h.01', 'M16 11h.01', 'M8 15h.01', 'M12 15h.01', 'M16 15v3', 'M8 18h4'] },
  // Commerce
  { name: 'cart', category: 'commerce', paths: ['M3 4h2l2.5 11h11L21 7H6', 'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'] },
  { name: 'gift', category: 'commerce', paths: ['M4 10h16v10H4z', 'M2 6h20v4H2z', 'M12 6v14', 'M12 6C12 4 10.5 3 9 3s-2.5 1.5-2.5 3S9 6 12 6Zm0 0c0-2 1.5-3 3-3s2.5 1.5 2.5 3S15 6 12 6Z'] },
  { name: 'tag', category: 'commerce', paths: ['M3 12V4h8l10 10-8 8L3 12Z', 'M7.5 7.5h.01'] },
  { name: 'credit-card', category: 'commerce', paths: ['M3 6h18v12H3z', 'M3 10h18', 'M7 14h4'] },
  { name: 'wallet', category: 'commerce', paths: ['M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12', 'M15 12h5v4h-5a2 2 0 0 1 0-4Z'] },
  { name: 'truck', category: 'commerce', paths: ['M2 6h12v10H2z', 'M14 9h4l3 3v4h-7', 'M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'] },
  { name: 'store', category: 'commerce', paths: ['M4 9h16v11H4z', 'M3 9l2-5h14l2 5', 'M9 20v-6h6v6'] },
  { name: 'coins', category: 'commerce', paths: ['M12 4a8 4 0 1 0 0 8 8 4 0 0 0 0-8Z', 'M4 12a8 4 0 0 0 8 4', 'M4 8v4c0 2.2 3.6 4 8 4', 'M20 12v4c0 2.2-3.6 4-8 4'] },
  // Devices
  { name: 'monitor', category: 'devices', paths: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'] },
  { name: 'smartphone', category: 'devices', paths: ['M7 2h10v20H7z', 'M11 18.5h2'] },
  { name: 'laptop', category: 'devices', paths: ['M5 5h14v10H5z', 'M2 18h20l-2 2H4l-2-2Z'] },
  { name: 'tablet', category: 'devices', paths: ['M4 3h16v18H4z', 'M11 18.5h2'] },
  { name: 'printer', category: 'devices', paths: ['M7 8V3h10v5', 'M5 8h14a2 2 0 0 1 2 2v6h-4v5H7v-5H3v-6a2 2 0 0 1 2-2Z', 'M7 14h10'] },
  { name: 'headphones', category: 'devices', paths: ['M4 14v-2a8 8 0 0 1 16 0v2', 'M4 14h4v6H6a2 2 0 0 1-2-2v-4Z', 'M20 14h-4v6h2a2 2 0 0 0 2-2v-4Z'] },
  { name: 'watch', category: 'devices', paths: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M9 8V4h6v4', 'M9 16v4h6v-4'] },
  { name: 'gamepad', category: 'devices', paths: ['M6 8h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5.5 1.7L15 14H9l-1.5 1.7A3 3 0 0 1 2 14v-2a4 4 0 0 1 4-4Z', 'M8 10v4', 'M6 12h4', 'M16 11h.01', 'M18 13h.01'] },
  // Weather & nature
  { name: 'sun', category: 'weather', paths: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'] },
  { name: 'moon', category: 'weather', paths: ['M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z'] },
  { name: 'cloud-rain', category: 'weather', paths: ['M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 16 15H7Z', 'M8 18v3', 'M12 18v3', 'M16 18v3'] },
  { name: 'wind', category: 'weather', paths: ['M3 8h10a3 3 0 1 0-3-3', 'M3 12h15a3 3 0 1 1-3 3', 'M3 16h7'] },
  { name: 'snowflake', category: 'weather', paths: ['M12 2v20', 'M4 6l16 12', 'M20 6 4 18', 'M12 6l-3-2', 'M12 6l3-2', 'M12 18l-3 2', 'M12 18l3 2'] },
  { name: 'leaf', category: 'weather', paths: ['M5 19C5 9 12 4 20 4c0 9-5 15-15 15Z', 'M5 19c4-6 8-9 12-11'] },
  { name: 'umbrella', category: 'weather', paths: ['M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z', 'M12 12v7a2 2 0 0 0 4 0'] },
  { name: 'thermometer', category: 'weather', paths: ['M10 4a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0V4Z', 'M12 9v6'] },
];

export const ICON_CATEGORIES: { value: IconDef['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All icons' },
  { value: 'ui', label: 'Interface' },
  { value: 'business', label: 'Business' },
  { value: 'media', label: 'Media' },
  { value: 'social', label: 'Social' },
  { value: 'tech', label: 'Technology' },
  { value: 'arrows', label: 'Arrows' },
  { value: 'education', label: 'Education' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'devices', label: 'Devices' },
  { value: 'weather', label: 'Weather' },
];

/** Build a self-contained SVG data URL for an icon at a given color/size. */
export function iconToDataUrl(icon: IconDef, color = '#4f46e5', size = 240): string {
  const stroke = icon.paths
    .map((d) => `<path d="${d}"/>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
    `fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
    `${stroke}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/** Categories that actually exist, derived from the data. */
export function iconCategoryList(): { value: IconDef['category'] | 'all'; label: string }[] {
  const seen = new Map<IconDef['category'], string>();
  for (const icon of ICONS) {
    if (!seen.has(icon.category)) {
      const found = ICON_CATEGORIES.find((c) => c.value === icon.category);
      seen.set(icon.category, found?.label ?? icon.category);
    }
  }
  return [
    { value: 'all', label: 'All icons' },
    ...[...seen.entries()].map(([value, label]) => ({ value, label })),
  ];
}
