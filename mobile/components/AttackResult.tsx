import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

type Props = {
  status: number | null;
  body: object | null;
  loading: boolean;
};

export default function AttackResult({ status, body, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Enviando ataque...</Text>
      </View>
    );
  }

  if (status === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>La respuesta del servidor aparecerá aquí</Text>
      </View>
    );
  }

  const isError = status >= 400;

  return (
    <View style={styles.container}>
      <Text style={[styles.status, isError ? styles.statusError : styles.statusOk]}>
        HTTP {status} {isError ? '✗' : '✓'}
      </Text>
      <ScrollView style={styles.bodyScroll}>
        <Text style={styles.body}>{JSON.stringify(body, null, 2)}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  loading: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  placeholder: {
    color: '#555',
    fontStyle: 'italic',
  },
  status: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  statusOk: {
    color: '#2ecc71',
  },
  statusError: {
    color: '#e74c3c',
  },
  bodyScroll: {
    maxHeight: 200,
  },
  body: {
    color: '#eee',
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
