/**
 * @fileoverview Root layout - expo-router entry point
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../theme/colors';
import { preloadSelectors } from '../utils/remoteSelectors';

export default function RootLayout(): JSX.Element {
  // Preload remote selectors on app startup
  useEffect(() => {
    preloadSelectors();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="webview" />
        <Stack.Screen name="result" />
      </Stack>
    </>
  );
}
