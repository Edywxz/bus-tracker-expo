import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import {
  Avatar, Button, Card, confirm, EmptyState, IconButton, ListRow, ListSection, notify, PillTone, Screen, SectionFooter, SectionHeader, StatusPill,
} from '../components/ui/kit';
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
    <Screen title="Veículo"
      footer={<Button variant="filled" label={temVeiculo ? 'Editar veículo' : 'Cadastrar veículo'} onPress={() => setEdit(true)} />}>
      {!temVeiculo ? (
        <EmptyState icon="van" title="Nenhum veículo" message="Cadastre a van para poder iniciar rotas e mostrar aos pais os dados do transporte." />
      ) : (
        <>
          <Card style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <View style={s.plate} accessibilityLabel={`Placa ${veiculo.placa}`}>
              <View style={s.plateBand}><Text style={s.plateBandText}>BRASIL</Text></View>
              <Text style={s.plateText}>{veiculo.placa}</Text>
            </View>
            <Text style={s.model}>{veiculo.modelo}</Text>
            <StatusPill tone={vencida ? 'error' : 'success'} label={vencida ? 'Vistoria vencida' : 'Vistoria em dia'} icon={vencida ? 'alert' : 'checkCircle'} />
          </Card>
          <ListSection>
            <ListRow title="Ano" value={String(veiculo.ano)} />
            <ListRow title="Assentos" value={String(veiculo.capacidade_assentos)} />
            <ListRow title="RENAVAM" value={veiculo.renavam} />
            <ListRow title="Alvará" value={veiculo.numero_alvara} />
            <ListRow title="Vistoria até" value={isoToBR(veiculo.validade_vistoria)} />
          </ListSection>
        </>
      )}
      <VehicleSheet visible={edit} onClose={() => setEdit(false)} />
    </Screen>
  );
};

/* ---------------------------------------------------------- Escola e contatos */
export const SchoolScreen: React.FC = () => {
  const { alunos, pessoasAutorizadas, nomes, role, removerPessoaAutorizada } = useApp();
  const [add, setAdd] = useState(false);
  const pai = role === 'RESPONSAVEL';
  const remover = async (id: string, nome: string) => {
    const ok = await confirm({ title: 'Remover pessoa autorizada?', message: `${nome} não poderá mais buscar o aluno.`, confirmLabel: 'Remover', destructive: true });
    if (ok) removerPessoaAutorizada(id).catch((e) => notify('Erro', e.message));
  };
  return (
    <Screen title="Escola e contatos">
      <SectionHeader title="Instituição" />
      {nomes.escola || alunos[0]?.endereco_entrega ? (
        <ListSection>
          <ListRow icon="school" iconTone="primary" title={nomes.escola ?? 'Escola'} subtitle={alunos[0]?.endereco_entrega} />
          {nomes.transportador ? <ListRow icon="van" iconTone="signal" title="Transportador" value={nomes.transportador} /> : null}
        </ListSection>
      ) : (
        <Card><Text style={s.muted}>Nenhuma escola vinculada ainda. Informe o código da escola ao cadastrar o aluno.</Text></Card>
      )}

      {role !== 'INSTITUICAO' && (
        <>
          <SectionHeader title="Pessoas autorizadas" action={pai && alunos.length > 0 ? { label: 'Adicionar', onPress: () => setAdd(true) } : undefined} />
          {pessoasAutorizadas.length === 0 ? (
            <Card><Text style={s.muted}>Ninguém cadastrado além dos responsáveis.</Text></Card>
          ) : (
            <ListSection>
              {pessoasAutorizadas.map((p) => (
                <ListRow key={p.id} leading={<Avatar name={p.nome} />} title={p.nome}
                  subtitle={`${p.grau_parentesco} · ${SecurityService.maskPhone(p.telefone)} · ${alunos.find((a) => a.id === p.aluno_id)?.nome.split(' ')[0] ?? ''}`}
                  trailing={pai ? <IconButton icon="trash" label={`Remover ${p.nome}`} variant="plain" tint={colors.error} onPress={() => remover(p.id, p.nome)} /> : undefined} />
              ))}
            </ListSection>
          )}
          <SectionFooter>Só estas pessoas podem receber o aluno no ponto de desembarque.</SectionFooter>
        </>
      )}
      <AuthorizedSheet visible={add} onClose={() => setAdd(false)} />
    </Screen>
  );
};

/* ---------------------------------------------------------- Calendário */
const TIPO: Record<string, { tone: PillTone; label: string }> = {
  FERIADO: { tone: 'error', label: 'Feriado' },
  RECESSO: { tone: 'info', label: 'Recesso' },
  EVENTO: { tone: 'neutral', label: 'Evento' },
  LETIVO: { tone: 'success', label: 'Letivo' },
};
export const CalendarScreen: React.FC = () => {
  const { eventosCalendario } = useApp();
  return (
    <Screen title="Calendário letivo" subtitle="Dias sem transporte aparecem aqui">
      {eventosCalendario.length === 0 ? (
        <EmptyState icon="calendar" title="Sem eventos" message="Quando a escola publicar feriados, recessos e eventos, eles aparecem neste calendário." />
      ) : (
        <ListSection>
          {eventosCalendario.map((e) => {
            const d = partesData(e.data);
            const t = TIPO[e.tipo] ?? TIPO.EVENTO;
            return (
              <ListRow key={e.id}
                leading={<View style={s.date}><Text style={s.dateDay}>{d.dia}</Text><Text style={s.dateMonth}>{d.mes}</Text></View>}
                title={e.titulo} subtitle={e.descricao} trailing={<StatusPill tone={t.tone} label={t.label} />} />
            );
          })}
        </ListSection>
      )}
    </Screen>
  );
};

/* ---------------------------------------------------------- Privacidade */
export const PrivacyScreen: React.FC = () => (
  <Screen title="Seus dados" subtitle="Como cuidamos da privacidade">
    <ListSection>
      <ListRow icon="lock" iconTone="gray" title="Conexão protegida" subtitle="Os dados trafegam criptografados entre o app e o servidor." />
      <ListRow icon="eyeOff" iconTone="gray" title="Cada um vê o seu" subtitle="Pais veem só os próprios filhos. O motorista vê apenas os alunos da rota dele." />
      <ListRow icon="medical" iconTone="gray" title="Saúde do aluno" subtitle="Observações médicas ficam visíveis só para a família e o motorista." />
      <ListRow icon="location" iconTone="gray" title="Localização" subtitle="A posição da van só é compartilhada durante uma rota em andamento." />
      <ListRow icon="trash" iconTone="gray" title="Você decide" subtitle="Em Conta você pode excluir sua conta e os dados ligados a ela a qualquer momento." />
    </ListSection>
  </Screen>
);

const s = StyleSheet.create({
  plate: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', minWidth: 180 },
  plateBand: { alignSelf: 'stretch', backgroundColor: colors.sysBlue, paddingVertical: 2, alignItems: 'center' },
  plateBandText: { ...type.caption2, fontWeight: '700', letterSpacing: 2, color: colors.white },
  plateText: { fontSize: 28, fontWeight: '800', letterSpacing: 3, color: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, fontVariant: ['tabular-nums'] },
  model: { ...type.headline, color: colors.label },
  muted: { ...type.subheadline, color: colors.secondaryLabel },
  date: { width: 44, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.fill3 },
  dateDay: { ...type.headline, color: colors.label, fontVariant: ['tabular-nums'] },
  dateMonth: { ...type.caption2, color: colors.secondaryLabel, textTransform: 'uppercase' },
});
