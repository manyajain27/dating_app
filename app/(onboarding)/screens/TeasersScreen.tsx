import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ScreenProps, TEASER_CATEGORIES, TeaserCategory } from '../types/FormData';

const TeasersScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [activeCategory, setActiveCategory] = useState(TEASER_CATEGORIES[0].id);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(Object.keys(formData.teasers || {}));
  const [answers, setAnswers] = useState<Record<string, string>>(formData.teasers || {});

  const togglePrompt = (prompt: string) => {
    setSelectedPrompts((prev) =>
      prev.includes(prompt) ? prev.filter(p => p !== prompt) : [...prev, prompt]
    );
  };

  const handleInputChange = (prompt: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [prompt]: text }));
  };

  const handleContinue = () => {
    const filled = Object.entries(answers).filter(([k, v]) => selectedPrompts.includes(k) && v.trim());
    if (filled.length > 0) {
      const result = filled.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      updateFormData('teasers', result);
      nextStep();
    }
  };

  const currentCategory: TeaserCategory = TEASER_CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Text style={styles.heading}>answer a few, be unforgettable.</Text>
        <Text style={styles.subtext}>pick prompts you vibe with and write your take.</Text>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.tabs}>
        {TEASER_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setActiveCategory(cat.id)}
            style={[styles.tab, activeCategory === cat.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeCategory === cat.id && styles.tabTextActive]}>
              {cat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Prompt selector + answers */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.promptBlock}>
        {currentCategory.teasers.map((prompt) => {
          const selected = selectedPrompts.includes(prompt);
          return (
            <View key={prompt} style={styles.promptItem}>
              <TouchableOpacity
                style={[styles.promptHeader, selected && styles.promptHeaderActive]}
                onPress={() => togglePrompt(prompt)}
              >
                <Text style={[styles.promptText, selected && styles.promptTextActive]}>
                  {prompt}
                </Text>
              </TouchableOpacity>

              {selected && (
                <TextInput
                  placeholder="type your answer"
                  placeholderTextColor="#777"
                  style={styles.input}
                  multiline
                  value={answers[prompt] || ''}
                  onChangeText={(text) => handleInputChange(prompt, text)}
                />
              )}
            </View>
          );
        })}
      </Animated.View>

      {/* Continue button */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <TouchableOpacity
          style={[
            styles.button,
            Object.entries(answers).some(([k, v]) => selectedPrompts.includes(k) && v.trim()) && styles.buttonActive,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>continue</Text>
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
    paddingTop: 60,
  },
  heading: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    borderColor: '#2a2a2a',
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    color: '#fff',
    textTransform: 'lowercase',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  promptBlock: {
    gap: 20,
  },
  promptItem: {
    marginBottom: 16,
  },
  promptHeader: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderColor: '#2a2a2a',
    borderWidth: 1,
  },
  promptHeaderActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  promptText: {
    fontSize: 14,
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  promptTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 10,
    textTransform: 'lowercase',
  },
  button: {
    marginTop: 28,
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
    opacity: 0.4,
  },
  buttonActive: {
    opacity: 1,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
});

export default TeasersScreen;
