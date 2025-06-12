// File: screens/NameScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenProps } from '../types/FormData';

const NameScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [name, setName] = useState(formData.name);

  const handleNext = () => {
    if (name.trim().length > 0) {
      updateFormData('name', name.trim());
      nextStep();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.heading}>let's start simple. what's your name?</Text>
      <TextInput
        style={styles.input}
        placeholder="type your first name here"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />
      <TouchableOpacity style={[styles.button, name.trim().length > 0 && styles.buttonActive]} onPress={handleNext}>
        <Text style={styles.buttonText}>continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 20,
    fontWeight: '700',
    textTransform: 'lowercase',
    letterSpacing: -0.5,
  },
  input: {
    backgroundColor: '#1b1b1b',
    padding: 18,
    borderRadius: 18,
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  button: {
    backgroundColor: '#1b1b1b',
    paddingVertical: 18,
    borderRadius: 18,
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
    letterSpacing: 0.5,
  }
});

export default NameScreen;
