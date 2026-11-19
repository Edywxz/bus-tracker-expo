import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/type';
import { Button, Chip, SegmentedControl, Sheet } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { initialMockData } from '../services/mockData';
import { ALUNOS_SIM, type Gravidade, type Sentido } from '../services/simulacao';

const IDS = Object.keys(ALUNOS_SIM);
const nomeDe = (id: string) => initialMockData.alunos.find((a) => a.id === id);

/** Demo: escolhe a viagem a simular (sentido, alunos, ocorrência) e começa. */
export const SimulacaoSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { iniciarSimulacao } = useApp();
  const [sentido, setSentido] = useState<Sentido>('IDA');
  const [ids, setIds] = useState<string[]>(IDS);
  const [ocorr, setOcorr] = useState<'NENHUMA' | Gravidade>('NENHUMA');
  const escolas = new Set(ids.map((id) => ALUNOS_SIM[id].escola)).size;
  const alterna = (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet visible={visible} onClose={onClose} title="Simular viagem" subtitle="A van percorre a rota em tempo real e o app reage a cada parada."
      footer={<Button size="lg" label="Iniciar simulação" icon="play" disabled={!ids.length}
        onPress={() => { iniciarSimulacao({ sentido, alunoIds: IDS.filter((i) => ids.includes(i)), ocorrencia: ocorr === 'NENHUMA' ? null : ocorr }); onClose(); }} />}>
      <SegmentedControl value={sentido} onChange={setSentido} options={[{ value: 'IDA', label: 'Ida à escola' }, { value: 'VOLTA', label: 'Volta para casa' }]} />
      <Text style={st.label}>Alunos na viagem</Text>
      <View style={st.wrap}>
        {IDS.map((id) => <Chip key={id} label={`${nomeDe(id)?.nome.split(' ')[0]} · ${nomeDe(id)?.escola_nome}`} selected={ids.includes(id)} onPress={() => alterna(id)} />)}
      </View>
      <Text style={st.muted}>{ids.length ? `${ids.length} ${ids.length === 1 ? 'aluno' : 'alunos'} · ${escolas === 1 ? '1 escola' : `${escolas} escolas`}` : 'Escolha ao menos um aluno.'}</Text>
      <Text style={st.label}>Ocorrência no meio do caminho</Text>
      <SegmentedControl value={ocorr} onChange={setOcorr}
        options={[{ value: 'NENHUMA', label: 'Nenhuma' }, { value: 'BAIXA', label: 'Baixa' }, { value: 'MEDIA', label: 'Média' }, { value: 'ALTA', label: 'Alta' }, { value: 'EMERGENCIA', label: 'Urgente' }]} />
    </Sheet>
  );
};

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { ...type.footnote, color: colors.secondaryLabel, marginBottom: -8, paddingHorizontal: 4 },
  muted: { ...type.footnote, color: colors.secondaryLabel },
});
