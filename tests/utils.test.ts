import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pixCopiaECola } from '../src/utils/pix.ts';
import { distanciaKm, pontoDeDescida, primeiroAChegar } from '../src/utils/proximidade.ts';
import { diaLetivo, lembrete } from '../src/utils/lembrete.ts';
import { lerLinkAuth } from '../src/utils/authLink.ts';
import { urlDoSite } from '../src/utils/siteUrl.ts';

// CRC16-CCITT independente da implementação (vetor padrão: "123456789" -> 29B1)
const crc = (s: string) => {
  let c = 0xffff;
  for (const ch of s) { c ^= ch.charCodeAt(0) << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; }
  return c.toString(16).toUpperCase().padStart(4, '0');
};

test('crc de referência', () => assert.equal(crc('123456789'), '29B1'));

test('pix: sem chave devolve null', () => assert.equal(pixCopiaECola({ chave: ' ', nome: 'X' }), null));

test('pix: campos, valor e CRC válidos', () => {
  const p = pixCopiaECola({ chave: 'marcos@exemplo.com', nome: 'Márcos da Silva', valor: 350, txid: 'ab-12' })!;
  assert.ok(p.startsWith('000201'));
  assert.ok(p.includes('br.gov.bcb.pix0118marcos@exemplo.com'));
  assert.ok(p.includes('5406350.00'));
  assert.ok(p.includes('MARCOS DA SILVA'));
  assert.ok(p.includes('0504ab12'));
  assert.equal(p.slice(-4), crc(p.slice(0, -4)));
});

test('distância: mesmo ponto = 0, ~111 km por grau de latitude', () => {
  assert.equal(distanciaKm({ latitude: 1, longitude: 1 }, { latitude: 1, longitude: 1 }), 0);
  const d = distanciaKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
  assert.ok(Math.abs(d - 111.19) < 0.1);
});

test('ponto de descida: ida usa entrega (ou casa), volta usa casa', () => {
  const a = { statusEmbarque: 'EMBARCADO', latitude: 1, longitude: 1, entrega_latitude: 2, entrega_longitude: 2 };
  assert.deepEqual(pontoDeDescida(a, 'IDA'), { latitude: 2, longitude: 2 });
  assert.deepEqual(pontoDeDescida(a, 'VOLTA'), { latitude: 1, longitude: 1 });
  assert.deepEqual(pontoDeDescida({ ...a, entrega_latitude: null }, 'IDA'), { latitude: 1, longitude: 1 });
  assert.equal(pontoDeDescida({ statusEmbarque: 'X' }, 'VOLTA'), null);
});

test('primeiro a chegar: só embarcados, o mais próximo; null sem coordenadas', () => {
  const van = { latitude: 0, longitude: 0 };
  const longe = { statusEmbarque: 'EMBARCADO', latitude: 0, longitude: 1, id: 'longe' };
  const perto = { statusEmbarque: 'EMBARCADO', latitude: 0, longitude: 0.1, id: 'perto' };
  const fora = { statusEmbarque: 'AGUARDANDO', latitude: 0, longitude: 0.01, id: 'fora' };
  assert.equal(primeiroAChegar(van, [longe, perto, fora], 'VOLTA')!.aluno.id, 'perto');
  assert.equal(primeiroAChegar(van, [{ statusEmbarque: 'EMBARCADO' }], 'VOLTA'), null);
});

// 2026-11-09 é segunda-feira; 2026-11-08 é domingo
const seg = (h: number, m = 0) => new Date(2026, 10, 9, h, m);

test('dia letivo: fim de semana e feriado não contam', () => {
  assert.equal(diaLetivo(seg(8), []), true);
  assert.equal(diaLetivo(new Date(2026, 10, 8, 8), []), false);
  assert.equal(diaLetivo(seg(8), [{ data: '2026-11-09', tipo: 'FERIADO' }]), false);
  assert.equal(diaLetivo(seg(8), [{ data: '2026-11-09', tipo: 'REUNIAO' }]), true);
});

const base = { eventos: [], emRota: false, tipo: 'IDA' as const, concluida: false, kmVan: null };
const ana = { nome: 'Ana Souza', turno: 'MANHA' as const, statusEmbarque: 'AGUARDANDO' };

test('lembrete: antes da rota avisa o horário; depois da entrada some', () => {
  assert.equal(lembrete({ ...base, agora: seg(4), alunos: [ana] })!.tone, 'info');
  assert.equal(lembrete({ ...base, agora: seg(6, 30), alunos: [ana] })!.tone, 'warning');
  assert.equal(lembrete({ ...base, agora: seg(8), alunos: [ana] }), null);
  assert.equal(lembrete({ ...base, agora: new Date(2026, 10, 8, 6), alunos: [ana] }), null);
});

test('lembrete: em rota perto da parada manda esperar no portão', () => {
  const l = lembrete({ ...base, agora: seg(7), alunos: [ana], emRota: true, kmVan: 0.4 })!;
  assert.equal(l.tone, 'warning');
  assert.ok(l.texto.includes('Ana'));
});

test('lembrete: volta com aluno a bordo avisa o responsável', () => {
  const l = lembrete({ ...base, agora: seg(12, 30), alunos: [{ ...ana, statusEmbarque: 'EMBARCADO' }], emRota: true, tipo: 'VOLTA', kmVan: 2 })!;
  assert.ok(l.texto.includes('voltando com Ana'));
});

test('link de confirmação: lê os tokens do fragmento', () => {
  const l = lerLinkAuth('vanescolar://#access_token=AAA&refresh_token=RRR&expires_in=3600&type=signup')!;
  assert.deepEqual(l.sessao, { accessToken: 'AAA', refreshToken: 'RRR' });
  assert.equal(l.tipo, 'signup');
});

test('link de confirmação: sem fragmento ou sem tokens é ignorado', () => {
  assert.equal(lerLinkAuth('vanescolar://aluno/1'), null);
  assert.equal(lerLinkAuth('vanescolar://#type=signup'), null);
});

test('link de confirmação: link expirado vira mensagem de erro, sem sessão', () => {
  const l = lerLinkAuth('vanescolar://#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')!;
  assert.ok(l.erro!.includes('expirou'));
  assert.equal(l.sessao, undefined);
});

test('urlDoSite: junta base e caminho com exatamente uma barra', () => {
  const p = 'https://edywxz.github.io/bus-tracker-expo/';
  assert.equal(urlDoSite('confirmado/'), `${p}confirmado/`);
  assert.equal(urlDoSite('confirmado/', 'https://x.dev/app'), 'https://x.dev/app/confirmado/');
  assert.equal(urlDoSite('confirmado/', 'https://x.dev/app/'), 'https://x.dev/app/confirmado/');
  assert.equal(urlDoSite('/redefinir-senha/'), `${p}redefinir-senha/`);
  assert.equal(urlDoSite('confirmado/', ''), `${p}confirmado/`);
});
