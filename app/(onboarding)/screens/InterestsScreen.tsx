import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ScreenProps } from '../types/FormData';

const INTEREST_OPTIONS = [
  'music', 'movies', 'reading', 'fitness', 'travel',
  'photography', 'art', 'fashion', 'gaming', 'foodie',
  'dancing', 'yoga', 'nature', 'pets', 'memes'
];

const MAX_SELECTION = 5;

const InterestsScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState<string[]>(formData.interests || []);

  const toggleInterest = (interest: string) => {
    const alreadySelected = selected.includes(interest);

    if (alreadySelected) {
      setSelected((prev) => prev.filter((item) => item !== interest));
    } else if (selected.length < MAX_SELECTION) {
      setSelected((prev) => [...prev, interest]);
    }
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      updateFormData('interests', selected);
      nextStep();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Text style={styles.heading}>what are you into?</Text>
        <Text style={styles.subtext}>pick up to 5. helps break the ice.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)} style={styles.chipGrid}>
        {INTEREST_OPTIONS.map((item) => {
          const isActive = selected.includes(item);
          const isDisabled = !isActive && selected.length >= MAX_SELECTION;

          return (
            <TouchableOpacity
              key={item}
              onPress={() => toggleInterest(item)}
              disabled={isDisabled}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isDisabled && styles.chipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
        <TouchableOpacity
          style={[styles.button, selected.length > 0 && styles.buttonActive]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>done</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 24,
    paddingTop: 90,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  chip: {
    backgroundColor: '#1c1c1c',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 12,
  },
  chipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 14,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
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

export default InterestsScreen;
