import { useLocalSearchParams } from 'expo-router';
import { ContractScreen } from '../../src/screens/DetailScreens';

export default function Route() {
  const { alunoId } = useLocalSearchParams<{ alunoId: string }>();
  return <ContractScreen alunoId={alunoId} />;
}
