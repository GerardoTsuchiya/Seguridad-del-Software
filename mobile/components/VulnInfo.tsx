import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  why: string;
  cases: string[];
}

export default function VulnInfo({ why, cases }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>¿Por qué es una vulnerabilidad?</Text>
      <Text style={styles.body}>{why}</Text>
      <Text style={[styles.sectionTitle, styles.casesTitle]}>Casos reales</Text>
      {cases.map((c, i) => (
        <Text key={i} style={styles.case}>• {c}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2a3a',
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#f39c12',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  casesTitle: {
    marginTop: 10,
  },
  body: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  case: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 20,
  },
});
