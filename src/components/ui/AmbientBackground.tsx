import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

/**
 * The atmospheric backdrop every screen sits on. A warm three-stop gradient
 * with a soft accent "aura" glowing from the top — never a flat fill. This is
 * the single biggest lever on the app feeling hand-crafted vs. templated.
 */
export function AmbientBackground({ aura = true }: { aura?: boolean }) {
  const theme = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.gradients.ambient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {aura ? (
        <LinearGradient
          colors={[theme.gradients.aura, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.aura}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
});
