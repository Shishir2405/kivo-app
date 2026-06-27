import React, { useEffect, useMemo } from 'react';
import { Pressable, View, Text, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { fonts, radii, interaction, pressOpacity } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';

/**
 * IMPORTANT — Firebase + native setup required for this to work:
 *  - Enable the Google sign-in provider in the Firebase console
 *    (Authentication → Sign-in method → Google).
 *  - For native builds, add the app's SHA-1 (and SHA-256) fingerprints to the
 *    Firebase Android app, and configure the iOS/Android OAuth client IDs.
 *  - The web OAuth client id below must be authorised for the redirect URIs that
 *    expo-auth-session generates (Expo proxy in dev / the app scheme in builds).
 */

// Web OAuth client id (Google Cloud → Credentials → OAuth 2.0 Web client).
const GOOGLE_WEB_CLIENT_ID =
  '249950991247-s7f0ps8ehkjm4ikr1gj0kmhqba0jhji0.apps.googleusercontent.com';

// Required so the auth session popup/redirect completes cleanly on web/native.
WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInButtonProps = {
  /** Called when sign-in fully succeeds (after the backend session is set). */
  onSuccess?: () => void;
  /** Called with an inline, human-readable message on any failure. */
  onError?: (message: string) => void;
  /** Disable the button (e.g. while another auth action is in flight). */
  disabled?: boolean;
};

/** The Google "G" mark — small, brand-correct, rendered as inline SVG. */
function GoogleGlyph({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/**
 * GoogleSignInButton — Steep outline button (white fill, 1px Dove hairline, Ink
 * label, small Google glyph). On press it runs the expo-auth-session Google
 * flow, then routes the resulting idToken through `useAuthStore.loginWithGoogle`.
 *
 * It NEVER throws: every failure path reports inline via `onError`. The button
 * carries the standard Steep interaction states (pressed opacity + hint border,
 * web hover wash, disabled opacity).
 */
export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
  const { colors } = useTheme();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loading = useAuthStore((s) => s.loading);
  const [busy, setBusy] = React.useState(false);

  // Stable config reference — a NEW object each render makes expo-auth-session
  // re-create the request and churn re-renders, which can disturb focus on the
  // parent auth screens. Memoize so it's built exactly once.
  const authConfig = useMemo(() => ({ clientId: GOOGLE_WEB_CLIENT_ID }), []);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(authConfig);

  // Resolve the auth-session response (it returns out-of-band, not from prompt).
  useEffect(() => {
    if (!response) return;
    let cancelled = false;

    const finish = async () => {
      if (response.type === 'success') {
        const idToken = response.params?.id_token;
        if (!idToken) {
          if (!cancelled) {
            setBusy(false);
            onError?.('Could not sign in with Google. Please try again.');
          }
          return;
        }
        const result = await loginWithGoogle(idToken);
        if (cancelled) return;
        setBusy(false);
        if (result.ok) onSuccess?.();
        else onError?.(result.error ?? 'Could not sign in with Google. Please try again.');
      } else if (response.type === 'error') {
        if (!cancelled) {
          setBusy(false);
          onError?.('Could not sign in with Google. Please try again.');
        }
      } else {
        // dismissed / cancelled — quietly reset, no error noise.
        if (!cancelled) setBusy(false);
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [response, loginWithGoogle, onSuccess, onError]);

  const isDisabled = disabled || loading || busy || !request;

  const handlePress = async () => {
    if (isDisabled) return;
    onError?.(''); // clear any prior inline error
    setBusy(true);
    try {
      const res = await promptAsync();
      // If the prompt itself resolves to a non-success state, stop the spinner;
      // the success path is handled by the response effect above.
      if (res?.type !== 'success') setBusy(false);
    } catch {
      setBusy(false);
      onError?.('Could not sign in with Google. Please try again.');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => ({ opacity: pressOpacity({ pressed }, { disabled: isDisabled }) })}
    >
      {({ pressed, hovered }) => (
        <View
          className="flex-row items-center justify-center"
          style={{
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: radii.pill,
            backgroundColor: hovered && !pressed ? interaction.hoverWash : colors.surface,
            borderWidth: 1,
            borderColor: pressed ? colors.ink : colors.hairline,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <GoogleGlyph size={16} />
          )}
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink }}>
            {busy ? 'Connecting…' : 'Continue with Google'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default GoogleSignInButton;
