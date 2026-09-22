import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Text, View } from 'react-native';
import { METROS } from '@parity/shared';

/** Phase 0 placeholder. Onboarding, share extension, Result Card, Playbook, My Checks, Demo Mode arrive in Phase 1. */
export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontSize: 24, fontWeight: '600' }}>Parity</Text>
        <Text>Check this price. Get the better price.</Text>
        <Text style={{ marginTop: 12, color: '#666' }}>
          Pilot metros:{' '}
          {Object.values(METROS)
            .map((m) => m.name)
            .join(', ')}
        </Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
