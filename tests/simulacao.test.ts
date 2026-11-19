import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarSimulacao, estadoEm, alvoDoPulo, type ConfigSim, type EventoSim, type Linha } from '../src/services/simulacao.ts';

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
  assert.deepEqual([b.fase, b.hora, b.viagem], ['ESPERANDO', [6, 45], 'AGENDADA']);
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
