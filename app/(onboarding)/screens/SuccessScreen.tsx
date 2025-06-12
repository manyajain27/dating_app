import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { router } from 'expo-router';

interface SuccessScreenProps {
  formData: {
    name: string;
  };
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ formData }) => {
  const handleStartMatching = () => {
    router.replace('/(tabs)/swipe');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Check color="black" size={48} />
      </View>
      <Text style={styles.title}>all set, {formData.name}</Text>
      <Text style={styles.subtitle}>your profile is ready to go. have fun and be respectful.</Text>
      <TouchableOpacity onPress={handleStartMatching} style={styles.button}>
        <Text style={styles.buttonText}>start matching</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 32, color: '#EFEFEF', fontWeight: '400', textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: '80%',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 48,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: 'black' },
});

export default SuccessScreen;
