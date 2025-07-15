import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

const OPTIONS = [
  'i want kids',
  'i don\'t want kids',
  'i have kids',
  'i don\'t have kids but open to it',
  'not sure yet',
];

const ChildrenScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState(formData.children || '');
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const optionScaleAnims = useRef(OPTIONS.map(() => new Animated.Value(1))).current;

  const isValidSelection = useMemo(() => Boolean(selected), [selected]);

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

  // Handle option selection
  const handleSelect = useCallback((choice: string, index: number) => {
    // Animate option press
    Animated.sequence([
      Animated.timing(optionScaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(optionScaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelected(choice);
    updateFormData('children', choice);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateFormData, optionScaleAnims]);

  // Continue button animations
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

  // Handle continue
  const handleContinue = useCallback(() => {
    if (!selected) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [selected, nextStep]);

  // Render option item
  const renderOption = useCallback((option: string, index: number) => {
    const isActive = selected === option;
    
    return (
      <Animated.View 
        key={option}
        style={[
          styles.optionContainer,
          { transform: [{ scale: optionScaleAnims[index] }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.optionButton,
            isActive && styles.optionActive
          ]}
          onPress={() => handleSelect(option, index)}
          accessibilityLabel={`select ${option}`}
          accessibilityHint={`choose ${option} as your stance on children`}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.optionText,
            isActive && styles.optionTextActive
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selected, handleSelect, optionScaleAnims]);

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
              styles.headerSection,
              { transform: [{ translateY: slideAnim1 }] }
            ]}
          >
            <Text style={styles.heading}>kids — what's your take?</Text>
            <Text style={styles.subtext}>just so we're on the same page.</Text>
          </Animated.View>

          {/* Options List */}
          <Animated.View 
            style={[
              styles.optionsSection,
              { transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            <View style={styles.optionsContainer}>
              {OPTIONS.map((option, index) => renderOption(option, index))}
            </View>
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
                accessibilityHint={isValidSelection ? 'continue to next step' : 'select your stance on children to continue'}
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
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height - 100,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
  },
  headerSection: {
    marginBottom: 40,
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
    textTransform: 'lowercase',
  },
  optionsSection: {
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionContainer: {
    marginBottom: 4,
  },
  optionButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionActive: {
    backgroundColor: '#ffb6c1',
    borderColor: '#ffb6c1',
    shadowOpacity: 0.1,
  },
  optionText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 32,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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

export default ChildrenScreen;