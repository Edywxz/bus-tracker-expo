import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { FadeInUp } from '../components/ui/FadeInUp';
import { Avatar, Badge, Banner, Card, Group, Row, SectionLabel, Segmented } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { useStack } from '../navigation/Stack';
import { EditProfileSheet, ReceiptSettingsSheet } from '../sheets/Sheets';
import { TipoUsuario } from '../types/database';
import { brl, mensagemErro } from '../utils/format';

const ROTULO: Record<TipoUsuario, string> = { RESPONSAVEL: 'Responsável', TRANSPORTADOR: 'Motorista', INSTITUICAO: 'Escola' };

export const AccountScreen: React.FC = () => {
  const { role, perfil, isDemo, setRole, sair, excluirConta, codigoConvite, nomes, veiculo, temVeiculo, recebimento, recarregar } = useApp();
  const stack = useStack();
  const [edit, setEdit] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const nome = perfil?.nome ?? (role === 'TRANSPORTADOR' ? 'Tio Marcos' : role === 'INSTITUICAO' ? 'Colégio Santa Maria' : 'Carlos Silva');

  const confirmarSair = () =>
    Alert.alert('Sair da conta?', isDemo ? 'Você volta para a tela inicial.' : 'Você precisará entrar de novo para ver a van.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { sair().catch(() => {}); } },
    ]);

  const confirmarExcluir = () =>
    Alert.alert('Excluir conta?', 'Seus dados e os cadastros ligados a você serão apagados de forma permanente. Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir conta', style: 'destructive',
        onPress: () => excluirConta().catch((e) => Alert.alert('Não foi possível excluir', mensagemErro(e))),
      },
    ]);

  return (
    <LargeTitleScreen title="Conta" onRefresh={recarregar}>
      <FadeInUp index={0} style={{ marginBottom: 18 }}>
        <Card style={s.profile}>
          <Avatar name={nome} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.name} numberOfLines={1}>{nome}</Text>
            {perfil?.email ? <Text style={s.mail} numberOfLines={1}>{perfil.email}</Text> : null}
            <Badge label={ROTULO[role]} color={colors.accentText} bg={colors.accentLight} icon={role === 'TRANSPORTADOR' ? 'bus' : role === 'INSTITUICAO' ? 'school' : 'people'} />
          </View>
        </Card>
      </FadeInUp>

      {isDemo && (
        <FadeInUp index={1} style={{ marginBottom: 18, gap: 10 }}>
          <Banner tone="info" message="Modo de exemplo: os dados não são salvos. Troque o perfil para ver cada experiência." />
          <Segmented<TipoUsuario> value={role} onChange={setRole}
            options={[{ value: 'RESPONSAVEL', label: 'Pais' }, { value: 'TRANSPORTADOR', label: 'Motorista' }, { value: 'INSTITUICAO', label: 'Escola' }]} />
        </FadeInUp>
      )}

      {(role === 'TRANSPORTADOR' || role === 'INSTITUICAO') && codigoConvite && (
        <FadeInUp index={1} style={{ marginBottom: 18 }}>
          <Card style={{ alignItems: 'center', gap: 6 }}>
            <Text style={s.cap}>SEU CÓDIGO DE CONVITE</Text>
            <Text selectable style={s.code} accessibilityLabel={`Código ${codigoConvite.split('').join(' ')}`}>{codigoConvite}</Text>
            <Text style={s.muted}>Passe este código para {role === 'TRANSPORTADOR' ? 'os pais' : 'os pais dos alunos'} se vincularem.</Text>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp index={2}>
        <SectionLabel>Cadastro</SectionLabel>
        <Group>
          <Row icon="person-outline" title="Meus dados" subtitle="Nome e telefone" onPress={() => (isDemo ? Alert.alert('Modo de exemplo', 'Crie uma conta para editar seus dados.') : setEdit(true))} />
          {role === 'RESPONSAVEL' && nomes.transportador ? <Row icon="bus-outline" title="Motorista" value={nomes.transportador} /> : null}
          {role === 'TRANSPORTADOR' ? (
            <Row icon="bus-outline" title="Veículo" subtitle={temVeiculo ? `${veiculo.modelo} · ${veiculo.placa}` : 'Cadastre para iniciar rotas'} onPress={() => stack.push('Vehicle')} />
          ) : null}
          {role === 'TRANSPORTADOR' ? (
            <Row icon="cash-outline" title="Recebimento" subtitle={recebimento.valor ? `${brl(recebimento.valor)} · dia ${recebimento.diaVencimento}${recebimento.chavePix ? ' · PIX ok' : ''}` : 'Valor, vencimento e chave PIX'} onPress={() => setReceipt(true)} />
          ) : null}
        </Group>

        <View style={{ height: 18 }} />
        <SectionLabel>Escola</SectionLabel>
        <Group>
          <Row icon="school-outline" title="Escola e contatos" subtitle="Instituição, pessoas autorizadas" onPress={() => stack.push('School')} />
          <Row icon="calendar-outline" title="Calendário letivo" subtitle="Feriados, recessos e eventos" onPress={() => stack.push('Calendar')} />
        </Group>

        <View style={{ height: 18 }} />
        <SectionLabel>Privacidade</SectionLabel>
        <Group>
          <Row icon="shield-checkmark-outline" title="Seus dados e a LGPD" onPress={() => stack.push('Privacy')} />
        </Group>

        <View style={{ height: 18 }} />
        <Group>
          <Row icon="log-out-outline" title={isDemo ? 'Sair do modo de exemplo' : 'Sair'} onPress={confirmarSair} chevron={false} />
          {!isDemo && <Row destructive icon="trash-outline" title="Excluir conta" onPress={confirmarExcluir} chevron={false} />}
        </Group>
        <Text style={s.version}>VanEscolar GPS · versão 1.0</Text>
      </FadeInUp>

      <EditProfileSheet visible={edit} onClose={() => setEdit(false)} />
      <ReceiptSettingsSheet visible={receipt} onClose={() => setReceipt(false)} />
    </LargeTitleScreen>
  );
};

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { ...type.title3, color: colors.textPrimary },
  mail: { ...type.footnote, color: colors.textTertiary },
  cap: { ...type.caption, color: colors.textTertiary, letterSpacing: 1 },
  code: { fontSize: 34, fontWeight: '800', letterSpacing: 6, color: colors.textPrimary },
  muted: { ...type.footnote, color: colors.textTertiary, textAlign: 'center' },
  version: { ...type.footnote, color: colors.textQuaternary, textAlign: 'center', marginTop: 20 },
});
