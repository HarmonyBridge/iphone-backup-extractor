/**
 * @fileoverview Home Screen - White Mode + Animations
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const { width: W } = Dimensions.get('window');

// ── Animated Logo Component ──────────────────────────────────
function AnimatedLogo() {
  const rotation  = useSharedValue(0);
  const scale     = useSharedValue(0.8);
  const opacity   = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // Fade in
    opacity.value  = withTiming(1, { duration: 600 });
    scale.value    = withSpring(1, { damping: 12, stiffness: 150 });

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1
    );

    // Pulsing glow
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000 }),
        withTiming(1.0,  { duration: 2000 })
      ),
      -1, true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.3,
  }));

  return (
    <View style={logoStyles.container}>
      {/* Glow ring behind logo */}
      <Animated.View style={[logoStyles.glow, glowStyle]} />
      {/* Logo itself — starburst shape in gradient */}
      <Animated.View style={[logoStyles.logo, logoStyle]}>
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={logoStyles.gradient}
        >
          {/* Starburst shape */}
          <Text style={logoStyles.icon}>✦</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ── Animated Background Particles ───────────────────────────
function BackgroundParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => {
    const y       = useSharedValue(-20);
    const opacity = useSharedValue(0);
    const x       = (Math.random() * 0.8 + 0.1) * W;

    useEffect(() => {
      const delay = i * 800;
      y.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(-20,  { duration: 0 }),
          withTiming(-300, { duration: 4000 + Math.random() * 2000 })
        ),
        -1
      ));
      opacity.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(0.15, { duration: 500 }),
          withTiming(0,    { duration: 3500 })
        ),
        -1
      ));
    }, []);

    const style = useAnimatedStyle(() => ({
      transform: [{ translateY: y.value }],
      opacity: opacity.value,
      left: x,
    }));

    return <Animated.View key={i} style={[particleStyles.dot, style]} />;
  });

  return <View style={particleStyles.container} pointerEvents="none">{particles}</View>;
}

// ── Step Card ────────────────────────────────────────────────
interface StepCardProps {
  number: string;
  text: string;
  delay?: number;
}

function StepCard({ number, text, delay = 0 }: StepCardProps) {
  const translateX = useSharedValue(-30);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, { damping: 15 }));
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View style={[styles.stepCard, animStyle]}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </Animated.View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function HomeScreen(): JSX.Element {
  const btnScale = useSharedValue(1);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1.0,  { damping: 10, stiffness: 200 })
    );
    router.push('/webview');
  }

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <BackgroundParticles />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedLogo />
          <Text style={styles.title}>TikTok Repost{'\n'}Remover</Text>
          <Text style={styles.subtitle}>
            Delete all your reposts in one tap
          </Text>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Private</Text>
            <Text style={styles.statLabel}>On-device only</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Fast</Text>
            <Text style={styles.statLabel}>Auto-removes</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <StepCard number="1" text="Tap below → TikTok opens inside the app"      delay={100} />
          <StepCard number="2" text="Log into your TikTok account as usual"         delay={200} />
          <StepCard number="3" text="Come back and tap 'Start Removing'"            delay={300} />
          <StepCard number="4" text="Watch all reposts disappear automatically ✓"   delay={400} />
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your password is never accessed.
            Everything happens locally on your device only.
          </Text>
        </View>

        {/* CTA Button */}
        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Open TikTok & Start →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Not affiliated with TikTok or ByteDance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16 },
  header:        { alignItems: 'center', paddingVertical: 24 },
  title: {
    fontSize:   Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color:      Colors.neutral[900],
    textAlign:  'center',
    lineHeight: 36,
    marginTop:  12,
  },
  subtitle: {
    fontSize:   Typography.fontSize.md,
    color:      Colors.neutral[500],
    textAlign:  'center',
    marginTop:  8,
  },
  statsBar: {
    flexDirection:   'row',
    backgroundColor: Colors.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    paddingVertical: 16,
    marginBottom:    24,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.primary[500] },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.neutral[400], marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  stepsContainer: {
    backgroundColor: Colors.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         20,
    marginBottom:    16,
  },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[800], marginBottom: 16 },
  stepCard: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    marginBottom:   12,
    gap:            12,
  },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary[400],
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  stepBadgeText: { color: '#fff', fontWeight: Typography.fontWeight.bold, fontSize: 12 },
  stepText:  { flex: 1, fontSize: Typography.fontSize.base, color: Colors.neutral[700], lineHeight: 22 },
  privacyCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  '#EFF8F2',
    borderRadius:     12,
    padding:          14,
    marginBottom:     24,
    borderWidth:      1,
    borderColor:      '#C6EDD5',
    gap:              10,
  },
  privacyIcon:  { fontSize: 20 },
  privacyText:  { flex: 1, fontSize: Typography.fontSize.sm, color: '#2D6A4F', lineHeight: 18 },
  btnWrapper:   { marginBottom: 16 },
  ctaButton: {
    paddingVertical:  18,
    borderRadius:     16,
    alignItems:       'center',
    shadowColor:      Colors.primary[600],
    shadowOffset:     { width: 0, height: 6 },
    shadowOpacity:    0.25,
    shadowRadius:     12,
    elevation:        8,
  },
  ctaText: {
    color:      '#fff',
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize:  Typography.fontSize.xs,
    color:     Colors.neutral[400],
    textAlign: 'center',
  },
});

const logoStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 96, height: 96, marginBottom: 8 },
  glow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.primary[300],
  },
  logo:     { width: 80, height: 80, borderRadius: 20, overflow: 'hidden' },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: 36, color: '#fff' },
});

const particleStyles = StyleSheet.create({
  container: { position: 'absolute', width: '100%', height: '100%', bottom: 0 },
  dot: {
    position: 'absolute', bottom: 0,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary[400],
  },
});
