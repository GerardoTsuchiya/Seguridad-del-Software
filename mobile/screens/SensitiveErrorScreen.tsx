import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AttackResult from '../components/AttackResult';
import { BASE_URL } from '../config';

export default function SensitiveErrorScreen({ isFixed }: { isFixed: boolean }) {
  const [status, setStatus] = useState<number | null>(null);
  const [body, setBody] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  async function attack(url: string) {
    setLoading(true);
    setStatus(null);
    setBody(null);
    try {
      const res = await fetch(`${BASE_URL}${url}`);
      const json = await res.json();
      setStatus(res.status);
      setBody(json);
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
      <Text style={styles.title}>⚠️ Error Sensible</Text>
      <Text style={styles.description}>
        Al fallar la consulta, el servidor devuelve el stack trace completo, la ruta interna y los parámetros recibidos.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => attack('/debug-user')}>
        <Text style={styles.buttonText}>Sin ID</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => attack('/debug-user?id=abc')}>
        <Text style={styles.buttonText}>ID inválido</Text>
      </TouchableOpacity>
      <AttackResult status={status} body={body} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#1a1a2e' },
  fixedBanner: { backgroundColor: '#1e8449', borderRadius: 6, padding: 8, marginBottom: 16, alignItems: 'center' },
  fixedBannerText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e67e22', marginBottom: 8 },
  description: { color: '#aaa', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  button: { backgroundColor: '#d35400', borderRadius: 6, padding: 14, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
