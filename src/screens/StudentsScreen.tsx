import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { gap, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { FadeInUp } from '../components/ui/FadeInUp';
import {
  Avatar, Button, Card, EmptyState, HeaderButton, Icon, Notice, Screen, SegmentedControl, StatusPill, statusAluno,
} from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { AddStudentSheet } from '../sheets/Sheets';
import { mensagemErro } from '../utils/format';

type Filtro = 'TODOS' | 'AGUARDANDO' | 'EMBARCADO';
const TURNO: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', INTEGRAL: 'Integral', NOITE: 'Noite' };

export const StudentsScreen: React.FC = () => {
  const { role, alunos, viagemAtiva, isDemo, registrarEmbarque, offlineQueueCount, sincronizarFilaOffline, recarregar } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sync, setSync] = useState<string | null>(null);
  const [add, setAdd] = useState(false);
  const emRota = viagemAtiva.status === 'EM_ANDAMENTO';
  const motorista = role === 'TRANSPORTADOR';

  const lista = alunos.filter((a) =>
    !motorista || filtro === 'TODOS' ? true : filtro === 'AGUARDANDO' ? a.statusEmbarque === 'AGUARDANDO' : a.statusEmbarque === 'EMBARCADO');

  const marcar = async (id: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => {
    setBusy(id); setErro(null);
    try { await registrarEmbarque(id, tipo); } catch (e) { setErro(mensagemErro(e)); } finally { setBusy(null); }
  };

  const sincronizar = async () => {
    setBusy('sync');
    try {
      const r = await sincronizarFilaOffline();
      setSync(r.erros ? `${r.sincronizados} enviados, ${r.erros} ainda pendentes.` : `${r.sincronizados} registros enviados.`);
    } finally { setBusy(null); }
  };

  const title = motorista ? 'Passageiros' : 'Meus dependentes';
  const subtitle = motorista ? (emRota ? 'Toque para registrar entrada e saída' : undefined) : undefined;

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      onRefresh={recarregar}
      headerRight={role === 'RESPONSAVEL' ? <HeaderButton icon="plus" label="Adicionar dependente" onPress={() => setAdd(true)} /> : undefined}
    >
      {motorista && !emRota && alunos.length > 0 && (
        <View style={s.gap}><Notice tone="info" message={isDemo ? 'Inicie uma rota na aba Rota para liberar os registros.' : 'Inicie uma rota na aba Rota para registrar embarques.'} /></View>
      )}
      {motorista && offlineQueueCount > 0 && (
        <View style={s.gap}>
          <Notice tone="warning" message={`${offlineQueueCount} registro(s) salvos sem internet aguardando envio.`} icon="offline" />
          <View style={{ height: gap.related }} />
          <Button variant="bordered" size="sm" label="Sincronizar agora" onPress={sincronizar} loading={busy === 'sync'} />
          {sync && <Text style={s.sync}>{sync}</Text>}
        </View>
      )}
      {erro && <View style={s.gap}><Notice tone="error" message={erro} /></View>}

      {motorista && alunos.length > 0 && (
        <View style={s.gap}>
          <SegmentedControl<Filtro> value={filtro} onChange={setFiltro} accessibilityLabel="Filtrar passageiros"
            options={[{ value: 'TODOS', label: 'Todos' }, { value: 'AGUARDANDO', label: 'Aguardando' }, { value: 'EMBARCADO', label: 'A bordo' }]} />
        </View>
      )}

      {alunos.length === 0 ? (
        role === 'RESPONSAVEL' ? (
          <EmptyState icon="personAdd" title="Nenhum dependente ainda" message="Adicione seu dependente com o código do motorista."
            action={<Button size="lg" label="Adicionar dependente" onPress={() => setAdd(true)} />} />
        ) : (
          <EmptyState icon="people" title="Nenhum passageiro vinculado" message="Quando os responsáveis usarem o seu código de convite, os passageiros aparecem aqui. Veja o código em Conta." />
        )
      ) : lista.length === 0 ? (
        <EmptyState icon="checkDone" title="Tudo certo por aqui" message="Nenhum passageiro neste filtro." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {lista.map((a, i) => {
            const st = statusAluno(a.statusEmbarque);
            const embarcado = a.statusEmbarque === 'EMBARCADO';
            return (
              <FadeInUp key={a.id} index={i}>
                <Card onPress={() => go.student(a.id)} accessibilityLabel={`${a.nome}, ${st.label}`}>
                  <View style={s.head}>
                    <Avatar name={a.nome} size={44} onBoard={embarcado} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{a.nome}</Text>
                      <Text style={s.meta}>{a.turma} · {TURNO[a.turno] ?? a.turno}</Text>
                    </View>
                    <StatusPill tone={st.tone} label={st.label} />
                  </View>
                  <View style={s.addr}>
                    <Icon name="location" size={15} color={colors.secondaryLabel} />
                    <Text style={s.addrText} numberOfLines={2}>{a.endereco_busca}</Text>
                  </View>
                  {a.ultimoRegistro ? <Text style={s.last}>{a.ultimoRegistro}</Text> : null}
                  {motorista && (
                    <View style={{ marginTop: spacing.md + 2 }}>
                      {a.statusEmbarque === 'AUSENTE' ? (
                        <Text style={s.meta}>Falta comunicada pelo responsável.</Text>
                      ) : a.statusEmbarque === 'DESEMBARCADO' ? (
                        <Text style={s.meta}>Entregue na escola.</Text>
                      ) : (
                        <Button
                          variant={embarcado ? 'bordered' : 'borderedProminent'}
                          label={embarcado ? 'Registrar desembarque' : 'Registrar embarque'}
                          icon={embarcado ? 'school' : 'login'}
                          onPress={() => marcar(a.id, embarcado ? 'DESEMBARQUE' : 'EMBARQUE')}
                          loading={busy === a.id}
                          disabled={!emRota && !isDemo}
                        />
                      )}
                    </View>
                  )}
                </Card>
              </FadeInUp>
            );
          })}
        </View>
      )}
      <AddStudentSheet visible={add} onClose={() => setAdd(false)} />
    </Screen>
  );
};

const s = StyleSheet.create({
  gap: { marginBottom: spacing.md + 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...type.headline, color: colors.label },
  meta: { ...type.footnote, color: colors.secondaryLabel, marginTop: 1 },
  addr: { flexDirection: 'row', gap: spacing.s6, alignItems: 'flex-start', marginTop: spacing.md },
  addrText: { flex: 1, ...type.subheadline, color: colors.secondaryLabel },
  last: { ...type.footnote, color: colors.secondaryLabel, marginTop: spacing.s6 },
  sync: { ...type.footnote, color: colors.secondaryLabel, marginTop: spacing.s6 },
});
