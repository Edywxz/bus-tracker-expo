/** Texto do aviso ao motorista que toca em "Concluir rota": sempre pede confirmação, e alerta quando há pendências. */
export interface AvisoEncerrar { title: string; message: string; destructive: boolean }

const alunos = (n: number) => `${n} ${n === 1 ? 'aluno' : 'alunos'}`;

export function avisoEncerrar(status: string[]): AvisoEncerrar {
  const ativos = status.filter((s) => s !== 'AUSENTE');
  const aguardando = ativos.filter((s) => s === 'AGUARDANDO').length;
  const aBordo = ativos.filter((s) => s === 'EMBARCADO').length;
  const entregues = ativos.filter((s) => s === 'DESEMBARCADO').length;
  if (!ativos.length) return { title: 'Encerrar rota sem passageiros?', message: 'Nenhum aluno estava previsto nesta rota.', destructive: true };
  if (aBordo) {
    const resto = aguardando ? ` E ${alunos(aguardando)} ainda ${aguardando === 1 ? 'espera' : 'esperam'} para embarcar.` : '';
    return { title: `Ainda há ${alunos(aBordo)} a bordo`, message: `${aBordo === 1 ? 'Embarcou' : 'Embarcaram'} e não ${aBordo === 1 ? 'foi desembarcado' : 'foram desembarcados'}.${resto} Encerrar mesmo assim?`, destructive: true };
  }
  if (!entregues) return { title: 'Nenhum passageiro embarcou', message: `${alunos(aguardando)} ainda ${aguardando === 1 ? 'aguarda' : 'aguardam'} embarque. Encerrar mesmo assim?`, destructive: true };
  if (aguardando) return { title: aguardando === 1 ? 'Falta 1 aluno para embarcar' : `Faltam ${alunos(aguardando)} para embarcar`, message: `${entregues === 1 ? '1 já foi entregue' : `${entregues} já foram entregues`}. Encerrar mesmo assim?`, destructive: true };
  return { title: 'Encerrar a rota?', message: `${entregues === 1 ? 'O aluno foi entregue' : `Todos os ${entregues} alunos foram entregues`}.`, destructive: false };
}
