/**
 * @fileoverview Result Screen - Final results
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function ResultScreen(): JSX.Element {
  const { count = '0' } = useLocalSearchParams<{ count: string }>();
  const num = parseInt(count, 10);

  const scale   = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const btnY    = useSharedValue(20);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 500 });
    btnY.value    = withDelay(600, withSpring(0, { damping: 15 }));
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: btnY.value }],
    opacity:   withDelay(600, withTiming(1, { duration: 300 })),
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.circle, circleStyle]}>
          <LinearGradient
            colors={[Colors.primary[400], Colors.primary[600]]}
            style={styles.circleGrad}
          >
            <Text style={styles.checkmark}>✓</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>
          {num === 0 ? 'Already Clean!' : 'All Done!'}
        </Text>

        <Text style={styles.count}>
          {num === 0
            ? 'You had no reposts to remove.'
            : `${num} repost${num !== 1 ? 's' : ''} removed`}
        </Text>

        <Text style={styles.subtitle}>Your TikTok profile is clean ✓</Text>

        <Animated.View style={[styles.btnContainer, btnStyle]}>
          <TouchableOpacity
            onPress={() => router.replace('/')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>← Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  circle:    { marginBottom: 32 },
  circleGrad: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  checkmark: { fontSize: 56, color: '#fff' },
  title:     { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.extrabold, color: Colors.neutral[900], textAlign: 'center' },
  count:     { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.accent[500], marginTop: 8 },
  subtitle:  { fontSize: Typography.fontSize.base, color: Colors.neutral[400], marginTop: 8, marginBottom: 40 },
  btnContainer: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  btn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  btnText: { color: '#fff', fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
});
