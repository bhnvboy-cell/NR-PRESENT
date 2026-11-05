import { useState } from 'react';
import { useCanvasUi } from '../../store/canvasUi';
import { useEditorStore } from '../../store/editorStore';
import {
  DEFAULT_CHART,
  DEFAULT_SHAPE,
  DEFAULT_SLIDE_SIZE,
  DEFAULT_TABLE,
  DEFAULT_TEXT,
  type ChartElement,
  type ShapeElement,
  type Slide,
  type TableElement,
  type TextElement,
} from '../../types/editor';
import { deepClone } from '../../utils/clone';
import { createId } from '../../utils/id';

interface MagicTheme {
  id: string;
  label: string;
  bg: string;
  bgTo: string;
  primary: string;
  secondary: string;
  text: string;
  muted: string;
  card: string;
}

const MAGIC_THEMES: MagicTheme[] = [
  {
    id: 'indigo',
    label: 'Indigo Studio',
    bg: '#0f172a',
    bgTo: '#1e1b4b',
    primary: '#6366f1',
    secondary: '#22d3ee',
    text: '#f8fafc',
    muted: '#94a3b8',
    card: '#1e293b',
  },
  {
    id: 'light',
    label: 'Minimal Light',
    bg: '#f8fafc',
    bgTo: '#e0e7ff',
    primary: '#4f46e5',
    secondary: '#0ea5e9',
    text: '#0f172a',
    muted: '#475569',
    card: '#ffffff',
  },
  {
    id: 'sunset',
    label: 'Sunset Coral',
    bg: '#18181b',
    bgTo: '#3f1d2e',
    primary: '#f43f5e',
    secondary: '#fb923c',
    text: '#fafafa',
    muted: '#cbd5e1',
    card: '#27272a',
  },
  {
    id: 'emerald',
    label: 'Emerald Tech',
    bg: '#06281e',
    bgTo: '#0f172a',
    primary: '#10b981',
    secondary: '#38bdf8',
    text: '#ecfdf5',
    muted: '#94a3b8',
    card: '#0f2922',
  },
];

const QUICK_PROMPTS = [
  'AI Copilot Product Launch & Growth Strategy',
  'Series A Startup Investor Pitch Deck',
  'Q4 Enterprise Revenue & Customer Retention',
  'Clean Energy Transition & Net-Zero Roadmap',
  'Modern Design System & UX Architecture',
];

type TranslateLang = 'es' | 'fr' | 'de' | 'ar' | 'ja';

export function MagicPanel() {
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);
  const slideElements = useEditorStore((s) => s.project.slides[s.currentSlideIndex]?.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedElements = (slideElements ?? []).filter((el) => selectedIds.includes(el.id));
  const updateElement = useEditorStore((s) => s.updateElement);
  const addElement = useEditorStore((s) => s.addElement);

  const [prompt, setPrompt] = useState('AI Copilot Product Launch & Growth Strategy');
  const [themeId, setThemeId] = useState<string>('indigo');
  const [mode, setMode] = useState<'deck' | 'slide'>('deck');
  const [lang, setLang] = useState<TranslateLang>('es');
  const [status, setStatus] = useState<string | null>(null);

  const selectedText = selectedElements.find((el): el is TextElement => el.type === 'text') ?? null;
  const theme = MAGIC_THEMES.find((t) => t.id === themeId) ?? MAGIC_THEMES[0];

  const notify = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2200);
  };

  const handleGenerate = () => {
    const cleanPrompt = prompt.trim() || 'Strategic Vision & Roadmap';
    const generated = buildMagicSlides(cleanPrompt, theme);
    const store = useEditorStore.getState();
    store.ensureHistory();

    if (mode === 'slide') {
      const slide = generated[0];
      useEditorStore.setState((state) => {
        const slides = [...state.project.slides];
        slides.splice(state.currentSlideIndex + 1, 0, slide);
        return {
          project: { ...state.project, slides },
          currentSlideIndex: state.currentSlideIndex + 1,
          selectedIds: [],
        };
      });
      store.endHistory();
      notify('✨ Generated new slide from prompt');
    } else {
      useEditorStore.setState((state) => ({
        project: {
          ...state.project,
          name: extractTopicTitle(cleanPrompt),
          slides: generated,
        },
        currentSlideIndex: 0,
        selectedIds: [],
      }));
      store.endHistory();
      notify('✨ Generated 5-slide presentation deck');
    }
  };

  const applyMagicWrite = (action: 'punchy' | 'expand' | 'shorten' | 'executive' | 'bullets' | 'translate') => {
    const source = selectedText?.text || prompt.trim() || 'Transform how teams design and present ideas';
    const transformed = transformText(source, action, lang);

    if (selectedText) {
      updateElement(selectedText.id, { text: transformed });
      notify('✨ Updated selected text');
    } else {
      const size = useEditorStore.getState().project.slideSize ?? DEFAULT_SLIDE_SIZE;
      const el: TextElement = {
        ...deepClone(DEFAULT_TEXT),
        id: createId('el'),
        text: transformed,
        width: 720,
        height: 120,
        x: Math.round(size.width / 2 - 360),
        y: Math.round(size.height / 2 - 60),
        fontSize: 28,
        fontWeight: 600,
        fill: '#0f172a',
      };
      addElement(el);
      notify('✨ Inserted Magic Write text box');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span>✨ Magic Studio (AI)</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <p className="panel-hint">
          <strong>Magic Design</strong> — Describe your topic to generate tailored slides with layouts, charts &amp; tables.
        </p>

        <textarea
          className="notes-input"
          rows={3}
          placeholder="Describe your presentation topic…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="chip-row">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              className="chip"
              onClick={() => setPrompt(q)}
              title="Use sample prompt"
            >
              {q.split(' ').slice(0, 3).join(' ')}…
            </button>
          ))}
        </div>

        <p className="panel-hint">Visual Theme</p>
        <div className="chip-row">
          {MAGIC_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${themeId === t.id ? 'is-active' : ''}`}
              onClick={() => setThemeId(t.id)}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: t.primary,
                  marginRight: 5,
                }}
              />
              {t.label}
            </button>
          ))}
        </div>

        <div className="segmented" style={{ marginTop: 6 }}>
          <button
            type="button"
            className={mode === 'deck' ? 'is-active' : ''}
            onClick={() => setMode('deck')}
          >
            Full 5-Slide Deck
          </button>
          <button
            type="button"
            className={mode === 'slide' ? 'is-active' : ''}
            onClick={() => setMode('slide')}
          >
            Single Slide
          </button>
        </div>

        <button
          type="button"
          className="sidebar-action magic-cta"
          onClick={handleGenerate}
        >
          ✨ Generate {mode === 'deck' ? 'Presentation Deck' : 'Slide'}
        </button>

        <hr className="panel-divider" />

        <p className="panel-hint">
          <strong>Magic Write</strong> — {selectedText ? 'Rewrite selected text element:' : 'Transform prompt & insert text:'}
        </p>

        <div className="magic-actions-grid">
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('punchy')}>
            ⚡ Make Punchy Headline
          </button>
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('executive')}>
            💼 Executive Polish
          </button>
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('expand')}>
            📝 Expand &amp; Detail
          </button>
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('shorten')}>
            ✂️ Shorten / Summarize
          </button>
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('bullets')}>
            • Actionable Bullets
          </button>
        </div>

        <div className="field-row" style={{ marginTop: 8 }}>
          <select
            className="select-input"
            value={lang}
            onChange={(e) => setLang(e.target.value as TranslateLang)}
          >
            <option value="es">Spanish (Español)</option>
            <option value="fr">French (Français)</option>
            <option value="de">German (Deutsch)</option>
            <option value="ar">Arabic (العربية)</option>
            <option value="ja">Japanese (日本語)</option>
          </select>
          <button type="button" className="sidebar-action" onClick={() => applyMagicWrite('translate')}>
            🌐 Translate
          </button>
        </div>

        {status ? <div className="magic-status">{status}</div> : null}
      </div>
    </div>
  );
}

function extractTopicTitle(prompt: string): string {
  const cleaned = prompt.replace(/[.?!]+$/, '').trim();
  if (cleaned.length <= 52) return cleaned;
  return `${cleaned.slice(0, 50).trim()}…`;
}

function extractKeywords(prompt: string): string[] {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'your', 'our', 'how', 'that', 'this']);
  const words = prompt
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()));
  if (words.length < 3) return ['Strategy', 'Execution', 'Impact', 'Scale'];
  return words.slice(0, 6).map((w) => w[0].toUpperCase() + w.slice(1));
}

function buildMagicSlides(prompt: string, theme: MagicTheme): Slide[] {
  const titleText = extractTopicTitle(prompt);
  const kws = extractKeywords(prompt);
  const p1 = kws[0] || 'Innovation';
  const p2 = kws[1] || 'Velocity';
  const p3 = kws[2] || 'Scale';

  const makeText = (patch: Partial<TextElement> & { text: string; x: number; y: number; width: number }): TextElement => ({
    ...deepClone(DEFAULT_TEXT),
    id: createId('el'),
    height: 60,
    fill: theme.text,
    ...patch,
  });

  const makeShape = (patch: Partial<ShapeElement> & { x: number; y: number; width: number; height: number }): ShapeElement => ({
    ...deepClone(DEFAULT_SHAPE),
    id: createId('el'),
    shape: 'rect',
    fill: theme.card,
    stroke: theme.primary,
    strokeWidth: 1,
    cornerRadius: 18,
    ...patch,
  });

  // Slide 1: Cover
  const slide1: Slide = {
    id: createId('slide'),
    name: 'Cover',
    background: theme.bg,
    backgroundFill: { kind: 'linear', from: theme.bg, to: theme.bgTo, angle: 135 },
    transition: 'fade',
    notes: `Opening cover slide for ${titleText}. Introduce the core thesis and goals.`,
    elements: [
      makeShape({
        shape: 'ellipse',
        x: 920,
        y: -80,
        width: 440,
        height: 440,
        fill: theme.primary,
        strokeWidth: 0,
        opacity: 0.22,
      }),
      makeShape({
        x: 96,
        y: 150,
        width: 220,
        height: 38,
        fill: theme.primary,
        strokeWidth: 0,
        cornerRadius: 999,
      }),
      makeText({
        text: '✨ AI MAGIC DECK',
        x: 112,
        y: 160,
        width: 190,
        fontSize: 14,
        fontWeight: 700,
        align: 'center',
        fill: '#ffffff',
        letterSpacing: 1.5,
      }),
      makeText({
        text: titleText,
        x: 96,
        y: 220,
        width: 1020,
        height: 160,
        fontSize: 60,
        fontWeight: 800,
        lineHeight: 1.15,
        effect: 'lift',
      }),
      makeText({
        text: `Strategic blueprint covering ${p1}, ${p2}, and measurable ${p3} outcomes.`,
        x: 96,
        y: 410,
        width: 820,
        fontSize: 24,
        fontWeight: 400,
        fill: theme.muted,
      }),
    ],
  };

  // Slide 2: 3 Key Pillars
  const pillars = [
    { title: `01 · ${p1}`, body: `Accelerate ${p1.toLowerCase()} workflows with automated intelligence and clear benchmarks.` },
    { title: `02 · ${p2}`, body: `Streamline cross-functional execution to double delivery velocity every quarter.` },
    { title: `03 · ${p3}`, body: `Unlock compounding adoption and high-retention enterprise value at scale.` },
  ];

  const slide2: Slide = {
    id: createId('slide'),
    name: 'Core Pillars',
    background: theme.bg,
    backgroundFill: { kind: 'solid', color: theme.bg },
    transition: 'slideLeft',
    notes: `Walk through the three foundational pillars: ${p1}, ${p2}, and ${p3}.`,
    elements: [
      makeText({
        text: `Three Strategic Pillars for ${p1}`,
        x: 80,
        y: 68,
        width: 1120,
        fontSize: 42,
        fontWeight: 800,
      }),
      makeText({
        text: 'Focused initiatives designed for immediate impact and long-term defensibility',
        x: 80,
        y: 128,
        width: 900,
        fontSize: 20,
        fill: theme.muted,
      }),
      ...pillars.flatMap((p, idx) => {
        const x = 80 + idx * 380;
        return [
          makeShape({
            x,
            y: 210,
            width: 350,
            height: 410,
            fill: theme.card,
            stroke: theme.primary,
            strokeWidth: 1.5,
            cornerRadius: 20,
          }),
          makeShape({
            x: x + 28,
            y: 244,
            width: 56,
            height: 8,
            fill: idx === 1 ? theme.secondary : theme.primary,
            strokeWidth: 0,
            cornerRadius: 4,
          }),
          makeText({
            text: p.title,
            x: x + 28,
            y: 276,
            width: 294,
            fontSize: 28,
            fontWeight: 700,
          }),
          makeText({
            text: p.body,
            x: x + 28,
            y: 340,
            width: 294,
            height: 200,
            fontSize: 19,
            lineHeight: 1.45,
            fill: theme.muted,
          }),
        ];
      }),
    ],
  };

  // Slide 3: Growth & Metrics Chart
  const chartEl: ChartElement = {
    ...deepClone(DEFAULT_CHART),
    id: createId('el'),
    chartType: 'bar',
    x: 560,
    y: 190,
    width: 640,
    height: 440,
    title: `${p1} Trajectory (Quarterly Index)`,
    background: theme.card,
    textColor: theme.text,
    accent: theme.primary,
    series: [
      { label: 'Q1 Baseline', value: 44, color: theme.primary },
      { label: 'Q2 Rollout', value: 68, color: theme.secondary },
      { label: 'Q3 Expansion', value: 94, color: theme.primary },
      { label: 'Q4 Target', value: 132, color: theme.secondary },
    ],
  };

  const slide3: Slide = {
    id: createId('slide'),
    name: 'Impact & Metrics',
    background: theme.bg,
    backgroundFill: { kind: 'solid', color: theme.bg },
    transition: 'slideLeft',
    notes: 'Highlight the projected 3x momentum across four quarters.',
    elements: [
      makeText({
        text: 'Projected Performance & ROI',
        x: 80,
        y: 68,
        width: 1120,
        fontSize: 42,
        fontWeight: 800,
      }),
      makeShape({
        x: 80,
        y: 190,
        width: 440,
        height: 205,
        fill: theme.card,
        stroke: theme.primary,
      }),
      makeText({
        text: '+200%',
        x: 112,
        y: 220,
        width: 380,
        fontSize: 64,
        fontWeight: 800,
        fill: theme.secondary,
      }),
      makeText({
        text: `Net acceleration in ${p1.toLowerCase()} throughput within 12 months.`,
        x: 112,
        y: 305,
        width: 380,
        fontSize: 18,
        fill: theme.muted,
      }),
      makeShape({
        x: 80,
        y: 425,
        width: 440,
        height: 205,
        fill: theme.card,
        stroke: theme.secondary,
      }),
      makeText({
        text: '99.4%',
        x: 112,
        y: 455,
        width: 380,
        fontSize: 60,
        fontWeight: 800,
        fill: theme.primary,
      }),
      makeText({
        text: 'Reliability & team satisfaction score across pilot cohorts.',
        x: 112,
        y: 538,
        width: 380,
        fontSize: 18,
        fill: theme.muted,
      }),
      chartEl,
    ],
  };

  // Slide 4: Execution Roadmap Table
  const tableEl: TableElement = {
    ...deepClone(DEFAULT_TABLE),
    id: createId('el'),
    x: 80,
    y: 200,
    width: 1120,
    height: 360,
    rows: 4,
    cols: 4,
    colWidths: [240, 380, 260, 240],
    rowHeights: [64, 76, 76, 76],
    headerFill: theme.primary,
    headerText: '#ffffff',
    bodyFill: theme.card,
    bodyText: theme.text,
    altFill: theme.bg,
    borderColor: theme.muted,
    fontSize: 17,
    headerFontSize: 18,
    cells: [
      ['Phase', 'Key Deliverable', 'Owner', 'Target'],
      [`Phase 1 · ${p1}`, 'Architecture & Core Foundation', 'Product & Eng', 'Month 1–2'],
      [`Phase 2 · ${p2}`, 'Beta Launch & Customer Feedback Loop', 'Growth Team', 'Month 3–4'],
      [`Phase 3 · ${p3}`, 'Global Rollout & Ecosystem Scale', 'All Org', 'Month 5–6'],
    ],
  };

  const slide4: Slide = {
    id: createId('slide'),
    name: 'Execution Roadmap',
    background: theme.bg,
    backgroundFill: { kind: 'solid', color: theme.bg },
    transition: 'fade',
    notes: 'Review phased rollout milestones and ownership.',
    elements: [
      makeText({
        text: 'Execution Roadmap & Ownership',
        x: 80,
        y: 68,
        width: 1120,
        fontSize: 42,
        fontWeight: 800,
      }),
      makeText({
        text: 'Clear accountability from initial discovery to full-scale deployment',
        x: 80,
        y: 128,
        width: 960,
        fontSize: 20,
        fill: theme.muted,
      }),
      tableEl,
    ],
  };

  // Slide 5: Call to Action
  const slide5: Slide = {
    id: createId('slide'),
    name: 'Next Steps',
    background: theme.bg,
    backgroundFill: { kind: 'linear', from: theme.bgTo, to: theme.bg, angle: 45 },
    transition: 'zoom',
    notes: 'Close with clear decision points and Q&A.',
    elements: [
      makeText({
        text: 'Ready to Lead the Next Wave?',
        x: 120,
        y: 210,
        width: 1040,
        fontSize: 56,
        fontWeight: 800,
        align: 'center',
        effect: 'lift',
      }),
      makeText({
        text: `Let’s align on Phase 1 resourcing and kick off ${titleText} this week.`,
        x: 200,
        y: 310,
        width: 880,
        fontSize: 24,
        align: 'center',
        fill: theme.muted,
      }),
      makeShape({
        x: 450,
        y: 410,
        width: 380,
        height: 68,
        fill: theme.primary,
        strokeWidth: 0,
        cornerRadius: 999,
      }),
      makeText({
        text: 'Approve Roadmap & Launch →',
        x: 460,
        y: 430,
        width: 360,
        fontSize: 22,
        fontWeight: 700,
        align: 'center',
        fill: '#ffffff',
      }),
    ],
  };

  return [slide1, slide2, slide3, slide4, slide5];
}

function transformText(
  input: string,
  action: 'punchy' | 'expand' | 'shorten' | 'executive' | 'bullets' | 'translate',
  lang: TranslateLang,
): string {
  const clean = input.trim();
  switch (action) {
    case 'punchy': {
      const core = clean.split(/[.?!\n]/)[0]?.trim() || clean;
      return `🚀 ${core.replace(/^(we|our|the)\s+/i, '')} — Built for 10× Impact`;
    }
    case 'executive':
      return `Strategic Priority: ${clean.replace(/\.$/, '')}. Driving measurable operational excellence, sustainable growth, and stakeholder value.`;
    case 'expand':
      return `${clean}\n\n• Strategic Context: Aligns cross-functional teams around high-leverage priorities.\n• Expected Outcome: Accelerates delivery velocity while maintaining enterprise-grade quality.`;
    case 'shorten': {
      const words = clean.split(/\s+/);
      if (words.length <= 7) return clean;
      return `${words.slice(0, 7).join(' ')}…`;
    }
    case 'bullets': {
      const parts = clean
        .split(/[.;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length <= 1) {
        return `• Focus on core user value\n• Execute with speed & precision\n• Measure compounding results`;
      }
      return parts.map((p) => `• ${p}`).join('\n');
    }
    case 'translate': {
      const prefix: Record<TranslateLang, string> = {
        es: '🇪🇸 [ES] Presentación Estratégica: ',
        fr: '🇫🇷 [FR] Présentation Stratégique : ',
        de: '🇩🇪 [DE] Strategische Präsentation: ',
        ar: '🇸🇦 [AR] عرض استراتيجي: ',
        ja: '🇯🇵 [JA] 戦略プレゼンテーション: ',
      };
      return `${prefix[lang]}${clean}`;
    }
  }
}
