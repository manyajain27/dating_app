// File: screens/DOBScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Animated,
  Dimensions,
  Alert,
  AccessibilityInfo
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

const DOBScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [date, setDate] = useState(formData.dob ? new Date(formData.dob) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const dateButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Age validation function - moved before isValidDate
  const isValidAge = useCallback((birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      actualAge--;
    }

    if (actualAge < 18) {
      setErrorMessage('you must be at least 18 years old to use this app');
      setHasError(true);
      return false;
    }

    if (actualAge > 100) {
      setErrorMessage('please enter a valid birth date');
      setHasError(true);
      return false;
    }

    setHasError(false);
    setErrorMessage('');
    return true;
  }, []);

  // Calculate isValidDate after isValidAge is defined - memoized to prevent re-renders
  const isValidDate = useMemo(() => {
    return formData.dob && isValidAge(new Date(formData.dob));
  }, [formData.dob, isValidAge]);

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

  // Calculate age for display
  const calculateAge = useCallback((birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // Shake animation for errors
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Date picker change handler
  const onChange = useCallback((event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
    
    // Validate the selected date
    if (isValidAge(currentDate)) {
      updateFormData('dob', currentDate.toISOString());
      
      // Provide haptic feedback for successful selection
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      // Provide haptic feedback for error
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [date, isValidAge, updateFormData]);

  // Date button press animations
  const handleDateButtonPressIn = useCallback(() => {
    Animated.spring(dateButtonScaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [dateButtonScaleAnim]);

  const handleDateButtonPressOut = useCallback(() => {
    Animated.spring(dateButtonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [dateButtonScaleAnim]);

  // Continue button press animations
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

  // Show date picker
  const handleShowPicker = useCallback(() => {
    setShowPicker(true);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Handle continue
  const handleContinue = useCallback(() => {
    if (!formData.dob) {
      setErrorMessage('please select your birth date');
      setHasError(true);
      triggerShake();
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (!isValidAge(new Date(formData.dob))) {
      triggerShake();
      return;
    }

    // Provide haptic feedback for success
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    nextStep();
  }, [formData.dob, isValidAge, triggerShake, nextStep]);

  // Format date for display
  const formatDateForDisplay = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const age = calculateAge(date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedDate} (${age} years old)`;
  }, [calculateAge]);

  return (
    <View style={styles.container}>
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
          when were you born?
        </Text>
        
        <Text style={styles.subtext}>
          just for legal reasons, promise.
        </Text>

        <Animated.View style={{ transform: [{ scale: dateButtonScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.dateButton,
              formData.dob && styles.dateButtonActive,
              hasError && styles.dateButtonError
            ]}
            onPress={handleShowPicker}
            onPressIn={handleDateButtonPressIn}
            onPressOut={handleDateButtonPressOut}
            accessibilityLabel="select birth date"
            accessibilityHint="opens date picker to select your birth date"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={[
              styles.dateText,
              formData.dob && styles.dateTextActive,
              !formData.dob && styles.dateTextPlaceholder
            ]}>
              {formData.dob ? formatDateForDisplay(formData.dob) : 'select your birth date'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {hasError && (
          <Animated.View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </Animated.View>
        )}

        {showPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              textColor={Platform.OS === 'ios' ? '#2c2c2c' : undefined}
              accentColor="#ffb6c1"
              themeVariant="light"
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                isValidDate && styles.buttonActive,
                !isValidDate && styles.buttonInactive
              ]}
              onPress={handleContinue}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={!isValidDate}
              accessibilityLabel="continue"
              accessibilityHint={isValidDate ? 'continue to next step' : 'select your birth date to continue'}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                isValidDate && styles.buttonTextActive
              ]}>
                continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Age requirement info */}
        <Text style={styles.infoText}>
          you must be 18 or older to use this app
        </Text>
      </Animated.View>
    </View>
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
  heading: {
    fontSize: 28,
    color: '#2c2c2c',
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '400',
  },
  dateButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButtonActive: {
    backgroundColor: '#fff5f7',
    borderColor: '#ffb6c1',
    borderWidth: 2,
  },
  dateButtonError: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  dateTextActive: {
    color: '#2c2c2c',
  },
  dateTextPlaceholder: {
    color: '#a0a0a0',
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  infoText: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '400',
  },
});

export default DOBScreen;