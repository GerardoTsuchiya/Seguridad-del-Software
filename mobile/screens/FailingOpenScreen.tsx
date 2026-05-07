import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AttackResult from '../components/AttackResult';
import { BASE_URL } from '../config';

export default function FailingOpenScreen({ isFixed }: { isFixed: boolean }) {
  const [status, setStatus] = useState<number | null>(null);
  const [body, setBody] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  async function attack(headers: Record<string, string>) {
    setLoading(true);
    setStatus(null);
    setBody(null);
    try {
      const res = await fetch(`${BASE_URL}/admin`, { headers });
      const text = await res.text();
      let parsed: object;
      try { parsed = JSON.parse(text); } catch { parsed = { html: text }; }
      setStatus(res.status);
      setBody(parsed);
    } catch (e: any) {
      setStatus(0);
      setBody({ error: 'No se pudo conectar al servidor', detail: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isFixed && (
        <View style={styles.fixedBanner}>
          <Text style={styles.fixedBannerText}>Versión segura 🔒</Text>
        </View>
      )}
      <Text style={styles.title}>🔓 Failing Open</Text>
      <Text style={styles.description}>
        El middleware de autenticación captura el error pero llama next() en lugar de bloquear.
        El panel admin es accesible sin token válido.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => attack({})}>
        <Text style={styles.buttonText}>Sin token</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => attack({ Authorization: 'Bearer token-invalido' })}>
        <Text style={styles.buttonText}>Token inválido</Text>
      </TouchableOpacity>
      <AttackResult status={status} body={body} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#1a1a2e' },
  fixedBanner: { backgroundColor: '#1e8449', borderRadius: 6, padding: 8, marginBottom: 16, alignItems: 'center' },
  fixedBannerText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c', marginBottom: 8 },
  description: { color: '#aaa', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  button: { backgroundColor: '#c0392b', borderRadius: 6, padding: 14, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
