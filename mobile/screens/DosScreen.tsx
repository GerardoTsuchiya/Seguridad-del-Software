import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AttackResult from '../components/AttackResult';
import VulnInfo from '../components/VulnInfo';
import { BASE_URL } from '../config';

export default function DosScreen({ isFixed }: { isFixed: boolean }) {
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
      <Text style={styles.title}>💥 DoS Simple</Text>
      <Text style={styles.description}>
        Una entrada inválida en /reports provoca una excepción no controlada que expone detalles internos del servidor.
      </Text>
      {!isFixed && (
        <VulnInfo
          why="Una entrada no validada provoca una excepción que, al no estar controlada, expone información interna y puede dejar el servidor en un estado inconsistente, afectando la disponibilidad para todos los usuarios."
          cases={[
            'API de reportes bancarios que crashea con rangos de fecha fuera de rango.',
            'Servicio de conversión de imágenes que expone rutas del sistema con archivos corruptos.',
            'Endpoint de búsqueda que falla con caracteres especiales y devuelve el error de BD.',
          ]}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={() => attack('/reports')}>
        <Text style={styles.buttonText}>Sin month</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => attack('/reports?month=abc')}>
        <Text style={styles.buttonText}>Month inválido</Text>
      </TouchableOpacity>
      <AttackResult status={status} body={body} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#1a1a2e' },
  fixedBanner: { backgroundColor: '#1e8449', borderRadius: 6, padding: 8, marginBottom: 16, alignItems: 'center' },
  fixedBannerText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#27ae60', marginBottom: 8 },
  description: { color: '#aaa', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  button: { backgroundColor: '#1e8449', borderRadius: 6, padding: 14, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
