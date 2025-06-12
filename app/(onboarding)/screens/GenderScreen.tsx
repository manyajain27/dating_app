// File: screens/GenderScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { ScreenProps } from '../types/FormData';

const options = ['man', 'woman', 'non-binary', 'prefer not to say'];

const GenderScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState(formData.gender);

  const handleSelect = (value: string) => {
    setSelected(value);
    updateFormData('gender', value);
  };

  const handleContinue = () => {
    if (selected) nextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>how do you identify?</Text>
        <Text style={styles.subtext}>just being respectful here.</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.option, selected === item && styles.optionSelected]}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, selected && styles.buttonActive]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100, // Add top padding to avoid back button
    paddingBottom: 40,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 26,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
    textTransform: 'lowercase',
  },
  option: {
    backgroundColor: '#1c1c1c',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  optionSelected: {
    borderColor: '#ffffff',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    textTransform: 'lowercase',
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
    opacity: 0.4,
  },
  buttonActive: {
    opacity: 1,
    borderColor: '#ffffff',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
});

export default GenderScreen;