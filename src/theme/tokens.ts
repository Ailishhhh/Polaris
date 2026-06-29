/**
 * Polaris design tokens.
 *
 * Voice: calm, typography-led, trustworthy. Deep ink + warm neutral paper +
 * ONE refined clay accent. Never neon. Both palettes are tuned so the accent
 * carries the brand while everything else stays quiet.
 */

export interface Palette {
  /** App background (the "paper"). */
  background: string;
  /** Slightly raised background, used behind grouped content. */
  backgroundAlt: string;
  /** Card / surface fill. */
  surface: string;
  /** Surface that sits on top of a surface (nested cards, inputs). */
  surfaceSunken: string;
  /** Hairline borders + dividers. */
  border: string;
  borderStrong: string;

  /** Primary reading text. */
  text: string;
  /** Secondary / supporting copy. */
  textSecondary: string;
  /** Muted captions, timestamps, placeholders. */
  textMuted: string;
  /** Text/icon color when placed on the accent fill. */
  onAccent: string;

  /** The single brand accent (warm clay). */
  accent: string;
  accentPressed: string;
  /** Soft tinted accent background (chips, highlights, user bubble). */
  accentSoft: string;
  accentSoftText: string;

  /** Assistant message surface. */
  bubbleAssistant: string;
  /** User message surface. */
  bubbleUser: string;
  bubbleUserText: string;

  success: string;
  successSoft: string;
  warning: string;
  danger: string;

  /** Skeleton / shimmer base. */
  skeleton: string;
  /** Scrim behind modals/sheets. */
  scrim: string;
}

const lightPalette: Palette = {
  background: '#FBF8F2',
  backgroundAlt: '#F4EEE4',
  surface: '#FFFFFF',
  surfaceSunken: '#F5F0E8',
  border: '#E9E1D4',
  borderStrong: '#DCD2C2',

  text: '#1C1813',
  textSecondary: '#5E554A',
  textMuted: '#9A8F80',
  onAccent: '#FFFFFF',

  accent: '#BB5A37',
  accentPressed: '#A24A2B',
  accentSoft: '#F4E2D7',
  accentSoftText: '#8A4226',

  bubbleAssistant: '#FFFFFF',
  bubbleUser: '#F2E1D5',
  bubbleUserText: '#3A2114',

  success: '#4E7A53',
  successSoft: '#E3EEE2',
  warning: '#B07D26',
  danger: '#B0463B',

  skeleton: '#ECE5D9',
  scrim: 'rgba(28, 24, 19, 0.42)',
};

const darkPalette: Palette = {
  background: '#13100C',
  backgroundAlt: '#1A1611',
  surface: '#1D1813',
  surfaceSunken: '#221C16',
  border: '#2E2720',
  borderStrong: '#3A322A',

  text: '#F3ECE0',
  textSecondary: '#B7AC9D',
  textMuted: '#7E7466',
  onAccent: '#1A0E08',

  accent: '#D27A4E',
  accentPressed: '#E08C61',
  accentSoft: '#2E2018',
  accentSoftText: '#E8A079',

  bubbleAssistant: '#1D1813',
  bubbleUser: '#2C2017',
  bubbleUserText: '#F2DECB',

  success: '#76A87B',
  successSoft: '#1E2A1F',
  warning: '#D2A24E',
  danger: '#D77468',

  skeleton: '#241E18',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const palettes = { light: lightPalette, dark: darkPalette } as const;
export type ColorSchemeName = keyof typeof palettes;

/**
 * Atmospheric gradients. Per Anthropic's design guidance we avoid flat fills —
 * surfaces sit on a warm, barely-there gradient with a soft accent "aura" that
 * gives the app depth and a hand-crafted feel.
 */
export interface Gradients {
  /** Full-screen backdrop (top -> bottom), three warm stops. */
  ambient: readonly [string, string, string];
  /** Soft accent glow placed behind hero content (already alpha-baked). */
  aura: string;
  /** The clay accent gradient (buttons, the momentum arc, the avatar). */
  accent: readonly [string, string];
  /** A faint sheen used on premium cards. */
  sheen: readonly [string, string];
}

const lightGradients: Gradients = {
  ambient: ['#FCFAF4', '#F7F0E4', '#F0E6D5'],
  aura: 'rgba(187, 90, 55, 0.10)',
  accent: ['#C2643B', '#A8492A'],
  sheen: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'],
};

const darkGradients: Gradients = {
  ambient: ['#0E0B07', '#15110B', '#1C140D'],
  aura: 'rgba(210, 122, 78, 0.18)',
  accent: ['#E08C61', '#C9683F'],
  sheen: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'],
};

export const gradients = { light: lightGradients, dark: darkGradients } as const;

/** 4pt spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/**
 * Type scale. Display uses Fraunces (warm editorial serif), the rest use Inter.
 * Mono for inline code is provided by the markdown renderer.
 */
export const typography = {
  display: { fontFamily: 'Fraunces_600SemiBold', fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 24 },
  callout: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 1.2 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Fonts loaded at startup (see useAppFonts). */
export const fontMap = {
  display: ['Fraunces_400Regular', 'Fraunces_600SemiBold', 'Fraunces_700Bold'],
  body: ['Inter_400Regular', 'Inter_500Medium', 'Inter_600SemiBold', 'Inter_700Bold'],
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 360,
  // A gentle, premium easing curve (approx. easeOutCubic) for Reanimated/timing.
  easing: [0.22, 1, 0.36, 1] as const,
} as const;

/** Soft, warm elevation. Kept subtle to preserve the calm aesthetic. */
export function elevation(scheme: ColorSchemeName, level: 1 | 2 | 3) {
  if (scheme === 'dark') {
    // Dark mode leans on borders rather than shadows.
    return {
      shadowColor: '#000',
      shadowOpacity: level === 1 ? 0.25 : level === 2 ? 0.35 : 0.45,
      shadowRadius: level * 6,
      shadowOffset: { width: 0, height: level * 2 },
      elevation: level * 2,
    };
  }
  return {
    shadowColor: '#3A2114',
    shadowOpacity: level === 1 ? 0.06 : level === 2 ? 0.1 : 0.14,
    shadowRadius: level * 7,
    shadowOffset: { width: 0, height: level * 3 },
    elevation: level * 2,
  };
}

export type Theme = {
  scheme: ColorSchemeName;
  colors: Palette;
  gradients: Gradients;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  elevation: (level: 1 | 2 | 3) => ReturnType<typeof elevation>;
};

export function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: palettes[scheme],
    gradients: gradients[scheme],
    spacing,
    radii,
    typography,
    motion,
    elevation: (level) => elevation(scheme, level),
  };
}
