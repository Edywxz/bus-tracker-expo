import { Stack } from 'expo-router';
import { tabRootOptions } from '../../../src/components/ds';

export default function Layout() {
  return <Stack screenOptions={tabRootOptions} />;
}
