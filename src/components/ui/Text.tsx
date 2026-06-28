import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme, type TypographyVariant } from '@/theme';
import type { Palette } from '@/theme';

type ColorKey = keyof Pick<
  Palette,
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'onAccent'
  | 'accent'
  | 'accentSoftText'
  | 'success'
  | 'warning'
  | 'danger'
  | 'bubbleUserText'
>;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorKey;
  center?: boolean;
  /** Override color directly (e.g. a computed value). Wins over `color`. */
  tint?: string;
}

/**
 * The single text primitive for the whole app. Encodes the type scale and
 * theme-aware color so screens never reach for raw font sizes.
 */
export function Text({
  variant = 'body',
  color = 'text',
  center,
  tint,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const base = theme.typography[variant] as TextStyle;
  return (
    <RNText
      style={[
        base,
        { color: tint ?? theme.colors[color] },
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
