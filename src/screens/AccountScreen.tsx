import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { FadeInUp } from '../components/ui/FadeInUp';
import {
  Avatar, Card, confirm, ListRow, ListSection, Notice, notify, Screen, SectionFooter, SectionHeader, SegmentedControl, share, StatusPill,
} from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { EditProfileSheet, ReceiptSettingsSheet } from '../sheets/Sheets';
import { TipoUsuario } from '../types/database';
import { brl, mensagemErro } from '../utils/format';

const ROTULO: Record<TipoUsuario, string> = { RESPONSAVEL: 'Responsável', TRANSPORTADOR: 'Motorista', INSTITUICAO: 'Escola' };

export const AccountScreen: React.FC = () => {
  const { role, perfil, isDemo, setRole, sair, excluirConta, codigoConvite, nomes, veiculo, temVeiculo, recebimento, recarregar } = useApp();
  const [edit, setEdit] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const nome = perfil?.nome ?? (role === 'TRANSPORTADOR' ? 'Tio Marcos' : role === 'INSTITUICAO' ? 'Colégio Santa Maria' : 'Carlos Silva');

  const confirmarSair = async () => {
    const ok = await confirm({ title: 'Sair da conta?', message: isDemo ? 'Você volta para a tela inicial.' : 'Você precisará entrar de novo para ver a van.', confirmLabel: 'Sair', destructive: true });
    if (ok) sair().catch(() => {});
  };

  const confirmarExcluir = async () => {
    const ok = await confirm({
      title: 'Excluir conta?', confirmLabel: 'Excluir conta', destructive: true,
      message: 'Seus dados e os cadastros ligados a você serão apagados de forma permanente. Essa ação não pode ser desfeita.',
    });
    if (ok) excluirConta().catch((e) => notify('Não foi possível excluir', mensagemErro(e)));
  };

  return (
    <Screen title="Conta" onRefresh={recarregar}>
      <FadeInUp index={0}>
        <Card style={s.profile}>
          <Avatar name={nome} size="lg" />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={s.name} numberOfLines={1}>{nome}</Text>
            {perfil?.email ? <Text style={s.mail} numberOfLines={1}>{perfil.email}</Text> : null}
            <StatusPill tone="neutral" label={ROTULO[role]} icon={role === 'TRANSPORTADOR' ? 'van' : role === 'INSTITUICAO' ? 'school' : 'people'} />
          </View>
        </Card>
      </FadeInUp>

      {isDemo && (
        <FadeInUp index={1} style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Notice tone="info" message="Modo de exemplo: os dados não são salvos. Troque o perfil para ver cada experiência." />
          <SegmentedControl<TipoUsuario> value={role} onChange={setRole} accessibilityLabel="Perfil de exemplo"
            options={[{ value: 'RESPONSAVEL', label: 'Pais' }, { value: 'TRANSPORTADOR', label: 'Motorista' }, { value: 'INSTITUICAO', label: 'Escola' }]} />
        </FadeInUp>
      )}

      {(role === 'TRANSPORTADOR' || role === 'INSTITUICAO') && codigoConvite && (
        <FadeInUp index={1} style={{ marginTop: spacing.lg }}>
          <Card style={{ alignItems: 'center', gap: spacing.s6 }}>
            <Text style={s.cap}>Seu código de convite</Text>
            <Text selectable style={s.code} accessibilityLabel={`Código ${codigoConvite.split('').join(' ')}`}>{codigoConvite}</Text>
            <Text style={s.muted}>Passe este código para {role === 'TRANSPORTADOR' ? 'os pais' : 'os pais dos alunos'} se vincularem.</Text>
          </Card>
          <ListSection style={{ marginTop: spacing.sm }}>
            <ListRow icon="share" iconTone="gray" title="Compartilhar código" role="action"
              onPress={() => share({ title: 'Código VanEscolar', message: `Use o código ${codigoConvite} no app VanEscolar GPS para cadastrar seu filho.` })} chevron={false} />
          </ListSection>
        </FadeInUp>
      )}

      <FadeInUp index={2}>
        <SectionHeader title="Cadastro" />
        <ListSection>
          <ListRow icon="person" iconTone="gray" title="Meus dados" subtitle="Nome e telefone" onPress={() => (isDemo ? notify('Modo de exemplo', 'Crie uma conta para editar seus dados.') : setEdit(true))} />
          {role === 'RESPONSAVEL' && nomes.transportador ? <ListRow icon="van" iconTone="signal" title="Motorista" value={nomes.transportador} /> : null}
          {role === 'TRANSPORTADOR' ? (
            <ListRow icon="van" iconTone="signal" title="Veículo" subtitle={temVeiculo ? `${veiculo.modelo} · ${veiculo.placa}` : 'Cadastre para iniciar rotas'} onPress={go.vehicle} />
          ) : null}
          {role === 'TRANSPORTADOR' ? (
            <ListRow icon="cash" iconTone="success" title="Recebimento" subtitle={recebimento.valor ? `${brl(recebimento.valor)} · dia ${recebimento.diaVencimento}${recebimento.chavePix ? ' · PIX ok' : ''}` : 'Valor, vencimento e chave PIX'} onPress={() => setReceipt(true)} />
          ) : null}
        </ListSection>

        <SectionHeader title="Escola" />
        <ListSection>
          <ListRow icon="school" iconTone="primary" title="Escola e contatos" subtitle="Instituição, pessoas autorizadas" onPress={go.school} />
          <ListRow icon="calendar" iconTone="error" title="Calendário letivo" subtitle="Feriados, recessos e eventos" onPress={go.calendar} />
        </ListSection>

        <SectionHeader title="Privacidade" />
        <ListSection>
          <ListRow icon="shield" iconTone="info" title="Seus dados e a LGPD" onPress={go.privacy} />
        </ListSection>

        <View style={{ height: spacing.xxl }} />
        <ListSection>
          <ListRow icon="logout" iconTone="gray" title={isDemo ? 'Sair do modo de exemplo' : 'Sair'} onPress={confirmarSair} chevron={false} />
          {!isDemo && <ListRow role="destructive" icon="trash" title="Excluir conta" onPress={confirmarExcluir} chevron={false} />}
        </ListSection>
        <SectionFooter>VanEscolar GPS · versão 1.0</SectionFooter>
      </FadeInUp>

      <EditProfileSheet visible={edit} onClose={() => setEdit(false)} />
      <ReceiptSettingsSheet visible={receipt} onClose={() => setReceipt(false)} />
    </Screen>
  );
};

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2 },
  name: { ...type.title3, color: colors.label },
  mail: { ...type.footnote, color: colors.secondaryLabel },
  cap: { ...type.sectionHeader, color: colors.secondaryLabel },
  code: { fontSize: 34, fontWeight: '800', letterSpacing: 6, color: colors.label, fontVariant: ['tabular-nums'] },
  muted: { ...type.footnote, color: colors.secondaryLabel, textAlign: 'center' },
});
