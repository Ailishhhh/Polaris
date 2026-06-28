import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/theme';

/**
 * Full markdown rendering for mentor messages, themed to match the design
 * system. Handles headings, lists, code, blockquotes, links and emphasis.
 */
export function MarkdownMessage({ content }: { content: string }) {
  const theme = useTheme();

  const styles = useMemo(
    () => ({
      body: {
        color: theme.colors.text,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 24,
      },
      heading1: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: 24,
        lineHeight: 30,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
      },
      heading2: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: 20,
        lineHeight: 26,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
      },
      heading3: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 17,
        lineHeight: 24,
        color: theme.colors.text,
        marginTop: theme.spacing.xs,
      },
      strong: { fontFamily: 'Inter_700Bold', color: theme.colors.text },
      em: { fontFamily: 'Inter_400Regular', fontStyle: 'italic' as const },
      bullet_list: { marginVertical: theme.spacing.xs },
      ordered_list: { marginVertical: theme.spacing.xs },
      list_item: { marginVertical: 3, flexDirection: 'row' as const },
      bullet_list_icon: { color: theme.colors.accent, marginRight: 6 },
      ordered_list_icon: { color: theme.colors.accent, marginRight: 6 },
      blockquote: {
        backgroundColor: theme.colors.surfaceSunken,
        borderLeftColor: theme.colors.accent,
        borderLeftWidth: 3,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radii.sm,
        marginVertical: theme.spacing.xs,
      },
      code_inline: {
        fontFamily: 'monospace',
        backgroundColor: theme.colors.surfaceSunken,
        color: theme.colors.accentSoftText,
        borderRadius: 5,
        paddingHorizontal: 5,
        fontSize: 14,
      },
      fence: {
        fontFamily: 'monospace',
        backgroundColor: theme.colors.surfaceSunken,
        color: theme.colors.text,
        borderRadius: theme.radii.md,
        padding: theme.spacing.md,
        fontSize: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      code_block: {
        fontFamily: 'monospace',
        backgroundColor: theme.colors.surfaceSunken,
        color: theme.colors.text,
        borderRadius: theme.radii.md,
        padding: theme.spacing.md,
        fontSize: 14,
      },
      link: { color: theme.colors.accent, textDecorationLine: 'underline' as const },
      hr: { backgroundColor: theme.colors.border, height: 1, marginVertical: theme.spacing.md },
      table: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        marginVertical: theme.spacing.xs,
      },
      th: { padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceSunken },
      td: { padding: theme.spacing.sm, borderColor: theme.colors.border },
      paragraph: { marginTop: 0, marginBottom: theme.spacing.sm },
    }),
    [theme],
  );

  return (
    <Markdown
      style={styles as any}
      onLinkPress={(url) => {
        Linking.openURL(url).catch(() => {});
        return false;
      }}
    >
      {content}
    </Markdown>
  );
}
