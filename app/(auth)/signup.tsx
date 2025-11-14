import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H1, Body, Caption } from '@/components/ui/Typography';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('profiles').insert({
        user_id: user.id,
        email: email,
        full_name: '',
        onboarding_completed: false,
      });

      await supabase.from('treat_wallet').insert({
        user_id: user.id,
        current_balance: 0,
        monthly_budget: 0,
      });
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
            Time to get your finances under control.
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

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? <Body style={styles.error}>{error}</Body> : null}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
            />

            <View style={styles.footer}>
              <Caption style={styles.footerText}>Already have an account?</Caption>
              <Button
                title="Sign In"
                onPress={() => router.back()}
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
