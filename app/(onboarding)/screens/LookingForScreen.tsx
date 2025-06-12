// File: screens/LookingForScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ScreenProps } from '../types/FormData';

const options = [
  'something long term',
  'situationships',
  'friends with benefits',
  'short term fun',
  'one night only',
  'still figuring it out'
];

const LookingForScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState<string[]>(formData.lookingFor || []);

  const toggleSelect = (item: string) => {
    if (selected.includes(item)) {
      const newList = selected.filter((v) => v !== item);
      setSelected(newList);
      updateFormData('lookingFor', newList);
    } else {
      const newList = [...selected, item];
      setSelected(newList);
      updateFormData('lookingFor', newList);
    }
  };

  const handleContinue = () => {
    if (selected.length > 0) nextStep();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Text style={styles.heading}>what are you looking for?</Text>
        <Text style={styles.subtext}>hookups? heart stuff? or just winging it?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.option, selected.includes(item) && styles.optionSelected]}
              onPress={() => toggleSelect(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <TouchableOpacity
          style={[styles.button, selected.length > 0 && styles.buttonActive]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>i’m into this</Text>
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
    backgroundColor: '#2b2b2b',
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

export default LookingForScreen;