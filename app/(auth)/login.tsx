import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H1, Body, Caption } from '@/components/ui/Typography';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <H1 style={styles.title}>IronWallet</H1>
          <Caption style={styles.tagline}>
            For people who know better — but still overspend.
          </Caption>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? <Body style={styles.error}>{error}</Body> : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
            />

            <View style={styles.footer}>
              <Caption style={styles.footerText}>Don't have an account?</Caption>
              <Button
                title="Sign Up"
                onPress={() => router.push('/(auth)/signup')}
                variant="secondary"
                fullWidth
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  error: {
    color: '#FF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    gap: 12,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});
