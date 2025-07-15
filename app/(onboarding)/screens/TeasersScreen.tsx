import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenProps, TEASER_CATEGORIES, TeaserCategory } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');
const MAX_PROMPTS = 3; // Limit to 3 prompts for better UX

const TeasersScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(Object.keys(formData.teasers || {}));
  const [answers, setAnswers] = useState<Record<string, string>>(formData.teasers || {});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Get all prompts from all categories for simpler UX
  const allPrompts = useMemo(() => {
    const prompts: string[] = [];
    TEASER_CATEGORIES.forEach(category => {
      prompts.push(...category.teasers);
    });
    return prompts;
  }, []);

  // Shuffle prompts for variety
  const shuffledPrompts = useMemo(() => {
    return [...allPrompts].sort(() => Math.random() - 0.5).slice(0, 12); // Show 12 random prompts
  }, [allPrompts]);

  const isValidSelection = useMemo(() => {
    const filledAnswers = Object.entries(answers).filter(([k, v]) => selectedPrompts.includes(k) && v.trim().length > 0);
    return filledAnswers.length > 0;
  }, [answers, selectedPrompts]);

  // Entrance animations
  useEffect(() => {
    if (!hasAnimated) {
      setHasAnimated(true);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered slide animations
      Animated.stagger(200, [
        Animated.spring(slideAnim1, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim2, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim3, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasAnimated]);

  const togglePrompt = useCallback((prompt: string) => {
    if (selectedPrompts.includes(prompt)) {
      // Remove prompt
      setSelectedPrompts(prev => prev.filter(p => p !== prompt));
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[prompt];
        return newAnswers;
      });
    } else if (selectedPrompts.length < MAX_PROMPTS) {
      // Add prompt
      setSelectedPrompts(prev => [...prev, prompt]);
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedPrompts]);

  const handleInputChange = useCallback((prompt: string, text: string) => {
    setAnswers(prev => ({ ...prev, [prompt]: text }));
  }, []);

  const handleInputFocus = useCallback((prompt: string) => {
    setFocusedInput(prompt);
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedInput(null);
  }, []);

  const handleButtonPressIn = useCallback(() => {
    if (!isValidSelection) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidSelection, buttonScaleAnim]);

  const handleButtonPressOut = useCallback(() => {
    if (!isValidSelection) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidSelection, buttonScaleAnim]);

  const handleContinue = useCallback(() => {
    const filledAnswers = Object.entries(answers).filter(([k, v]) => selectedPrompts.includes(k) && v.trim().length > 0);
    if (filledAnswers.length === 0) return;
    
    const result = filledAnswers.reduce((acc, [k, v]) => ({ ...acc, [k]: v.trim() }), {});
    updateFormData('teasers', result);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [answers, selectedPrompts, updateFormData, nextStep]);

  const renderPromptCard = useCallback((prompt: string, index: number) => {
    const isSelected = selectedPrompts.includes(prompt);
    const isDisabled = !isSelected && selectedPrompts.length >= MAX_PROMPTS;
    const isFocused = focusedInput === prompt;
    
    return (
      <View key={prompt} style={styles.promptCard}>
        <TouchableOpacity
          style={[
            styles.promptHeader,
            isSelected && styles.promptHeaderActive,
            isDisabled && styles.promptHeaderDisabled,
            isFocused && styles.promptHeaderFocused,
          ]}
          onPress={() => togglePrompt(prompt)}
          disabled={isDisabled}
          activeOpacity={0.8}
          accessibilityLabel={`${isSelected ? 'remove' : 'select'} prompt: ${prompt}`}
          accessibilityHint={isSelected ? 'tap to remove this prompt' : 'tap to select this prompt'}
          accessibilityRole="button"
        >
          <View style={styles.promptHeaderContent}>
            <Text style={[
              styles.promptText,
              isSelected && styles.promptTextActive,
              isDisabled && styles.promptTextDisabled,
            ]}>
              {prompt}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            )}
          </View>
        </TouchableOpacity>

        {isSelected && (
          <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
            <TextInput
              placeholder="share your thoughts..."
              placeholderTextColor="#a0a0a0"
              style={styles.input}
              multiline
              value={answers[prompt] || ''}
              onChangeText={(text) => handleInputChange(prompt, text)}
              onFocus={() => handleInputFocus(prompt)}
              onBlur={handleInputBlur}
              maxLength={150}
              accessibilityLabel={`answer for ${prompt}`}
              accessibilityHint="type your response to this prompt"
            />
            <Text style={styles.characterCount}>
              {(answers[prompt] || '').length}/150
            </Text>
          </View>
        )}
      </View>
    );
  }, [selectedPrompts, answers, focusedInput, togglePrompt, handleInputChange, handleInputFocus, handleInputBlur]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.headerContainer,
              { transform: [{ translateY: slideAnim1 }] }
            ]}
          >
            <Text style={styles.heading}>show your personality</Text>
            <Text style={styles.subtext}>pick up to {MAX_PROMPTS} prompts and share your thoughts</Text>
            {selectedPrompts.length > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {selectedPrompts.length} of {MAX_PROMPTS} selected
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(selectedPrompts.length / MAX_PROMPTS) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Prompts Grid */}
          <Animated.View 
            style={[
              styles.promptsSection,
              { transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            {shuffledPrompts.map((prompt, index) => renderPromptCard(prompt, index))}
          </Animated.View>

          {/* Continue Button */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              { transform: [{ translateY: slideAnim3 }] }
            ]}
          >
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  isValidSelection && styles.buttonActive,
                  !isValidSelection && styles.buttonInactive
                ]}
                onPress={handleContinue}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={!isValidSelection}
                accessibilityLabel="continue"
                accessibilityHint={isValidSelection ? 'continue to next step' : 'complete at least one prompt to continue'}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.buttonText,
                  isValidSelection && styles.buttonTextActive
                ]}>
                  continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    color: '#2c2c2c',
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textTransform: 'lowercase',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#ffb6c1',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffb6c1',
    borderRadius: 2,
  },
  promptsSection: {
    marginBottom: 32,
  },
  promptCard: {
    marginBottom: 20,
  },
  promptHeader: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptHeaderActive: {
    backgroundColor: '#ffb6c1',
    borderColor: '#ffb6c1',
    shadowOpacity: 0.1,
  },
  promptHeaderDisabled: {
    opacity: 0.4,
  },
  promptHeaderFocused: {
    borderColor: '#ffb6c1',
    borderWidth: 2,
  },
  promptHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    textTransform: 'lowercase',
    flex: 1,
    marginRight: 12,
  },
  promptTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  promptTextDisabled: {
    color: '#a0a0a0',
  },
  inputContainer: {
    marginTop: 12,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
  },
  inputContainerFocused: {
    backgroundColor: '#fff5f7',
    borderColor: '#ffb6c1',
    borderWidth: 2,
  },
  input: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '500',
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#ffb6c1',
  },
  buttonInactive: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a0a0a0',
    textTransform: 'lowercase',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});

export default TeasersScreen;