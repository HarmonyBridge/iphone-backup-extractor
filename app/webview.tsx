/**
 * @fileoverview WebView Screen - Complete with Crash Recovery
 */

import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { WebView, WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAutomation } from '../hooks/useAutomation';
import { CHROME_MOBILE_UA, TIKTOK } from '../constants/config';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

// ── Animated counter display ─────────────────────────────────
interface CounterDisplayProps {
  count: number;
}

function CounterDisplay({ count }: CounterDisplayProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 300 }),
        withSpring(1.0,  { damping: 15, stiffness: 200 })
      );
    }
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={counterStyles.wrapper}>
      <Animated.Text style={[counterStyles.number, animStyle]}>
        {count}
      </Animated.Text>
      <Text style={counterStyles.label}>removed</Text>
    </View>
  );
}

// ── Running Indicator ────────────────────────────────────────
function RunningDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  React.useEffect(() => {
    const anim = (sv: ReturnType<typeof useSharedValue>, delay: number) => {
      sv.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(1,   { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      ));
    };
    anim(dot1, 0);
    anim(dot2, 200);
    anim(dot3, 400);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[
          dotStyles.dot,
          useAnimatedStyle(() => ({ opacity: d.value }))
        ]} />
      ))}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function WebViewScreen(): JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const hasAutoReloaded = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  
  const {
    state,
    handleMessage,
    handleWebViewLoad,
    handleWebViewLoadEnd,
    start,
    stop,
    reset
  } = useAutomation(webViewRef);

  // Defense #2: Memory leak prevention - cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending animation frames
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      // Stop automation if running
      if (state.isRunning) {
        stop();
      }
    };
  }, []);

  const handleBack = useCallback(() => {
    if (state.isRunning) {
      Alert.alert('Running', 'The process is still running. Stop it?', [
        { text: 'Keep Running', style: 'cancel' },
        { text: 'Stop & Exit', style: 'destructive', onPress: () => { stop(); router.back(); } },
      ]);
    } else {
      router.back();
    }
  }, [state.isRunning, stop]);

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Stop?', 'Stop the removal process?', [
      { text: 'Continue', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: stop },
    ]);
  }, [stop]);

  // Defense #3: WebView crash recovery
  const handleWebViewError = useCallback((syntheticEvent: WebViewErrorEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('[WebView Error]', nativeEvent);
    
    // Try auto-reload once
    if (!hasAutoReloaded.current && webViewRef.current) {
      hasAutoReloaded.current = true;
      setTimeout(() => {
        webViewRef.current?.reload();
      }, 2000);
      // Update status via a local state if needed
      // For now, we just log and reload
    }
  }, []);

  const handleHttpError = useCallback((syntheticEvent: WebViewHttpErrorEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('[WebView HTTP Error]', nativeEvent);
    
    if (nativeEvent.statusCode === 403) {
      // Access denied - likely rate limited or blocked
      Alert.alert(
        'Access Denied',
        'TikTok access was denied. This may be temporary. Please try again in a few minutes.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Determine CTA button state
  const showStart = ['ready', 'error', 'rate_limited'].includes(state.status);
  const showStop  = state.isRunning;
  const showDone  = state.status === 'done';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <View style={styles.titleDot} />
          <Text style={styles.topBarTitle}>TikTok</Text>
          {state.isRunning && <RunningDots />}
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* WebView */}
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: TIKTOK.BASE }}
          // Android required settings
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback={true}
          // Hide WebView fingerprint
          userAgent={CHROME_MOBILE_UA}
          // Events
          onMessage={e => handleMessage(e.nativeEvent.data)}
          onLoad={e => handleWebViewLoad(e.nativeEvent.url)}
          onLoadEnd={handleWebViewLoadEnd}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
          style={styles.webView}
        />
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Counter */}
        {state.removedCount > 0 && (
          <CounterDisplay count={state.removedCount} />
        )}

        {/* Status message */}
        <Text style={styles.statusMsg} numberOfLines={2}>
          {state.statusMessage}
        </Text>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          {showStart && (
            <TouchableOpacity
              onPress={handleStart}
              style={styles.startBtnWrapper}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.accent[500], Colors.accent[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtn}
              >
                <Text style={styles.startBtnText}>
                  {state.status === 'rate_limited' ? '▶ Resume' : '▶ Start Removing'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {showStop && (
            <TouchableOpacity onPress={handleStop} style={styles.stopBtn}>
              <Text style={styles.stopBtnText}>Stop</Text>
            </TouchableOpacity>
          )}

          {showDone && (
            <TouchableOpacity onPress={() => router.replace({ pathname: '/result', params: { count: state.removedCount.toString() } })} style={styles.doneBtn}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneBtnGrad}
              >
                <Text style={styles.doneBtnText}>View Results →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.background,
  },
  backBtn:     { paddingVertical: 4, width: 60 },
  backText:    { color: Colors.primary[500], fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  titleArea:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500] },
  topBarTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[800] },
  webViewWrapper: { flex: 1 },
  webView:     { flex: 1 },
  controlPanel: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop:        12,
    paddingBottom:     24,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    minHeight:         130,
    maxHeight:         220,
  },
  statusMsg: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.neutral[500],
    textAlign:  'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  actionsRow:      { alignItems: 'center', gap: 10 },
  startBtnWrapper: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  startBtn: {
    paddingVertical: 16,
    alignItems:      'center',
    borderRadius:    14,
  },
  startBtnText:    { color: '#fff', fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  stopBtn: {
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  stopBtnText:     { color: Colors.neutral[500], fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium },
  doneBtn:         { width: '100%', borderRadius: 14, overflow: 'hidden' },
  doneBtnGrad:     { paddingVertical: 16, alignItems: 'center' },
  doneBtnText:     { color: '#fff', fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
});

const counterStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginBottom: 8 },
  number:  { fontSize: Typography.fontSize['4xl'], fontWeight: Typography.fontWeight.extrabold, color: Colors.accent[500], lineHeight: 52 },
  label:   { fontSize: Typography.fontSize.sm, color: Colors.neutral[400] },
});

const dotStyles = StyleSheet.create({
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary[500] },
});
