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
  background: '#F6F4FF',
  backgroundAlt: '#EEE9FF',
  surface: '#FFFFFF',
  surfaceSunken: '#F1EDFC',
  border: '#E6E1F6',
  borderStrong: '#D6CFEE',

  text: '#191334',
  textSecondary: '#574F76',
  textMuted: '#928BB2',
  onAccent: '#FFFFFF',

  accent: '#6D4DF2',
  accentPressed: '#5A3CE0',
  accentSoft: '#EAE3FF',
  accentSoftText: '#5A3CE0',

  bubbleAssistant: '#FFFFFF',
  bubbleUser: '#E9E2FF',
  bubbleUserText: '#2A2150',

  success: '#1F9D74',
  successSoft: '#E1F4EC',
  warning: '#C98A2E',
  danger: '#E0556B',

  skeleton: '#ECE8FB',
  scrim: 'rgba(18, 12, 40, 0.5)',
};

const darkPalette: Palette = {
  background: '#080612',
  backgroundAlt: '#0E0B1E',
  surface: '#151127',
  surfaceSunken: '#1C1733',
  border: '#2A2442',
  borderStrong: '#3B3458',

  text: '#F1EDFF',
  textSecondary: '#B6ADD2',
  textMuted: '#7D759A',
  onAccent: '#0A0716',

  accent: '#8B6CFF',
  accentPressed: '#A488FF',
  accentSoft: '#1F1838',
  accentSoftText: '#BBA8FF',

  bubbleAssistant: '#151127',
  bubbleUser: '#241B42',
  bubbleUserText: '#EDE7FF',

  success: '#46D9A6',
  successSoft: '#0F2A22',
  warning: '#FFC15E',
  danger: '#FF6B81',

  skeleton: '#1A1532',
  scrim: 'rgba(3, 2, 10, 0.7)',
};

export const palettes = { light: lightPalette, dark: darkPalette } as const;
export type ColorSchemeName = keyof typeof palettes;

/**
 * Atmospheric gradients. Per Anthropic's design guidance we avoid flat fills —
 * surfaces sit on a warm, barely-there gradient with a soft accent "aura" that
 * gives the app depth and a hand-crafted feel.
 */
export interface Gradients {
  /** Full-screen backdrop (top -> bottom), three stops. */
  ambient: readonly [string, string, string];
  /** Primary glow (already alpha-baked). */
  aura: string;
  /** Secondary glow for the nebula effect (a different hue). */
  auraAlt: string;
  /** The accent gradient (buttons, the momentum arc, the avatar). */
  accent: readonly [string, string];
  /** A faint sheen used on premium cards. */
  sheen: readonly [string, string];
}

const lightGradients: Gradients = {
  ambient: ['#FBF9FF', '#F3EEFF', '#EAE2FF'],
  aura: 'rgba(109, 77, 242, 0.16)',
  auraAlt: 'rgba(196, 77, 242, 0.12)',
  accent: ['#6D4DF2', '#A24DF2'],
  sheen: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'],
};

const darkGradients: Gradients = {
  ambient: ['#080612', '#0D0A20', '#150E2A'],
  aura: 'rgba(139, 108, 255, 0.30)',
  auraAlt: 'rgba(255, 92, 170, 0.22)',
  accent: ['#8B6CFF', '#C86CFF'],
  sheen: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],
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
