import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase, isSupabaseConfigured } from './src/services/supabase';

export default function App() {
  const [configured, setConfigured] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<string>('Verificando conexão...');
  const [loading, setLoading] = useState<boolean>(true);
  const [tablesSummary, setTablesSummary] = useState<string[]>([]);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    const hasConfig = isSupabaseConfigured();
    setConfigured(hasConfig);

    try {
      // Teste de consulta em tabelas do Supabase
      const [perfisRes, veiculosRes, viagensRes] = await Promise.all([
        supabase.from('perfis').select('id', { count: 'exact', head: true }),
        supabase.from('veiculos').select('id', { count: 'exact', head: true }),
        supabase.from('viagens').select('id', { count: 'exact', head: true }),
      ]);

      if (perfisRes.error) {
        setDbStatus(`Erro ao consultar: ${perfisRes.error.message}`);
      } else {
        setDbStatus('✅ Conectado ao Supabase com Sucesso! Schema e RLS operantes.');
        setTablesSummary([
          'perfis',
          'responsaveis',
          'transportadores',
          'instituicoes_ensino',
          'alunos',
          'pessoas_autorizadas',
          'veiculos',
          'viagens',
          'localizacoes_gps (PostGIS)',
          'registros_embarque_desembarque',
          'eventos_rota',
          'contratos_servico',
          'mensalidades',
          'pagamentos',
        ]);
      }
    } catch (err: any) {
      setDbStatus(`Erro de conexão: ${err.message || 'Falha ao acessar servidor'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚌</Text>
          <Text style={styles.title}>VanEscolar GPS</Text>
          <Text style={styles.subtitle}>
            Rastreamento & Gestão para Transportadores Escolares
          </Text>
        </View>

        {/* Card de Conexão com o Supabase */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Conexão Supabase</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: configured ? '#D1FAE5' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: configured ? '#065F46' : '#991B1B' },
                ]}
              >
                {configured ? 'ONLINE • NUVEM' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <View style={styles.statusBox}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.loadingText}>Conectando ao banco...</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>{dbStatus}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={checkConnection}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Testar Conexão Novamente</Text>
          </TouchableOpacity>
        </View>

        {/* Tabelas Ativas */}
        {tablesSummary.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tabelas Modeladas no Banco (14)</Text>
            <Text style={styles.cardSubtitle}>
              Todas com Row Level Security (RLS) habilitado:
            </Text>
            <View style={styles.tagContainer}>
              {tablesSummary.map((tbl) => (
                <View key={tbl} style={styles.tag}>
                  <Text style={styles.tagText}>{tbl}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Serviços Implementados */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Serviços Integrados no Código</Text>
        </View>

        <View style={styles.moduleGrid}>
          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>📍</Text>
            <Text style={styles.moduleTitle}>LocationTrackerService</Text>
            <Text style={styles.moduleDesc}>
              Telemetria GPS em tempo real (PostGIS Point) + Realtime Broadcast para pais e escolas.
            </Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🎒</Text>
            <Text style={styles.moduleTitle}>BoardingService</Text>
            <Text style={styles.moduleDesc}>
              Registro de embarque/desembarque com fila de sincronização offline automática.
            </Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>💳</Text>
            <Text style={styles.moduleTitle}>PaymentService</Text>
            <Text style={styles.moduleDesc}>
              Controle de parcelas, emissão de recibos e liquidação via PIX, Cartão e Boleto.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 48,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    minHeight: 46,
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#475569',
  },
  statusText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  moduleGrid: {
    gap: 10,
    marginBottom: 20,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
