export interface FontOption {
  family: string;
  weights: number[];
  italic: boolean;
  category: 'sans' | 'serif' | 'display' | 'mono' | 'hand';
}

export const FONT_OPTIONS: FontOption[] = [
  // Sans
  { family: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Roboto', weights: [300, 400, 500, 700, 900], italic: true, category: 'sans' },
  { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800], italic: false, category: 'sans' },
  { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Open Sans', weights: [300, 400, 500, 600, 700, 800], italic: true, category: 'sans' },
  { family: 'Lato', weights: [300, 400, 700, 900], italic: true, category: 'sans' },
  { family: 'Source Sans 3', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Fira Sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Nunito', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Nunito Sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Rubik', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Work Sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'sans' },
  { family: 'Manrope', weights: [300, 400, 500, 600, 700, 800], italic: false, category: 'sans' },
  { family: 'DM Sans', weights: [400, 500, 700], italic: true, category: 'sans' },
  { family: 'Outfit', weights: [300, 400, 500, 600, 700, 800], italic: false, category: 'sans' },
  { family: 'Sora', weights: [300, 400, 500, 600, 700, 800], italic: false, category: 'sans' },
  { family: 'Space Grotesk', weights: [300, 400, 500, 600, 700], italic: false, category: 'sans' },
  // Serif
  { family: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900], italic: true, category: 'serif' },
  { family: 'Merriweather', weights: [300, 400, 700, 900], italic: true, category: 'serif' },
  { family: 'Lora', weights: [400, 500, 600, 700], italic: true, category: 'serif' },
  { family: 'Libre Baskerville', weights: [400, 700], italic: true, category: 'serif' },
  { family: 'Crimson Text', weights: [400, 600, 700], italic: true, category: 'serif' },
  { family: 'Cormorant Garamond', weights: [300, 400, 500, 600, 700], italic: true, category: 'serif' },
  { family: 'EB Garamond', weights: [400, 500, 600, 700, 800], italic: true, category: 'serif' },
  { family: 'Fraunces', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'serif' },
  // Display
  { family: 'Oswald', weights: [300, 400, 500, 600, 700], italic: false, category: 'display' },
  { family: 'Bebas Neue', weights: [400], italic: false, category: 'display' },
  { family: 'Anton', weights: [400], italic: false, category: 'display' },
  { family: 'Archivo Black', weights: [400], italic: false, category: 'display' },
  { family: 'Raleway', weights: [300, 400, 500, 600, 700, 800, 900], italic: true, category: 'display' },
  { family: 'Righteous', weights: [400], italic: false, category: 'display' },
  // Mono
  { family: 'JetBrains Mono', weights: [300, 400, 500, 600, 700, 800], italic: true, category: 'mono' },
  { family: 'Fira Code', weights: [300, 400, 500, 600, 700], italic: false, category: 'mono' },
  { family: 'IBM Plex Mono', weights: [300, 400, 500, 600, 700], italic: true, category: 'mono' },
  // Handwriting
  { family: 'Dancing Script', weights: [400, 500, 600, 700], italic: false, category: 'hand' },
  { family: 'Pacifico', weights: [400], italic: false, category: 'hand' },
  { family: 'Caveat', weights: [400, 500, 600, 700], italic: false, category: 'hand' },
];

export const FONT_CATEGORIES: { value: FontOption['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All fonts' },
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'mono', label: 'Monospace' },
  { value: 'hand', label: 'Handwriting' },
];

const FONT_LINK_ID = 'nr-google-fonts';

export function ensureFontsLoaded(families: string[] = FONT_OPTIONS.map((f) => f.family)): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;

  const parts: string[] = [];
  for (const family of families) {
    const def = FONT_OPTIONS.find((f) => f.family === family);
    const weights = def?.weights ?? [400, 700];
    const italics = def?.italic ? [0, 1] : [0];
    const tuples: string[] = [];
    for (const ital of italics) {
      const weightList = ital === 1 ? weights.filter((w) => w === 400 || w === 700) : weights;
      for (const weight of weightList) {
        tuples.push(`${ital},${weight}`);
      }
    }
    if (tuples.length === 0) continue;
    parts.push(`family=${family.replace(/ /g, '+')}:ital,wght@${tuples.join(';')}`);
  }

  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
  document.head.appendChild(link);
}
