import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { AppleButton } from '../components/AppleButton';
import { TouchableScale } from '../components/ui/TouchableScale';
import { Avatar, Badge, Card, EmptyState, Group, Row, SectionLabel } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { AuthorizedSheet, VehicleSheet } from '../sheets/Sheets';
import { isoToBR, partesData } from '../utils/format';
import { SecurityService } from '../services/security';

/* ---------------------------------------------------------- Veículo */
export const VehicleScreen: React.FC = () => {
  const { veiculo, temVeiculo } = useApp();
  const [edit, setEdit] = useState(false);
  const vencida = !!veiculo.validade_vistoria && veiculo.validade_vistoria < new Date().toISOString().slice(0, 10);
  return (
    <LargeTitleScreen title="Veículo"
      footer={<AppleButton size="lg" title={temVeiculo ? 'Editar veículo' : 'Cadastrar veículo'} onPress={() => setEdit(true)} />}>
      {!temVeiculo ? (
        <EmptyState icon="bus" title="Nenhum veículo" message="Cadastre a van para poder iniciar rotas e mostrar aos pais os dados do transporte." />
      ) : (
        <>
          <Card style={{ alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <View style={s.plate}><Text style={s.plateText}>{veiculo.placa}</Text></View>
            <Text style={s.model}>{veiculo.modelo}</Text>
            <Badge label={vencida ? 'Vistoria vencida' : 'Vistoria em dia'} color={vencida ? colors.systemRedText : colors.systemGreenText}
              bg={vencida ? colors.systemRedLight : colors.systemGreenLight} icon={vencida ? 'alert-circle' : 'checkmark-circle'} />
          </Card>
          <Group>
            <Row title="Ano" value={String(veiculo.ano)} />
            <Row title="Assentos" value={String(veiculo.capacidade_assentos)} />
            <Row title="RENAVAM" value={veiculo.renavam} />
            <Row title="Alvará" value={veiculo.numero_alvara} />
            <Row title="Vistoria até" value={isoToBR(veiculo.validade_vistoria)} />
          </Group>
        </>
      )}
      <VehicleSheet visible={edit} onClose={() => setEdit(false)} />
    </LargeTitleScreen>
  );
};

/* ---------------------------------------------------------- Escola e contatos */
export const SchoolScreen: React.FC = () => {
  const { alunos, pessoasAutorizadas, nomes, role, removerPessoaAutorizada } = useApp();
  const [add, setAdd] = useState(false);
  const pai = role === 'RESPONSAVEL';
  const remover = (id: string, nome: string) =>
    Alert.alert('Remover pessoa autorizada?', `${nome} não poderá mais buscar o aluno.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removerPessoaAutorizada(id).catch((e) => Alert.alert('Erro', e.message)) },
    ]);
  return (
    <LargeTitleScreen title="Escola e contatos">
      <SectionLabel>Instituição</SectionLabel>
      {nomes.escola || alunos[0]?.endereco_entrega ? (
        <Group>
          <Row icon="school-outline" title={nomes.escola ?? 'Escola'} subtitle={alunos[0]?.endereco_entrega} />
          {nomes.transportador ? <Row icon="bus-outline" title="Transportador" value={nomes.transportador} /> : null}
        </Group>
      ) : (
        <Card><Text style={s.muted}>Nenhuma escola vinculada ainda. Informe o código da escola ao cadastrar o aluno.</Text></Card>
      )}

      {role !== 'INSTITUICAO' && (
        <>
          <View style={{ height: 18 }} />
          <SectionLabel right={pai && alunos.length > 0 ? (
            <TouchableScale onPress={() => setAdd(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Adicionar pessoa autorizada">
              <Text style={s.link}>Adicionar</Text>
            </TouchableScale>) : undefined}>Pessoas autorizadas</SectionLabel>
          {pessoasAutorizadas.length === 0 ? (
            <Card><Text style={s.muted}>Ninguém cadastrado além dos responsáveis.</Text></Card>
          ) : (
            <Group>
              {pessoasAutorizadas.map((p) => (
                <Row key={p.id} left={<Avatar name={p.nome} size={40} />} title={p.nome}
                  subtitle={`${p.grau_parentesco} · ${SecurityService.maskPhone(p.telefone)} · ${alunos.find((a) => a.id === p.aluno_id)?.nome.split(' ')[0] ?? ''}`}
                  right={pai ? (
                    <TouchableScale onPress={() => remover(p.id, p.nome)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remover ${p.nome}`}>
                      <Ionicons name="trash-outline" size={20} color={colors.systemRed} />
                    </TouchableScale>) : undefined} />
              ))}
            </Group>
          )}
        </>
      )}
      <AuthorizedSheet visible={add} onClose={() => setAdd(false)} />
    </LargeTitleScreen>
  );
};

/* ---------------------------------------------------------- Calendário */
const TIPO_COR: Record<string, { color: string; bg: string; label: string }> = {
  FERIADO: { color: colors.systemRedText, bg: colors.systemRedLight, label: 'Feriado' },
  RECESSO: { color: colors.systemBlueText, bg: colors.systemBlueLight, label: 'Recesso' },
  EVENTO: { color: colors.accentText, bg: colors.accentLight, label: 'Evento' },
  LETIVO: { color: colors.systemGreenText, bg: colors.systemGreenLight, label: 'Letivo' },
};
export const CalendarScreen: React.FC = () => {
  const { eventosCalendario } = useApp();
  return (
    <LargeTitleScreen title="Calendário letivo" subtitle="Dias sem transporte aparecem aqui">
      {eventosCalendario.length === 0 ? (
        <EmptyState icon="calendar" title="Sem eventos" message="Quando a escola publicar feriados, recessos e eventos, eles aparecem neste calendário." />
      ) : (
        <Group>
          {eventosCalendario.map((e) => {
            const d = partesData(e.data);
            const t = TIPO_COR[e.tipo] ?? TIPO_COR.EVENTO;
            return (
              <Row key={e.id}
                left={<View style={s.date}><Text style={s.dateDay}>{d.dia}</Text><Text style={s.dateMonth}>{d.mes}</Text></View>}
                title={e.titulo} subtitle={e.descricao} right={<Badge label={t.label} color={t.color} bg={t.bg} />} />
            );
          })}
        </Group>
      )}
    </LargeTitleScreen>
  );
};

/* ---------------------------------------------------------- Privacidade */
export const PrivacyScreen: React.FC = () => (
  <LargeTitleScreen title="Seus dados" subtitle="Como cuidamos da privacidade">
    <Group>
      <Row icon="lock-closed-outline" title="Conexão protegida" subtitle="Os dados trafegam criptografados entre o app e o servidor." />
      <Row icon="eye-off-outline" title="Cada um vê o seu" subtitle="Pais veem só os próprios filhos. O motorista vê apenas os alunos da rota dele." />
      <Row icon="medkit-outline" title="Saúde do aluno" subtitle="Observações médicas ficam visíveis só para a família e o motorista." />
      <Row icon="location-outline" title="Localização" subtitle="A posição da van só é compartilhada durante uma rota em andamento." />
      <Row icon="trash-outline" title="Você decide" subtitle="Em Conta você pode excluir sua conta e os dados ligados a ela a qualquer momento." />
    </Group>
  </LargeTitleScreen>
);

const s = StyleSheet.create({
  plate: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.ink, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  plateText: { fontSize: 28, fontWeight: '800', letterSpacing: 3, color: colors.ink },
  model: { ...type.headline, color: colors.textPrimary },
  muted: { ...type.subhead, color: colors.textTertiary },
  link: { ...type.footnote, fontWeight: '700', color: colors.accentDark },
  date: { width: 44, alignItems: 'center', paddingVertical: 4, borderRadius: 12, backgroundColor: colors.background },
  dateDay: { ...type.headline, color: colors.textPrimary },
  dateMonth: { ...type.caption, fontSize: 10, color: colors.textTertiary },
});
