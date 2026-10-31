/**
 * Módulo de Segurança, Privacidade e LGPD (RNF001, RNF006)
 * Realiza mascaramento de dados sensíveis de menores e responsáveis
 * e validações de documentos brasileiros.
 */

export class SecurityService {
  /**
   * Mascara CPF para conformidade com a LGPD (ex: 123.***.***-45)
   */
  static maskCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.***.***-${clean.slice(9, 11)}`;
  }

  /**
   * Mascara telefone mantendo DDD e dígitos finais (ex: (11) 9****-1234)
   */
  static maskPhone(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return phone;
    const ddd = clean.slice(0, 2);
    const last4 = clean.slice(-4);
    return `(${ddd}) 9****-${last4}`;
  }

  /**
   * Mascara número de cartão de crédito exibindo apenas os últimos 4 dígitos
   */
  static maskCreditCard(cardNumber: string): string {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const clean = cardNumber.replace(/\D/g, '');
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }

  /**
   * Formata valor monetário para Real Brasileiro (BRL)
   */
  static formatCurrency(value: number): string {
    return (
      'R$ ' +
      value
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    );
  }

  /**
   * Formata data ISO para padrão brasileiro (DD/MM/AAAA ou DD/MM/AAAA HH:mm)
   */
  static formatDate(isoString: string, includeTime = false): string {
    if (!isoString) return '--/--/----';
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      if (!includeTime) {
        return `${day}/${month}/${year}`;
      }
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  }

  /**
   * Valida formato simples de CPF (11 dígitos numéricos)
   */
  static isValidCpf(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    return clean.length === 11 && !/^(\d)\1{10}$/.test(clean);
  }

  /**
   * Valida placa automotiva no padrão Mercosul ou antigo
   */
  static isValidPlaca(placa: string): boolean {
    const clean = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean);
  }

  /**
   * Gera hash de autenticidade para o recibo digital (RF012)
   */
  static generateReceiptHash(pagamentoId: string, valor: number, data: string): string {
    const raw = `${pagamentoId}-${valor.toFixed(2)}-${data}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `REC-${hex}-${Date.now().toString(16).slice(-4).toUpperCase()}`;
  }
}

