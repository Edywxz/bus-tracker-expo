import { useLocalSearchParams } from 'expo-router';
import { PinScreen } from '../src/screens/PinScreen';

export default function Pino() {
  const { alunoId, tipo } = useLocalSearchParams<{ alunoId?: string; tipo?: string }>();
  return <PinScreen alunoId={alunoId} tipo={tipo} />;
}
