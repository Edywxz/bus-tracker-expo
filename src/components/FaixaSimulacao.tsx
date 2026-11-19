import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { gap, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { Button, Card, Chip, Sheet } from './ui/kit';
import { useApp } from '../context/AppContext';
import type { Gravidade } from '../services/simulacao';

const FASE = { PREPARAR: 'Hora de preparar', ESPERANDO: 'Esperando o motorista', EM_ROTA: 'Em rota', FIM: 'Chegou ao destino', ENCERRADA: 'Viagem encerrada' } as const;
const GRAVIDADES: { v: Gravidade; l: string }[] = [
  { v: 'BAIXA', l: 'Baixa' }, { v: 'MEDIA', l: 'Média' }, { v: 'ALTA', l: 'Alta' }, { v: 'EMERGENCIA', l: 'Urgente' },
];

/** Demo: faixa com o andamento da simulação e os atalhos para pular partes dela. */
export const FaixaSimulacao: React.FC = () => {
  const { simulacao, pararSimulacao, retomarSimulacao, pularSimulacao, dispararOcorrencia } = useApp();
  const [escolhendo, setEscolhendo] = useState(false);
  if (!simulacao) return null;
  const { linha, t, estado } = simulacao;
  const acabou = estado.fase === 'FIM' || estado.fase === 'ENCERRADA';
  const espera = estado.fase === 'PREPARAR' || estado.fase === 'ESPERANDO';
  const podeOcorrer = !acabou && !espera && (linha.ocorrenciaEm === null || t < linha.ocorrenciaEm);
  const status = estado.esperandoRetomar ? 'Pausada por ocorrência' : estado.fase === 'EM_ROTA' && estado.parada ? 'Em rota · parada' : FASE[estado.fase];

  return (
    <Card style={{ marginBottom: spacing.md, gap: gap.related }}>
      <Text style={s.title}>Simulação em andamento</Text>
      <Text style={s.sub}>{status}</Text>
      <View style={s.row}>
        {espera ? <Button size="sm" variant="bordered" label="Pular para a saída" onPress={() => pularSimulacao('SAIDA')} /> : null}
        <Button size="sm" variant="bordered" label="Próxima parada" disabled={acabou} onPress={() => pularSimulacao('PARADA')} />
        <Button size="sm" variant="bordered" label="Ir para o fim" disabled={acabou} onPress={() => pularSimulacao('FIM')} />
        {podeOcorrer ? <Button size="sm" variant="tinted" role="destructive" label="Disparar ocorrência"
          onPress={() => (linha.config.ocorrencia ? dispararOcorrencia(linha.config.ocorrencia) : setEscolhendo(true))} /> : null}
        {estado.esperandoRetomar ? <Button size="sm" label="Retomar" icon="play" onPress={retomarSimulacao} /> : null}
        <Button size="sm" variant="plain" label="Parar" onPress={pararSimulacao} />
      </View>
      <Sheet visible={escolhendo} onClose={() => setEscolhendo(false)} title="Disparar ocorrência" subtitle="Qual a gravidade?">
        <View style={s.row}>
          {GRAVIDADES.map((g) => <Chip key={g.v} label={g.l} selected={false} onPress={() => { setEscolhendo(false); dispararOcorrencia(g.v); }} />)}
        </View>
      </Sheet>
    </Card>
  );
};

const s = StyleSheet.create({
  title: { ...type.callout, fontWeight: '700', color: colors.label },
  sub: { ...type.footnote, color: colors.secondaryLabel },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
