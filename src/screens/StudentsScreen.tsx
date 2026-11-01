import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { radius } from '../theme/tokens';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { FadeInUp } from '../components/ui/FadeInUp';
import { TouchableScale } from '../components/ui/TouchableScale';
import { AppleButton } from '../components/AppleButton';
import { Avatar, Badge, Banner, Card, EmptyState, Segmented, statusAluno } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { useStack } from '../navigation/Stack';
import { AddStudentSheet } from '../sheets/Sheets';
import { mensagemErro } from '../utils/format';

type Filtro = 'TODOS' | 'AGUARDANDO' | 'EMBARCADO';

export const StudentsScreen: React.FC = () => {
  const { role, alunos, viagemAtiva, isDemo, registrarEmbarque, offlineQueueCount, sincronizarFilaOffline, recarregar } = useApp();
  const stack = useStack();
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

  const title = motorista ? 'Embarque' : role === 'INSTITUICAO' ? 'Alunos' : 'Meus alunos';
  const subtitle = motorista ? (emRota ? 'Toque para registrar entrada e saída' : undefined) : undefined;

  return (
    <LargeTitleScreen
      title={title}
      subtitle={subtitle}
      onRefresh={recarregar}
      right={role === 'RESPONSAVEL' ? (
        <TouchableScale onPress={() => setAdd(true)} style={s.plus} accessibilityRole="button" accessibilityLabel="Adicionar aluno">
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableScale>
      ) : undefined}
    >
      {motorista && !emRota && alunos.length > 0 && (
        <View style={s.gap}><Banner tone="info" message={isDemo ? 'Inicie uma rota na aba Rota para liberar os registros.' : 'Inicie uma rota na aba Rota para registrar embarques.'} /></View>
      )}
      {motorista && offlineQueueCount > 0 && (
        <View style={s.gap}>
          <Banner tone="warning" message={`${offlineQueueCount} registro(s) salvos sem internet aguardando envio.`} icon="cloud-offline" />
          <View style={{ height: 8 }} />
          <AppleButton variant="secondary" size="sm" title="Sincronizar agora" onPress={sincronizar} loading={busy === 'sync'} />
          {sync && <Text style={s.sync}>{sync}</Text>}
        </View>
      )}
      {erro && <View style={s.gap}><Banner tone="error" message={erro} /></View>}

      {motorista && alunos.length > 0 && (
        <View style={s.gap}>
          <Segmented<Filtro> value={filtro} onChange={setFiltro}
            options={[{ value: 'TODOS', label: 'Todos' }, { value: 'AGUARDANDO', label: 'Aguardando' }, { value: 'EMBARCADO', label: 'A bordo' }]} />
        </View>
      )}

      {alunos.length === 0 ? (
        role === 'RESPONSAVEL' ? (
          <EmptyState icon="person-add" title="Nenhum aluno ainda" message="Adicione seu filho com o código do motorista."
            action={<AppleButton size="lg" title="Adicionar aluno" onPress={() => setAdd(true)} />} />
        ) : (
          <EmptyState icon="people" title="Nenhum aluno vinculado" message="Quando os pais usarem o seu código de convite, os alunos aparecem aqui. Veja o código em Conta." />
        )
      ) : lista.length === 0 ? (
        <EmptyState icon="checkmark-done" title="Tudo certo por aqui" message="Nenhum aluno neste filtro." />
      ) : (
        <View style={{ gap: 12 }}>
          {lista.map((a, i) => {
            const st = statusAluno(a.statusEmbarque);
            const embarcado = a.statusEmbarque === 'EMBARCADO';
            return (
              <FadeInUp key={a.id} index={i}>
                <TouchableScale
                  disabled={role === 'INSTITUICAO'}
                  onPress={() => stack.push('StudentDetail', { id: a.id })}
                  pressedScale={0.985}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.nome}, ${st.label}`}
                >
                  <Card>
                    <View style={s.head}>
                      <Avatar name={a.nome} size={48} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{a.nome}</Text>
                        <Text style={s.meta}>{a.turma} · {a.turno === 'MANHA' ? 'Manhã' : a.turno === 'TARDE' ? 'Tarde' : a.turno === 'NOITE' ? 'Noite' : 'Integral'}</Text>
                      </View>
                      <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
                    </View>
                    <View style={s.addr}>
                      <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
                      <Text style={s.addrText} numberOfLines={2}>{a.endereco_busca}</Text>
                    </View>
                    {a.ultimoRegistro ? <Text style={s.last}>{a.ultimoRegistro}</Text> : null}
                    {motorista && (
                      <View style={{ marginTop: 14 }}>
                        {a.statusEmbarque === 'AUSENTE' ? (
                          <Text style={s.meta}>Falta comunicada pelos pais.</Text>
                        ) : a.statusEmbarque === 'DESEMBARCADO' ? (
                          <Text style={s.meta}>Entregue na escola.</Text>
                        ) : (
                          <AppleButton
                            variant={embarcado ? 'secondary' : 'primary'}
                            title={embarcado ? 'Registrar desembarque' : 'Registrar embarque'}
                            icon={<Ionicons name={embarcado ? 'school-outline' : 'log-in-outline'} size={17} color={embarcado ? colors.textPrimary : '#fff'} />}
                            onPress={() => marcar(a.id, embarcado ? 'DESEMBARQUE' : 'EMBARQUE')}
                            loading={busy === a.id}
                            disabled={!emRota && !isDemo}
                          />
                        )}
                      </View>
                    )}
                  </Card>
                </TouchableScale>
              </FadeInUp>
            );
          })}
        </View>
      )}
      <AddStudentSheet visible={add} onClose={() => setAdd(false)} />
    </LargeTitleScreen>
  );
};

const s = StyleSheet.create({
  gap: { marginBottom: 14 },
  plus: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { ...type.headline, color: colors.textPrimary },
  meta: { ...type.footnote, color: colors.textTertiary, marginTop: 1 },
  addr: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 12 },
  addrText: { flex: 1, ...type.subhead, color: colors.textSecondary },
  last: { ...type.footnote, color: colors.textTertiary, marginTop: 6 },
  sync: { ...type.footnote, color: colors.textTertiary, marginTop: 6 },
});
