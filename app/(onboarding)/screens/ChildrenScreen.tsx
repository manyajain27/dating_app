import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ScreenProps } from '../types/FormData';

const OPTIONS = [
  'i want kids',
  'i don’t want kids',
  'i have kids',
  'i don’t have kids but open to it',
  'not sure yet',
];

const ChildrenScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState(formData.children || '');

  const handleSelect = (choice: string) => {
    setSelected(choice);
  };

  const handleContinue = () => {
    if (selected) {
      updateFormData('children', selected);
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Text style={styles.heading}>kids — what's your take?</Text>
        <Text style={styles.subtext}>just so we’re on the same page.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)} style={styles.optionsContainer}>
        {OPTIONS.map((option) => {
          const isActive = selected === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, isActive && styles.optionActive]}
              onPress={() => handleSelect(option)}
            >
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
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
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 24,
    justifyContent: 'center',
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
  optionsContainer: {
    gap: 14,
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: '#1c1c1c',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    textTransform: 'lowercase',
  },
  optionTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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

export default ChildrenScreen;
