import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AttackResult from '../components/AttackResult';
import VulnInfo from '../components/VulnInfo';
import { BASE_URL } from '../config';

export default function MissingParamScreen({ isFixed }: { isFixed: boolean }) {
  const [status, setStatus] = useState<number | null>(null);
  const [body, setBody] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  async function attack(body_payload: object) {
    setLoading(true);
    setStatus(null);
    setBody(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/change-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body_payload),
      });
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
      <Text style={styles.title}>❓ Parámetro Faltante</Text>
      <Text style={styles.description}>
        Si falta userId o role, el servidor asigna valores inseguros por default en lugar de rechazar la operación.
      </Text>
      {!isFixed && (
        <VulnInfo
          why="El servidor asume valores por defecto inseguros cuando faltan datos críticos en lugar de abortar la operación. Esto puede provocar escalación de privilegios sin que el atacante necesite credenciales válidas."
          cases={[
            'E-commerce que procesa un pedido con precio $0 si el campo no llega en el body.',
            'Sistema de roles que asigna "admin" como fallback ante un campo faltante en el request.',
            'App médica que registra dosis 0 en lugar de rechazar una prescripción incompleta.',
          ]}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={() => attack({ role: 'admin' })}>
        <Text style={styles.buttonText}>Sin userId</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => attack({ userId: '2' })}>
        <Text style={styles.buttonText}>Sin role</Text>
      </TouchableOpacity>
      <AttackResult status={status} body={body} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#1a1a2e' },
  fixedBanner: { backgroundColor: '#1e8449', borderRadius: 6, padding: 8, marginBottom: 16, alignItems: 'center' },
  fixedBannerText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#8e44ad', marginBottom: 8 },
  description: { color: '#aaa', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  button: { backgroundColor: '#7d3c98', borderRadius: 6, padding: 14, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
