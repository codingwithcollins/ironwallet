import { Text, StyleSheet, TextStyle } from 'react-native';

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function H1({ children, style }: TypographyProps) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: TypographyProps) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function H3({ children, style }: TypographyProps) {
  return <Text style={[styles.h3, style]}>{children}</Text>;
}

export function Body({ children, style }: TypographyProps) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Caption({ children, style }: TypographyProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: '#CCC',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
    lineHeight: 20,
  },
});
