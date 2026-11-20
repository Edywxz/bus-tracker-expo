import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarSimulacao, estadoEm, alvoDoPulo, visaoDoResponsavel, type ConfigSim, type EventoSim, type Linha } from '../src/services/simulacao.ts';

const TODOS = ['aluno-1', 'aluno-2', 'aluno-3', 'aluno-4', 'aluno-5'];
const ida = (alunoIds = TODOS): ConfigSim => ({ sentido: 'IDA', alunoIds, ocorrencia: null });
const volta = (alunoIds = TODOS): ConfigSim => ({ sentido: 'VOLTA', alunoIds, ocorrencia: null });

type Parada = Extract<EventoSim, { tipo: 'PARADA' }>;
const paradas = (l: Linha) => l.eventos.filter((e): e is Parada => e.tipo === 'PARADA');
const lugares = (l: Linha) => paradas(l).map((p) => p.lugar);

test('ida com todos: paradas na ordem da rota', () => {
  assert.deepEqual(lugares(montarSimulacao(ida())), ['beatriz', 'sofia', 'gabriel', 'lucas', 'ana', 'santaMaria', 'aurora']);
});

test('ida: primeira casa em ~10 s depois da saída', () => {
  const dt = paradas(montarSimulacao(ida()))[0].t - 6000;
  assert.ok(dt >= 9000 && dt <= 11000, `levou ${dt} ms`);
});

test('ida: perna curta dura no mínimo 6 s e a perna até a escola no mínimo 15 s', () => {
  const p = paradas(montarSimulacao(ida()));
  const perna = (de: string, para: string) => {
    const a = p.find((x) => x.lugar === de)!, b = p.find((x) => x.lugar === para)!;
    return b.t - a.t - 4000; // 4 s parado em cada parada
  };
  assert.equal(perna('lucas', 'ana'), 6000); // 0,79 km daria 3,5 s
  assert.equal(perna('ana', 'santaMaria'), 15000); // 0,73 km daria 3,3 s
});

test('subconjuntos: só as paradas dos alunos escolhidos e as escolas deles', () => {
  assert.deepEqual(lugares(montarSimulacao(ida(['aluno-1', 'aluno-5']))), ['lucas', 'ana', 'santaMaria', 'aurora']);
  assert.deepEqual(lugares(montarSimulacao(ida(['aluno-5']))), ['ana', 'aurora']);
  assert.deepEqual(lugares(montarSimulacao(ida(['aluno-2']))), ['beatriz', 'santaMaria']);
});

test('volta: começa na escola e percorre a rota ao contrário', () => {
  const l = montarSimulacao(volta());
  assert.deepEqual(lugares(l), ['aurora', 'santaMaria', 'ana', 'lucas', 'gabriel', 'sofia', 'beatriz']);
  assert.equal(paradas(l)[0].t, 6000);
  assert.ok(l.segmentos.filter((s) => s.de !== s.para).every((s) => s.de > s.para));
});

test('estadoEm: fases e relógio antes e depois da saída', () => {
  const l = montarSimulacao(ida());
  const a = estadoEm(l, 0), b = estadoEm(l, 3000), c = estadoEm(l, 6000);
  assert.deepEqual([a.fase, a.hora, a.viagem], ['PREPARAR', [6, 30], 'AGENDADA']);
  assert.deepEqual([b.fase, b.hora, b.viagem], ['ESPERANDO', [6, 55], 'AGENDADA']); // depois das 06:45, senão o lembrete ainda diz "hora de preparar"
  assert.deepEqual([c.fase, c.hora, c.viagem], ['EM_ROTA', [6, 50], 'EM_ANDAMENTO']);
});

test('estadoEm: embarca na casa e entrega na escola; quem ficou fora é ausente', () => {
  const l = montarSimulacao(ida(['aluno-1', 'aluno-2']));
  const emb = l.eventos.find((e) => e.tipo === 'EMBARQUE' && e.alunoId === 'aluno-2')!;
  assert.equal(estadoEm(l, emb.t - 1).statusAluno['aluno-2'], 'AGUARDANDO');
  assert.equal(estadoEm(l, emb.t).statusAluno['aluno-2'], 'EMBARCADO');
  assert.equal(estadoEm(l, 0).statusAluno['aluno-3'], 'AUSENTE');
  const fim = estadoEm(l, l.duracaoMs);
  assert.deepEqual([fim.statusAluno['aluno-1'], fim.statusAluno['aluno-2']], ['DESEMBARCADO', 'DESEMBARCADO']);
  assert.deepEqual([fim.fase, fim.viagem, fim.progresso, fim.kmRestantes], ['FIM', 'CONCLUIDA', 1, 0]);
});

test('estadoEm: "van chegando" 3 s antes da casa e só uma vez', () => {
  const l = montarSimulacao(ida());
  const casa = paradas(l).find((p) => p.lugar === 'beatriz')!;
  const ev = l.eventos.filter((e) => e.tipo === 'CHEGANDO' && e.alunoId === 'aluno-2');
  assert.equal(ev.length, 1);
  assert.equal(ev[0].t, casa.t - 3000);
  const n = estadoEm(l, l.duracaoMs).notificacoes.filter((x) => x.tipo === 'CHEGANDO' && x.alunoId === 'aluno-2');
  assert.equal(n.length, 1);
  assert.match(n[0].mensagem, /Beatriz/);
});

test('estadoEm: mesmo instante dá o mesmo estado e a van só anda no sentido da viagem', () => {
  for (const cfg of [ida(), volta()]) {
    const l = montarSimulacao(cfg);
    assert.deepEqual(estadoEm(l, 20000), estadoEm(l, 20000));
    let anterior = estadoEm(l, 0).indice;
    for (let t = 0; t <= l.duracaoMs; t += 500) {
      const i = estadoEm(l, t).indice;
      assert.ok(cfg.sentido === 'IDA' ? i >= anterior : i <= anterior, `${cfg.sentido} voltou de ${anterior} para ${i} em ${t}`);
      anterior = i;
    }
  }
});

test('alvoDoPulo: saída, próxima parada e fim', () => {
  const l = montarSimulacao(ida());
  const p = paradas(l);
  assert.equal(alvoDoPulo(l, 0, 'SAIDA'), 6000);
  assert.equal(alvoDoPulo(l, 7000, 'PARADA'), p[0].t);
  assert.equal(alvoDoPulo(l, p[0].t, 'PARADA'), p[1].t);
  assert.equal(alvoDoPulo(l, p[p.length - 1].t + 1, 'PARADA'), l.duracaoMs);
  assert.equal(alvoDoPulo(l, 0, 'FIM'), l.duracaoMs);
});

test('montarSimulacao lança sem alunos', () => {
  assert.throws(() => montarSimulacao(ida([])));
});

// ---- ocorrência por gravidade ----
// 31000 ms cai no meio da perna sofia→gabriel (12,9 s de estrada), então anda de verdade antes e depois.
const T = 31000;
const normal = montarSimulacao(ida());
const comOcorr = (g: 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA', em: number | undefined = T) =>
  montarSimulacao({ ...ida(), ocorrencia: g, ocorrenciaEmMs: em });

test('sem ocorrência: ocorrenciaEm e pausaManualEm são null', () => {
  assert.equal(normal.ocorrenciaEm, null);
  assert.equal(normal.pausaManualEm, null);
});

test('ocorrência sem horário cai na metade da viagem', () => {
  const l = montarSimulacao({ ...ida(), ocorrencia: 'MEDIA' });
  assert.equal(l.ocorrenciaEm, Math.floor(normal.duracaoMs / 2));
});

test('BAIXA: janela de 7,5 s de estrada leva 15 s, à metade da velocidade', () => {
  const l = comOcorr('BAIXA');
  assert.equal(l.ocorrenciaEm, T);
  assert.equal(l.duracaoMs, normal.duracaoMs + 7500);
  assert.equal(estadoEm(l, T + 15000).indice, estadoEm(normal, T + 7500).indice);
  assert.equal(estadoEm(l, T + 7500).indice, estadoEm(normal, T + 3750).indice);
  assert.equal(l.pausaManualEm, null);
});

test('MEDIA: para 10 s e segue como se nada tivesse acontecido', () => {
  const l = comOcorr('MEDIA');
  assert.equal(l.duracaoMs, normal.duracaoMs + 10000);
  assert.equal(estadoEm(l, T + 5000).parada, true);
  assert.equal(estadoEm(l, T + 5000).indice, estadoEm(l, T).indice);
  assert.equal(estadoEm(l, T + 11000).parada, false);
  assert.equal(estadoEm(l, 50000).indice, estadoEm(normal, 40000).indice);
});

test('ALTA: espera o usuário retomar, sem mudar a duração', () => {
  const l = comOcorr('ALTA');
  assert.equal(l.pausaManualEm, T);
  assert.equal(l.duracaoMs, normal.duracaoMs);
  assert.equal(estadoEm(l, T).esperandoRetomar, true);
  assert.equal(estadoEm(l, T - 1).esperandoRetomar, false);
  assert.equal(estadoEm(l, T + 1).esperandoRetomar, false);
});

test('EMERGENCIA: a viagem encerra e quem estava a bordo continua a bordo', () => {
  const l = comOcorr('EMERGENCIA', 50000);
  assert.equal(l.duracaoMs, 50000);
  assert.equal(l.eventos[l.eventos.length - 1].tipo, 'ENCERRADA');
  assert.ok(l.eventos.every((e) => e.t <= 50000));
  const fim = estadoEm(l, l.duracaoMs);
  assert.deepEqual([fim.fase, fim.viagem], ['ENCERRADA', 'CONCLUIDA']);
  assert.equal(fim.statusAluno['aluno-2'], 'EMBARCADO');
  assert.ok(Object.values(fim.statusAluno).every((s) => s !== 'DESEMBARCADO'));
});

test('toda ocorrência avisa os responsáveis com o rótulo da gravidade', () => {
  const rotulos = { BAIXA: 'Trânsito intenso', MEDIA: 'Desvio de via', ALTA: 'Pane mecânica', EMERGENCIA: 'Acidente na pista' } as const;
  for (const g of Object.keys(rotulos) as (keyof typeof rotulos)[]) {
    const l = comOcorr(g);
    assert.equal(estadoEm(l, T - 1).notificacoes.some((n) => n.tipo === 'EMERGENCIA'), false);
    const e = estadoEm(l, T);
    const n = e.notificacoes.find((x) => x.tipo === 'EMERGENCIA');
    assert.equal(n?.titulo, `Alerta de rota: ${rotulos[g]}`);
    assert.equal(e.ocorrencia, g);
  }
});

test('a ocorrência não altera nada que aconteceu antes dela', () => {
  for (const g of ['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as const) {
    const antes = (l: Linha) => l.eventos.filter((e) => e.t < T && e.tipo !== 'OCORRENCIA');
    assert.deepEqual(antes(comOcorr(g)), antes(normal));
  }
});

test('ocorrência antes da saída só vale a partir da saída (não quebra a linha do tempo)', () => {
  for (const g of ['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as const) {
    for (const sentido of ['IDA', 'VOLTA'] as const) {
      const l = montarSimulacao({ sentido, alunoIds: TODOS, ocorrencia: g, ocorrenciaEmMs: 0 });
      assert.equal(l.ocorrenciaEm, 6000, `${g} ${sentido}`);
      for (const t of [0, 3000, 6000, l.duracaoMs]) assert.doesNotThrow(() => estadoEm(l, t), `${g} ${sentido} t=${t}`);
    }
  }
});

// ---- visão do responsável: fim da corrida e paradas anteriores ----
const desemb = (l: Linha, alunoId: string) => l.eventos.find((e) => e.tipo === 'DESEMBARQUE' && e.alunoId === alunoId)!.t;
const fimDe = (l: Linha) => l.eventos.find((e) => e.tipo === 'FIM')!.t;

test('volta: a corrida do responsável acaba quando o filho desembarca, antes do fim da rota', () => {
  const l = montarSimulacao(volta(['aluno-1', 'aluno-2', 'aluno-3']));
  const t = desemb(l, 'aluno-1');
  assert.ok(t < fimDe(l), 'a van ainda tem paradas depois');
  assert.equal(visaoDoResponsavel(l, t - 1, ['aluno-1']).concluida, false);
  assert.equal(visaoDoResponsavel(l, t, ['aluno-1']).concluida, true);
});

test('com dois filhos, só conclui quando o último desembarca', () => {
  const l = montarSimulacao(ida());
  const meus = ['aluno-1', 'aluno-5'];
  const t = Math.max(desemb(l, 'aluno-1'), desemb(l, 'aluno-5'));
  assert.equal(visaoDoResponsavel(l, desemb(l, 'aluno-1'), meus).concluida, desemb(l, 'aluno-5') <= desemb(l, 'aluno-1'));
  assert.equal(visaoDoResponsavel(l, t - 1, meus).concluida, false);
  assert.equal(visaoDoResponsavel(l, t, meus).concluida, true);
});

test('sem filho na viagem, a corrida nunca conclui para o responsável', () => {
  const l = montarSimulacao(ida(['aluno-2']));
  assert.equal(visaoDoResponsavel(l, l.duracaoMs, ['aluno-1']).concluida, false);
});

test('ida: as paradas antes da casa do filho aparecem anônimas e o que vem depois da última própria some', () => {
  const l = montarSimulacao(ida());
  const v = visaoDoResponsavel(l, 0, ['aluno-1']);
  assert.deepEqual(v.paradas.map((p) => p.propria), [false, false, false, true, false, true]); // beatriz sofia gabriel LUCAS ana SANTA MARIA
  assert.equal(v.paradas.at(-1)!.rotulo.includes('Aurora'), false);
  assert.ok(v.paradas.filter((p) => !p.propria).every((p) => p.rotulo === 'Parada de outro passageiro'));
});

test('paradas ficam feitas conforme a van chega', () => {
  const l = montarSimulacao(ida());
  const chegada = (lugar: string) => paradas(l).find((p) => p.lugar === lugar)!.t;
  const v = visaoDoResponsavel(l, chegada('sofia'), ['aluno-1']);
  assert.deepEqual(v.paradas.map((p) => p.feita), [true, true, false, false, false, false]);
});

test('a visão do responsável não vaza nome nem id de outro aluno', () => {
  const l = montarSimulacao(ida());
  const json = JSON.stringify(visaoDoResponsavel(l, l.duracaoMs, ['aluno-1']));
  for (const x of ['Beatriz', 'Gabriel', 'Sofia', 'Ana', 'aluno-2', 'aluno-3', 'aluno-4', 'aluno-5']) assert.equal(json.includes(x), false, x);
});

test('só filhos próprios: todas as paradas são do responsável', () => {
  const l = montarSimulacao(ida(['aluno-1', 'aluno-5']));
  assert.ok(visaoDoResponsavel(l, 0, ['aluno-1', 'aluno-5']).paradas.every((p) => p.propria));
});
