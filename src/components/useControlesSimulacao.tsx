import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Sheet } from './ui/kit';
import type { SheetAction } from './ds/modality';
import { useApp } from '../context/AppContext';
import type { Gravidade } from '../services/simulacao';

const FASE = { PREPARAR: 'Hora de preparar', ESPERANDO: 'Esperando o motorista', EM_ROTA: 'Em rota', FIM: 'Chegou ao destino', ENCERRADA: 'Viagem encerrada' } as const;
const GRAVIDADES: { v: Gravidade; l: string }[] = [
  { v: 'BAIXA', l: 'Baixa' }, { v: 'MEDIA', l: 'Média' }, { v: 'ALTA', l: 'Alta' }, { v: 'EMERGENCIA', l: 'Urgente' },
];

/** Demo: controles da simulação para o menu "…" (só há ações enquanto uma simulação roda) e a folha que pede a gravidade. */
export function useControlesSimulacao(): { titulo?: string; acoes: SheetAction[]; sheet: React.ReactNode } {
  const { simulacao, iniciarSimulacao, pararSimulacao, retomarSimulacao, pularSimulacao, dispararOcorrencia } = useApp();
  const [escolhendo, setEscolhendo] = useState(false);
  const sheet = (
    <Sheet visible={escolhendo} onClose={() => setEscolhendo(false)} title="Disparar ocorrência" subtitle="Qual a gravidade?">
      <View style={s.row}>
        {GRAVIDADES.map((g) => <Chip key={g.v} label={g.l} selected={false} onPress={() => { setEscolhendo(false); dispararOcorrencia(g.v); }} />)}
      </View>
    </Sheet>
  );
  if (!simulacao) return { acoes: [], sheet };
  const { linha, t, estado } = simulacao;
  const acabou = estado.fase === 'FIM' || estado.fase === 'ENCERRADA';
  const espera = estado.fase === 'PREPARAR' || estado.fase === 'ESPERANDO';
  const podeOcorrer = !acabou && !espera && (linha.ocorrenciaEm === null || t < linha.ocorrenciaEm);
  const status = estado.esperandoRetomar ? 'Pausada por ocorrência' : estado.fase === 'EM_ROTA' && estado.parada ? 'Em rota · parada' : FASE[estado.fase];
  const acoes: SheetAction[] = [
    // Ida concluída: segue para a saída da escola, com os mesmos alunos, de volta para casa.
    ...(estado.fase === 'FIM' && linha.config.sentido === 'IDA'
      ? [{ label: 'Seguir para a saída da escola', onPress: () => iniciarSimulacao({ ...linha.config, sentido: 'VOLTA', ocorrenciaEmMs: undefined }) }] : []),
    ...(estado.esperandoRetomar ? [{ label: 'Retomar', onPress: retomarSimulacao }] : []),
    ...(espera ? [{ label: 'Pular para a saída', onPress: () => pularSimulacao('SAIDA') }] : []),
    ...(!acabou ? [{ label: 'Próxima parada', onPress: () => pularSimulacao('PARADA') }, { label: 'Ir para o fim', onPress: () => pularSimulacao('FIM') }] : []),
    ...(podeOcorrer ? [{ label: 'Disparar ocorrência', role: 'destructive' as const,
      onPress: () => (linha.config.ocorrencia ? dispararOcorrencia(linha.config.ocorrencia) : setEscolhendo(true)) }] : []),
    { label: 'Parar simulação', onPress: () => pararSimulacao() },
  ];
  return { titulo: `Simulação · ${status}`, acoes, sheet };
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
