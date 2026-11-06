import { router } from 'expo-router';

/** Rotas do app (Expo Router). Telas de detalhe ficam no Stack raiz, acima das abas. */
export const go = {
  student: (id: string) => router.push({ pathname: '/aluno/[id]', params: { id } }),
  contract: (alunoId: string) => router.push({ pathname: '/contrato/[alunoId]', params: { alunoId } }),
  payment: (id: string) => router.push({ pathname: '/mensalidade/[id]', params: { id } }),
  vehicle: () => router.push('/veiculo'),
  school: () => router.push('/escola'),
  calendar: () => router.push('/calendario'),
  privacy: () => router.push('/privacidade'),
};
