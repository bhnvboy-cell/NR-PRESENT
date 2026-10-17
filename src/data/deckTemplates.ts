import type { Slide } from '../types/editor';
import { templateToSlide, tplBg, tplChart, tplShape, tplTable, tplText, type SlideTemplate } from './templates';

export type DeckCategory = 'pitch' | 'business' | 'education' | 'marketing' | 'portfolio';

export interface DeckTemplate {
  id: string;
  name: string;
  category: DeckCategory;
  description: string;
  slides: SlideTemplate[];
}

const DECK_CATS: { value: DeckCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All decks' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'portfolio', label: 'Portfolio' },
];

export const DECK_CATEGORIES = DECK_CATS;

export const DECK_TEMPLATES: DeckTemplate[] = [
  {
    id: 'deck-startup-pitch',
    name: 'Startup pitch',
    category: 'pitch',
    description: 'Problem → solution → market → traction → team.',
    slides: [
      {
        id: 'sp-title',
        name: 'Cover',
        category: 'title',
        background: { kind: 'linear', from: '#0f172a', to: '#1e1b4b', angle: 120 },
        build: () => [
          tplText({ x: 120, y: 250, width: 1040, text: 'Acme — pitch your idea', fontSize: 64, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 370, width: 800, text: 'Series A · 2026', fontSize: 26, align: 'center', fill: '#a5b4fc' }),
          tplShape({ x: 560, y: 440, width: 160, height: 8, cornerRadius: 4, fill: '#6366f1', stroke: 'transparent', strokeWidth: 0 }),
        ],
      },
      {
        id: 'sp-problem',
        name: 'Problem',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'The problem', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 90,
            y: 200,
            width: 1050,
            text: '• Teams drown in tools that do not talk to each other\n• Critical decisions wait on reports that arrive too late\n• Existing solutions cost more than the value they deliver',
            fontSize: 26,
            lineHeight: 2,
            fill: '#334155',
          }),
        ],
      },
      {
        id: 'sp-solution',
        name: 'Solution',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Our solution', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplShape({ x: 90, y: 170, width: 520, height: 400, cornerRadius: 20, fill: '#eef2ff', stroke: '#c7d2fe', strokeWidth: 1 }),
          tplShape({ x: 670, y: 170, width: 520, height: 400, cornerRadius: 20, fill: '#f0fdf4', stroke: '#bbf7d0', strokeWidth: 1 }),
          tplText({ x: 120, y: 210, width: 460, text: 'One workspace', fontSize: 30, fontWeight: 700, fill: '#4338ca' }),
          tplText({ x: 120, y: 270, width: 460, text: 'Every tool, one login, zero context switching.', fontSize: 22, lineHeight: 1.6, fill: '#334155' }),
          tplText({ x: 700, y: 210, width: 460, text: 'Live insight', fontSize: 30, fontWeight: 700, fill: '#15803d' }),
          tplText({ x: 700, y: 270, width: 460, text: 'Dashboards that update the moment data lands.', fontSize: 22, lineHeight: 1.6, fill: '#334155' }),
        ],
      },
      {
        id: 'sp-market',
        name: 'Market',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 60, y: 40, width: 700, text: 'Market size', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
          tplChart({
            x: 40,
            y: 110,
            width: 760,
            height: 540,
            background: 'transparent',
            chartType: 'bar',
            title: '',
            series: [
              { label: '2023', value: 12, color: '#6366f1' },
              { label: '2024', value: 18, color: '#818cf8' },
              { label: '2025', value: 26, color: '#a5b4fc' },
              { label: '2026', value: 38, color: '#c7d2fe' },
            ],
          }),
          tplText({ x: 840, y: 180, width: 380, text: '$38B by 2026', fontSize: 34, fontWeight: 800, fill: '#4f46e5' }),
          tplText({ x: 840, y: 250, width: 380, text: 'Growing 34% CAGR as teams replace legacy suites.', fontSize: 20, lineHeight: 1.6, fill: '#475569' }),
        ],
      },
      {
        id: 'sp-traction',
        name: 'Traction',
        category: 'data',
        background: tplBg.slate,
        build: () => [
          tplText({ x: 90, y: 90, width: 1000, text: 'Traction', fontSize: 40, fontWeight: 700, fill: '#ffffff' }),
          ...['12k', '4.8★', '210%'].flatMap((stat, i) => [
            tplText({ x: 90 + i * 380, y: 280, width: 340, text: stat, fontSize: 84, fontWeight: 800, align: 'center', fill: ['#818cf8', '#34d399', '#fbbf24'][i] }),
            tplText({
              x: 90 + i * 380,
              y: 400,
              width: 340,
              text: ['Active teams', 'Avg. rating', 'YoY growth'][i],
              fontSize: 22,
              align: 'center',
              fill: '#cbd5e1',
            }),
          ]),
        ],
      },
      {
        id: 'sp-team',
        name: 'Team',
        category: 'media',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Founding team', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          ...[0, 1, 2].flatMap((i) => [
            tplShape({ x: 170 + i * 360, y: 240, width: 140, height: 140, cornerRadius: 70, fill: ['#6366f1', '#10b981', '#f59e0b'][i], stroke: 'transparent', strokeWidth: 0 }),
            tplText({ x: 90 + i * 360, y: 410, width: 300, text: ['CEO', 'CTO', 'CPO'][i], fontSize: 24, fontWeight: 700, align: 'center', fill: '#0f172a' }),
          ]),
        ],
      },
    ],
  },
  {
    id: 'deck-business-review',
    name: 'Quarterly business review',
    category: 'business',
    description: 'Agenda, KPIs, performance, metrics table, actions.',
    slides: [
      {
        id: 'br-title',
        name: 'Cover',
        category: 'title',
        background: tplBg.slate,
        build: () => [
          tplText({ x: 120, y: 260, width: 1040, text: 'Q4 Business review', fontSize: 64, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 380, width: 800, text: 'Results · Risks · Next quarter plan', fontSize: 26, align: 'center', fill: '#94a3b8' }),
        ],
      },
      {
        id: 'br-agenda',
        name: 'Agenda',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 70, width: 1000, text: 'Agenda', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 140,
            y: 220,
            width: 900,
            text: '01  Highlights\n02  Financial performance\n03  Product updates\n04  Risks & mitigations\n05  Next quarter priorities',
            fontSize: 28,
            lineHeight: 2.1,
            fill: '#334155',
          }),
        ],
      },
      {
        id: 'br-kpis',
        name: 'KPI snapshot',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'KPI snapshot', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          ...[
            ['$4.2M', 'Revenue', '#6366f1'],
            ['118%', 'Net retention', '#10b981'],
            ['−12%', 'Churn', '#f59e0b'],
          ].flatMap(([value, label, color], i) => [
            tplShape({ x: 90 + i * 390, y: 220, width: 340, height: 260, cornerRadius: 20, fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 }),
            tplText({ x: 90 + i * 390, y: 280, width: 340, text: value, fontSize: 60, fontWeight: 800, align: 'center', fill: color }),
            tplText({ x: 90 + i * 390, y: 380, width: 340, text: label, fontSize: 22, align: 'center', fill: '#64748b' }),
          ]),
        ],
      },
      {
        id: 'br-performance',
        name: 'Performance',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 60, y: 40, width: 700, text: 'Revenue vs plan', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
          tplChart({
            x: 40,
            y: 110,
            width: 780,
            height: 540,
            background: 'transparent',
            chartType: 'line',
            title: '',
            series: [
              { label: 'Q1', value: 2.8, color: '#6366f1' },
              { label: 'Q2', value: 3.1, color: '#6366f1' },
              { label: 'Q3', value: 3.6, color: '#6366f1' },
              { label: 'Q4', value: 4.2, color: '#6366f1' },
            ],
            showValues: false,
          }),
          tplText({ x: 860, y: 200, width: 360, text: 'Ahead of plan', fontSize: 30, fontWeight: 700, fill: '#0f172a' }),
          tplText({ x: 860, y: 260, width: 360, text: 'Q4 finished 5% above plan on expansion revenue.', fontSize: 20, lineHeight: 1.6, fill: '#475569' }),
        ],
      },
      {
        id: 'br-table',
        name: 'Department metrics',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 60, y: 40, width: 700, text: 'By department', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
          tplTable({ x: 60, y: 130 }),
        ],
      },
      {
        id: 'br-priorities',
        name: 'Next quarter',
        category: 'content',
        background: tplBg.indigo,
        build: () => [
          tplText({ x: 90, y: 90, width: 1000, text: 'Next quarter priorities', fontSize: 44, fontWeight: 700, fill: '#ffffff' }),
          tplText({
            x: 90,
            y: 220,
            width: 1050,
            text: '1.  Ship self-serve onboarding\n2.  Expand enterprise tier\n3.  Cut infra cost 15%\n4.  Hire 3 GTM roles',
            fontSize: 28,
            lineHeight: 2,
            fill: '#e0e7ff',
          }),
        ],
      },
    ],
  },
  {
    id: 'deck-lesson',
    name: 'Lesson / workshop',
    category: 'education',
    description: 'Objectives, agenda, concept, practice, recap.',
    slides: [
      {
        id: 'ls-title',
        name: 'Cover',
        category: 'title',
        background: { kind: 'linear', from: '#0ea5e9', to: '#6366f1', angle: 90 },
        build: () => [
          tplText({ x: 120, y: 250, width: 1040, text: 'Workshop title', fontSize: 64, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 380, width: 800, text: 'Level · Duration · Presenter', fontSize: 26, align: 'center', fill: '#e0f2fe' }),
        ],
      },
      {
        id: 'ls-objectives',
        name: 'Objectives',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Learning objectives', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 90,
            y: 210,
            width: 1050,
            text: '• Understand the core concepts\n• Apply the method to a real scenario\n• Avoid the three most common mistakes',
            fontSize: 26,
            lineHeight: 2,
            fill: '#334155',
          }),
        ],
      },
      {
        id: 'ls-agenda',
        name: 'Run of show',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Run of show', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 140,
            y: 210,
            width: 900,
            text: '10:00  Intro & warm-up\n10:15  Concept walkthrough\n10:45  Hands-on exercise\n11:15  Review & questions',
            fontSize: 28,
            lineHeight: 2.1,
            fill: '#334155',
          }),
        ],
      },
      {
        id: 'ls-concept',
        name: 'Key concept',
        category: 'media',
        background: tplBg.light,
        build: () => [
          tplShape({ x: 80, y: 120, width: 560, height: 480, cornerRadius: 16, fill: '#e0f2fe', stroke: '#7dd3fc', strokeWidth: 1 }),
          tplText({ x: 140, y: 320, width: 440, text: 'Diagram / screenshot', fontSize: 22, align: 'center', fill: '#0369a1' }),
          tplText({ x: 700, y: 180, width: 500, text: 'The big idea', fontSize: 40, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 700,
            y: 270,
            width: 500,
            text: 'Explain the concept in one sentence, then support it with one concrete example.',
            fontSize: 22,
            lineHeight: 1.6,
            fill: '#475569',
          }),
        ],
      },
      {
        id: 'ls-practice',
        name: 'Practice',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Your turn', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplShape({ x: 90, y: 180, width: 1100, height: 380, cornerRadius: 20, fill: '#fefce8', stroke: '#fde047', strokeWidth: 2 }),
          tplText({
            x: 140,
            y: 240,
            width: 1000,
            text: 'Exercise: apply today\u2019s method to the sample scenario.\n\nTime: 15 minutes · Work in pairs · Share one insight afterwards.',
            fontSize: 26,
            lineHeight: 1.8,
            fill: '#713f12',
          }),
        ],
      },
      {
        id: 'ls-recap',
        name: 'Recap',
        category: 'content',
        background: tplBg.dark,
        build: () => [
          tplText({ x: 90, y: 90, width: 1000, text: 'Recap', fontSize: 44, fontWeight: 700, fill: '#ffffff' }),
          tplText({
            x: 90,
            y: 220,
            width: 1050,
            text: '✓  Core concept\n✓  Method step-by-step\n✓  One practice exercise\n\nQuestions?',
            fontSize: 28,
            lineHeight: 2,
            fill: '#e2e8f0',
          }),
        ],
      },
    ],
  },
  {
    id: 'deck-marketing',
    name: 'Marketing plan',
    category: 'marketing',
    description: 'Goals, audience, channels, budget, timeline.',
    slides: [
      {
        id: 'mk-title',
        name: 'Cover',
        category: 'title',
        background: tplBg.sunset,
        build: () => [
          tplText({ x: 120, y: 250, width: 1040, text: 'Marketing plan', fontSize: 64, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 380, width: 800, text: 'Campaign · Season · Owner', fontSize: 26, align: 'center', fill: '#fff1f2' }),
        ],
      },
      {
        id: 'mk-goals',
        name: 'Goals',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Campaign goals', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          ...[
            ['2.5M', 'Impressions', '#f43f5e'],
            ['18%', 'Conversion', '#fb923c'],
            ['4.1×', 'ROAS', '#8b5cf6'],
          ].flatMap(([value, label, color], i) => [
            tplText({ x: 90 + i * 390, y: 260, width: 340, text: value, fontSize: 76, fontWeight: 800, align: 'center', fill: color }),
            tplText({ x: 90 + i * 390, y: 390, width: 340, text: label, fontSize: 22, align: 'center', fill: '#64748b' }),
          ]),
        ],
      },
      {
        id: 'mk-audience',
        name: 'Audience',
        category: 'comparison',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 70, width: 1000, text: 'Who we are speaking to', fontSize: 40, fontWeight: 700, fill: '#0f172a' }),
          tplShape({ x: 90, y: 170, width: 520, height: 420, cornerRadius: 16, fill: '#fff1f2', stroke: '#fecdd3', strokeWidth: 1 }),
          tplShape({ x: 670, y: 170, width: 520, height: 420, cornerRadius: 16, fill: '#fff7ed', stroke: '#fed7aa', strokeWidth: 1 }),
          tplText({ x: 120, y: 200, width: 460, text: 'Primary', fontSize: 30, fontWeight: 700, fill: '#be123c' }),
          tplText({ x: 120, y: 270, width: 460, text: '• Ages 25–34\n• Mobile-first\n• Values convenience', fontSize: 22, lineHeight: 1.9, fill: '#334155' }),
          tplText({ x: 700, y: 200, width: 460, text: 'Secondary', fontSize: 30, fontWeight: 700, fill: '#c2410c' }),
          tplText({ x: 700, y: 270, width: 460, text: '• Ages 35–44\n• Desktop research\n• Values proof', fontSize: 22, lineHeight: 1.9, fill: '#334155' }),
        ],
      },
      {
        id: 'mk-channels',
        name: 'Channels',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Channel mix', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 90,
            y: 210,
            width: 1050,
            text: '• Paid social — 40% of budget\n• Search — 25%\n• Partnerships — 20%\n• Lifecycle email — 15%',
            fontSize: 26,
            lineHeight: 2,
            fill: '#334155',
          }),
        ],
      },
      {
        id: 'mk-budget',
        name: 'Budget',
        category: 'data',
        background: tplBg.light,
        build: () => [
          tplText({ x: 60, y: 40, width: 700, text: 'Budget allocation', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
          tplChart({
            x: 140,
            y: 100,
            width: 640,
            height: 560,
            background: 'transparent',
            chartType: 'donut',
            title: '',
            series: [
              { label: 'Social', value: 40, color: '#f43f5e' },
              { label: 'Search', value: 25, color: '#fb923c' },
              { label: 'Partners', value: 20, color: '#fbbf24' },
              { label: 'Email', value: 15, color: '#8b5cf6' },
            ],
          }),
          tplText({ x: 840, y: 220, width: 380, text: '$120k total', fontSize: 34, fontWeight: 800, fill: '#f43f5e' }),
          tplText({ x: 840, y: 290, width: 380, text: 'Six-week burst with a two-week always-on layer.', fontSize: 20, lineHeight: 1.6, fill: '#475569' }),
        ],
      },
      {
        id: 'mk-timeline',
        name: 'Timeline',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 70, width: 1000, text: 'Six-week rollout', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplShape({ x: 120, y: 360, width: 1040, height: 4, cornerRadius: 2, fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 0 }),
          ...['Tease', 'Launch', 'Amplify', 'Sustain'].flatMap((step, i) => [
            tplShape({ x: 140 + i * 300, y: 330, width: 64, height: 64, cornerRadius: 32, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 4 }),
            tplText({ x: 80 + i * 300, y: 250, width: 184, text: `Week ${i * 2 + 1}`, fontSize: 22, fontWeight: 700, align: 'center', fill: '#be123c' }),
            tplText({ x: 80 + i * 300, y: 420, width: 184, text: step, fontSize: 20, align: 'center', fill: '#475569' }),
          ]),
        ],
      },
    ],
  },
  {
    id: 'deck-portfolio',
    name: 'Portfolio showcase',
    category: 'portfolio',
    description: 'About, featured work, skills, quote, contact.',
    slides: [
      {
        id: 'pf-title',
        name: 'Cover',
        category: 'title',
        background: tplBg.dark,
        build: () => [
          tplText({ x: 120, y: 260, width: 1040, text: 'Your name', fontSize: 72, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 390, width: 800, text: 'Designer · Maker · Storyteller', fontSize: 26, align: 'center', fill: '#94a3b8' }),
        ],
      },
      {
        id: 'pf-about',
        name: 'About',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplShape({ x: 90, y: 140, width: 320, height: 320, cornerRadius: 160, fill: '#e2e8f0', stroke: '#cbd5e1', strokeWidth: 1 }),
          tplText({ x: 160, y: 280, width: 180, text: 'Photo', fontSize: 22, align: 'center', fill: '#64748b' }),
          tplText({ x: 480, y: 180, width: 700, text: 'About me', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          tplText({
            x: 480,
            y: 280,
            width: 700,
            text: 'Two sentences on your craft, your focus, and the kind of problems you like to solve.',
            fontSize: 24,
            lineHeight: 1.7,
            fill: '#475569',
          }),
        ],
      },
      {
        id: 'pf-project',
        name: 'Featured project',
        category: 'media',
        background: tplBg.light,
        build: () => [
          tplShape({ x: 80, y: 100, width: 640, height: 520, cornerRadius: 20, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1 }),
          tplText({ x: 200, y: 330, width: 400, text: 'Project image', fontSize: 24, align: 'center', fill: '#94a3b8' }),
          tplText({ x: 780, y: 160, width: 420, text: 'Project name', fontSize: 38, fontWeight: 700, fill: '#0f172a' }),
          tplText({ x: 780, y: 240, width: 420, text: 'Role · Year · Scope', fontSize: 20, fill: '#64748b' }),
          tplText({
            x: 780,
            y: 300,
            width: 420,
            text: 'What the project was, who it served, and the outcome you are proudest of.',
            fontSize: 22,
            lineHeight: 1.6,
            fill: '#475569',
          }),
        ],
      },
      {
        id: 'pf-skills',
        name: 'Skills',
        category: 'content',
        background: tplBg.light,
        build: () => [
          tplText({ x: 90, y: 80, width: 1000, text: 'Tools & skills', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
          ...['Visual design', 'Prototyping', 'Design systems', 'Motion'].flatMap((skill, i) => [
            tplShape({ x: 90, y: 210 + i * 90, width: 1000, height: 14, cornerRadius: 7, fill: '#f1f5f9', stroke: 'transparent', strokeWidth: 0 }),
            tplShape({ x: 90, y: 210 + i * 90, width: [920, 820, 880, 700][i], height: 14, cornerRadius: 7, fill: '#8b5cf6', stroke: 'transparent', strokeWidth: 0 }),
            tplText({ x: 90, y: 232 + i * 90, width: 500, text: skill, fontSize: 20, fill: '#334155' }),
          ]),
        ],
      },
      {
        id: 'pf-quote',
        name: 'Quote',
        category: 'quote',
        background: tplBg.dark,
        build: () => [
          tplText({
            x: 140,
            y: 240,
            width: 1000,
            text: '\u201CMake it simple, but significant.\u201D',
            fontSize: 48,
            fontWeight: 600,
            italic: true,
            align: 'center',
            fill: '#ffffff',
          }),
          tplText({ x: 340, y: 440, width: 600, text: '— Don Draper', fontSize: 24, align: 'center', fill: '#94a3b8' }),
        ],
      },
      {
        id: 'pf-contact',
        name: 'Contact',
        category: 'title',
        background: tplBg.indigo,
        build: () => [
          tplText({ x: 240, y: 260, width: 800, text: "Let's work together", fontSize: 56, fontWeight: 800, align: 'center', fill: '#ffffff' }),
          tplText({ x: 240, y: 380, width: 800, text: 'you@studio.com   ·   portfolio.example', fontSize: 24, align: 'center', fill: '#e0e7ff' }),
        ],
      },
    ],
  },
];

/** Turn a deck template into ready-to-insert slides (fresh ids per slide/element). */
export function deckToSlides(deck: DeckTemplate): Slide[] {
  return deck.slides.map(templateToSlide);
}
