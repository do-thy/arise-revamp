import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors, radii, spacing, typography } from '../theme';
import { Logo } from '../components/ui/Logo';
import { RadioSelector } from '../components/ui/RadioSelector';
import { TextField } from '../components/ui/TextField';
import { PillButton } from '../components/ui/PillButton';
import { Divider } from '../components/ui/Divider';
import type { Role } from '../types';

type Mode = 'signIn' | 'register';

export function LoginScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [role, setRole] = useState<Role>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Logo size={72} />
          </View>

          <Text style={styles.title}>ARISE</Text>
          <Text style={styles.subtitle}>
            Augmented Reality Interactive Spatial Explorer
          </Text>

          <RadioSelector<Role>
            options={[
              { label: 'As User', value: 'user' },
              { label: 'As Admin', value: 'admin' },
            ]}
            value={role}
            onChange={setRole}
          />

          <View style={styles.form}>
            <TextField
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PillButton
            title={mode === 'signIn' ? 'Sign In' : 'Register'}
            onPress={submit}
            loading={loading}
          />

          <Divider />

          <PillButton
            title="Google"
            variant="secondary"
            onPress={onGoogle}
            loading={loading}
            icon={<GoogleGlyph />}
          />

          <Pressable
            onPress={() => setMode((m) => (m === 'signIn' ? 'register' : 'signIn'))}
            hitSlop={8}
          >
            <Text style={styles.link}>
              {mode === 'signIn'
                ? 'Do not have an account? Register'
                : 'Already have an account? Sign In'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoogleGlyph() {
  return (
    <View style={styles.googleGlyph}>
      <Text style={styles.googleGlyphText}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  googleGlyph: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGlyphText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
});
