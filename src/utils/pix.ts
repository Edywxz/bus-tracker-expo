/**
 * PIX "copia e cola" estático (BR Code / padrão EMV-MPM do Banco Central).
 * Gera o texto que qualquer app de banco aceita para pagar uma chave PIX com valor preenchido.
 * Referência: Manual de Padrões para Iniciação do Pix (BCB) — campos 00, 26, 52, 53, 54, 58, 59, 60, 62 e 63 (CRC16).
 */

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .\-/]/g, '').trim();

function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF), exigido no campo 63. */
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixParams {
  chave: string;
  /** Nome de quem recebe (até 25 caracteres, sem acentos). */
  nome: string;
  /** Cidade de quem recebe (até 15 caracteres). */
  cidade?: string;
  valor?: number;
  /** Identificador da cobrança (até 25 caracteres alfanuméricos). */
  txid?: string;
}

/** Monta o PIX copia e cola. Retorna null se não houver chave. */
export function pixCopiaECola({ chave, nome, cidade = 'BRASIL', valor, txid }: PixParams): string | null {
  const k = chave.trim();
  if (!k) return null;
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', k);
  const id = (txid ? semAcento(txid).replace(/[^A-Za-z0-9]/g, '') : '').slice(0, 25) || '***';
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor && valor > 0 ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', (semAcento(nome) || 'RECEBEDOR').slice(0, 25).toUpperCase()) +
    campo('60', (semAcento(cidade) || 'BRASIL').slice(0, 15).toUpperCase()) +
    campo('62', campo('05', id)) +
    '6304';
  return corpo + crc16(corpo);
}
