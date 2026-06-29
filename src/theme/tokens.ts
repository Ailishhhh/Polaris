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
  background: '#F7F5F0',
  backgroundAlt: '#EFEDE6',
  surface: '#FFFFFF',
  surfaceSunken: '#F0EEE8',
  border: '#E5E2D9',
  borderStrong: '#D6D2C7',

  text: '#15140F',
  textSecondary: '#54514A',
  textMuted: '#918C81',
  onAccent: '#FFFFFF',

  accent: '#B0542E',
  accentPressed: '#974624',
  accentSoft: '#EBE5DD',
  accentSoftText: '#8A4226',

  bubbleAssistant: '#FFFFFF',
  bubbleUser: '#EAE6DC',
  bubbleUserText: '#272219',

  success: '#4E7A53',
  successSoft: '#E6ECE2',
  warning: '#A87C2C',
  danger: '#A8463B',

  skeleton: '#ECE9E1',
  scrim: 'rgba(20, 18, 14, 0.45)',
};

const darkPalette: Palette = {
  background: '#100F0D',
  backgroundAlt: '#161412',
  surface: '#191715',
  surfaceSunken: '#201D1A',
  border: '#2A2724',
  borderStrong: '#37332E',

  text: '#F3F0E9',
  textSecondary: '#ACA69B',
  textMuted: '#7A746A',
  onAccent: '#15110D',

  accent: '#C97A50',
  accentPressed: '#DA8C61',
  accentSoft: '#241C16',
  accentSoftText: '#E2A37C',

  bubbleAssistant: '#191715',
  bubbleUser: '#221F1B',
  bubbleUserText: '#EFE9DF',

  success: '#76A87B',
  successSoft: '#1C271D',
  warning: '#CFA052',
  danger: '#D2685C',

  skeleton: '#221E1A',
  scrim: 'rgba(0, 0, 0, 0.62)',
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
  ambient: ['#F8F6F1', '#F5F3EC', '#F1EFE8'],
  aura: 'transparent',
  accent: ['#B0542E', '#974624'],
  sheen: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'],
};

const darkGradients: Gradients = {
  ambient: ['#100F0D', '#131110', '#151312'],
  aura: 'transparent',
  accent: ['#DA8C61', '#C97A50'],
  sheen: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'],
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
