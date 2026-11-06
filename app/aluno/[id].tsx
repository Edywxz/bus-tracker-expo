import { useLocalSearchParams } from 'expo-router';
import { StudentDetailScreen } from '../../src/screens/DetailScreens';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StudentDetailScreen id={id} />;
}
