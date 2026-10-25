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
  const [dbStatus, setDbStatus] = useState<string>('Verificando status...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    const hasConfig = isSupabaseConfigured();
    setConfigured(hasConfig);

    if (!hasConfig) {
      setDbStatus('Aguardando credenciais no arquivo .env');
      setLoading(false);
      return;
    }

    try {
      // Teste de chamada para verificar conectividade com o Supabase
      const { error } = await supabase.from('perfis').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Se a tabela não foi criada ainda ou erro de conexão
        setDbStatus(`Conectado ao Supabase (${error.message})`);
      } else {
        setDbStatus('Conectado ao Supabase com Sucesso!');
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

        {/* Card de Status do Banco de Dados */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status do Banco de Dados</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: configured ? '#D1FAE5' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: configured ? '#065F46' : '#92400E' },
                ]}
              >
                {configured ? 'NUVEM ATIVA' : 'CONFIG PENDENTE'}
              </Text>
            </View>
          </View>

          <View style={styles.statusBox}>
            {loading ? (
              <ActivityIndicator size="small" color="#F59E0B" />
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

        {/* Módulos do Sistema */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Módulos Integrados ao Banco</Text>
        </View>

        <View style={styles.moduleGrid}>
          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>📍</Text>
            <Text style={styles.moduleTitle}>Rastreamento GPS</Text>
            <Text style={styles.moduleDesc}>
              Telemetria em tempo real com PostGIS e baixa latência (RF003).
            </Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🎒</Text>
            <Text style={styles.moduleTitle}>Controle de Alunos</Text>
            <Text style={styles.moduleDesc}>
              Embarque/desembarque com suporte a sincronização offline (RF007).
            </Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>💳</Text>
            <Text style={styles.moduleTitle}>Módulo Financeiro</Text>
            <Text style={styles.moduleDesc}>
              Gestão de contratos, PIX, boletos e recibos digitais (RF005/012).
            </Text>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🛡️</Text>
            <Text style={styles.moduleTitle}>Segurança & LGPD</Text>
            <Text style={styles.moduleDesc}>
              Isolamento estrito entre transportadores via RLS (RNF006/008).
            </Text>
          </View>
        </View>

        {/* Instruções de Ativação */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Próximos Passos de Configuração:</Text>
          <Text style={styles.infoItem}>
            1. Crie seu projeto no painel do <Text style={styles.bold}>Supabase</Text>.
          </Text>
          <Text style={styles.infoItem}>
            2. Execute o script <Text style={styles.bold}>supabase/schema.sql</Text> no SQL Editor do Supabase.
          </Text>
          <Text style={styles.infoItem}>
            3. Preencha as chaves no seu arquivo <Text style={styles.bold}>.env</Text> (vide .env.example).
          </Text>
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
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
    marginVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
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
    marginTop: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  moduleGrid: {
    gap: 12,
    marginBottom: 24,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 20,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
});
