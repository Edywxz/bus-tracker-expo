import { useLocalSearchParams } from 'expo-router';
import { PaymentDetailScreen } from '../../src/screens/DetailScreens';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PaymentDetailScreen id={id} />;
}
