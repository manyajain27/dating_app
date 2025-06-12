// File: screens/EducationScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ScreenProps } from '../types/FormData';

const options = [
  'high school',
  'undergraduate degree',
  'postgraduate degree',
  'phd or doctorate',
  'still studying',
  'prefer not to say'
];

const EducationScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState(formData.education);

  const handleSelect = (value: string) => {
    setSelected(value);
    updateFormData('education', value);
  };

  const handleContinue = () => {
    if (selected) nextStep();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Text style={styles.heading}>what’s your education level?</Text>
        <Text style={styles.subtext}>doesn't really matter, just for the record.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
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
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <TouchableOpacity
          style={[styles.button, selected && styles.buttonActive]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0a0a0a',
  },
  heading: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  optionSelected: {
    borderColor: '#ffffff',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 15,
    textTransform: 'lowercase',
  },
  button: {
    marginTop: 36,
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

export default EducationScreen;
