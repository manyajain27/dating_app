import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
View, 
TextInput, 
Text, 
TouchableOpacity, 
StyleSheet, 
KeyboardAvoidingView, 
Platform, 
Animated,
Dimensions,
Keyboard,
AccessibilityInfo,
Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NameScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
const [name, setName] = useState(formData.name);
const [isKeyboardVisible, setKeyboardVisible] = useState(false);
const [hasError, setHasError] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

// Animated values for fun interactions
const fadeAnim = useRef(new Animated.Value(0)).current;
const scaleAnim = useRef(new Animated.Value(0.95)).current;
const buttonScaleAnim = useRef(new Animated.Value(1)).current;
const shakeAnim = useRef(new Animated.Value(0)).current;
const inputFocusAnim = useRef(new Animated.Value(0)).current;

const inputRef = useRef<TextInput>(null);
const isValidName = name.trim().length >= 2;

// Entrance animation
useEffect(() => {
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
}, []);

// Keyboard listeners
useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
    setKeyboardVisible(true);
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardVisible(false);
  });

  return () => {
    keyboardDidShowListener?.remove();
    keyboardDidHideListener?.remove();
  };
}, []);

// Input focus animation
const handleInputFocus = useCallback(() => {
  Animated.spring(inputFocusAnim, {
    toValue: 1,
    tension: 100,
    friction: 8,
    useNativeDriver: false,
  }).start();
}, [inputFocusAnim]);

const handleInputBlur = useCallback(() => {
  Animated.spring(inputFocusAnim, {
    toValue: 0,
    tension: 100,
    friction: 8,
    useNativeDriver: false,
  }).start();
}, [inputFocusAnim]);

// Shake animation for errors
const triggerShake = useCallback(() => {
  Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
}, [shakeAnim]);

// Name validation
const validateName = useCallback((inputName: string): boolean => {
  const trimmedName = inputName.trim();
  
  if (trimmedName.length < 2) {
    setErrorMessage('name must be at least 2 characters long');
    setHasError(true);
    return false;
  }
  
  if (trimmedName.length > 50) {
    setErrorMessage('name must be less than 50 characters');
    setHasError(true);
    return false;
  }
  
  // Check for special characters (allow letters, spaces, apostrophes, hyphens)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    setErrorMessage('name can only contain letters, spaces, apostrophes, and hyphens');
    setHasError(true);
    return false;
  }
  
  setHasError(false);
  setErrorMessage('');
  return true;
}, []);

// Handle name change with validation
const handleNameChange = useCallback((text: string) => {
  // Capitalize first letter of each word
  const formattedText = text.replace(/\b\w/g, (char) => char.toUpperCase());
  setName(formattedText);
  
  // Clear error when user starts typing
  if (hasError) {
    setHasError(false);
    setErrorMessage('');
  }
}, [hasError]);

// Button press animation
const handleButtonPressIn = useCallback(() => {
  Animated.spring(buttonScaleAnim, {
    toValue: 0.95,
    tension: 150,
    friction: 4,
    useNativeDriver: true,
  }).start();
}, [buttonScaleAnim]);

const handleButtonPressOut = useCallback(() => {
  Animated.spring(buttonScaleAnim, {
    toValue: 1,
    tension: 150,
    friction: 4,
    useNativeDriver: true,
  }).start();
}, [buttonScaleAnim]);

// Handle next step
const handleNext = useCallback(() => {
  if (!validateName(name)) {
    triggerShake();
    // Provide haptic feedback for error
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    return;
  }

  // Provide haptic feedback for success
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  updateFormData('name', name.trim());
  nextStep();
}, [name, validateName, triggerShake, updateFormData, nextStep]);

// Accessibility
const accessibilityHint = isValidName 
  ? 'double tap to continue to the next step'
  : 'enter your name to continue';

return (
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
    style={styles.container}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <Animated.View 
      style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim }
          ]
        }
      ]}
    >

      
      <Text style={styles.heading}>
        let's start simple.{'\n'}what's your name?
      </Text>
      
      <Text style={styles.subheading}>
        don't worry, you can always change it later
      </Text>

      <Animated.View style={[
        styles.inputContainer,
        {
          borderColor: inputFocusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#f0f0f0', '#ffb6c1']
          }),
          borderWidth: inputFocusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2]
          }),
          shadowOpacity: inputFocusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1]
          })
        },
        hasError && styles.inputError
      ]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="type your first name here"
          placeholderTextColor="#a0a0a0"
          value={name}
          onChangeText={handleNameChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={handleNext}
          maxLength={50}
          accessibilityLabel="enter your name"
          accessibilityHint="type your first name to continue"
          importantForAccessibility="yes"
        />
      </Animated.View>

      {hasError && (
        <Animated.View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.buttonContainer}>
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.button,
              isValidName && styles.buttonActive,
              !isValidName && styles.buttonInactive
            ]}
            onPress={handleNext}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={!isValidName}
            accessibilityLabel="continue"
            accessibilityHint={accessibilityHint}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={[
              styles.buttonText,
              isValidName && styles.buttonTextActive
            ]}>
              continue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Character count */}
      <Text style={styles.characterCount}>
        {name.length}/50
      </Text>
    </Animated.View>
  </KeyboardAvoidingView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#ffffff',
},
contentContainer: {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 24,
  paddingVertical: 40,
},
emoji: {
  fontSize: 48,
  textAlign: 'center',
  marginBottom: 20,
},
heading: {
  fontSize: 28,
  color: '#2c2c2c',
  marginBottom: 12,
  fontWeight: '700',
  textAlign: 'center',
  lineHeight: 34,
},
subheading: {
  fontSize: 16,
  color: '#666666',
  textAlign: 'center',
  marginBottom: 40,
  fontWeight: '400',
},
inputContainer: {
  backgroundColor: '#fafafa',
  borderRadius: 16,
  marginBottom: 16,
  shadowColor: '#ffb6c1',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowRadius: 8,
  elevation: 3,
},
input: {
  padding: 20,
  color: '#2c2c2c',
  fontSize: 18,
  fontWeight: '500',
  textAlign: 'center',
},
inputError: {
  borderColor: '#ff6b6b',
  borderWidth: 2,
},
errorContainer: {
  marginBottom: 20,
  paddingHorizontal: 16,
},
errorText: {
  color: '#ff6b6b',
  fontSize: 14,
  textAlign: 'center',
  fontWeight: '500',
},
buttonContainer: {
  marginTop: 20,
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
},
buttonTextActive: {
  color: '#ffffff',
},
characterCount: {
  fontSize: 12,
  color: '#a0a0a0',
  textAlign: 'center',
  marginTop: 12,
  fontWeight: '500',
},
});

export default NameScreen;