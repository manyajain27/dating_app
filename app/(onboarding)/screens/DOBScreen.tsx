// File: screens/DOBScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenProps } from '../types/FormData';

const DOBScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [date, setDate] = useState(formData.dob ? new Date(formData.dob) : new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
    updateFormData('dob', currentDate.toISOString());
  };

  const handleContinue = () => {
    if (date) {
      updateFormData('dob', date.toISOString());
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>when were you born?</Text>
      <Text style={styles.subtext}>just for legal reasons, promise.</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>
          {formData.dob ? new Date(formData.dob).toDateString() : 'pick a date'}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
      <TouchableOpacity style={[styles.button, formData.dob && styles.buttonActive]} onPress={handleContinue}>
        <Text style={styles.buttonText}>continue</Text>
      </TouchableOpacity>
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
  dateButton: {
    backgroundColor: '#1c1c1c',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.3,
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
  }
});

export default DOBScreen;