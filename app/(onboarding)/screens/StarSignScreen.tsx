// File: screens/StarSignScreen.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

interface ZodiacInfo {
  sign: string;
  fact: string;
  article: string;
}

const getZodiacSign = (dateString: string): ZodiacInfo => {
  const date = new Date(dateString);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { sign: 'Aquarius', article: 'an', fact: 'people say aquarians are always ahead of their time — the visionary rebels of the zodiac.' };
  }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return { sign: 'Pisces', article: 'a', fact: 'pisceans are said to have a sixth sense for emotions — dreamy and intuitive.' };
  }
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { sign: 'Aries', article: 'an', fact: 'aries are known as fearless starters — impulsive, bold, and born leaders.' };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { sign: 'Taurus', article: 'a', fact: 'taurus is all about stability — but they\'ll fight for what they love.' };
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { sign: 'Gemini', article: 'a', fact: 'geminis are curious and social — sometimes called the chameleons of the zodiac.' };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { sign: 'Cancer', article: 'a', fact: 'cancers are emotional deep-divers — nurturing but protective.' };
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { sign: 'Leo', article: 'a', fact: 'leos are natural performers — said to thrive under the spotlight.' };
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { sign: 'Virgo', article: 'a', fact: 'virgos are detail-oriented perfectionists — the zodiac\'s quiet fixers.' };
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { sign: 'Libra', article: 'a', fact: 'libras are peacemakers — always chasing balance and beauty.' };
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { sign: 'Scorpio', article: 'a', fact: 'scorpios are intense and magnetic — known to carry mystery in their eyes.' };
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { sign: 'Sagittarius', article: 'a', fact: 'sagittarians are explorers — blunt, bold, and full of wanderlust.' };
  }
  return { sign: 'Capricorn', article: 'a', fact: 'capricorns are ambitious — born with a to-do list in their soul.' };
};

const StarSignScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [belief, setBelief] = useState<'yes' | 'no' | 'kinda' | ''>('');
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const slideAnim4 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const optionScaleAnims = useRef(['yes', 'no', 'kinda'].map(() => new Animated.Value(1))).current;

  // Memoize zodiac calculation
  const zodiacInfo = useMemo(() => {
    return formData.dob ? getZodiacSign(formData.dob) : null;
  }, [formData.dob]);

  // Memoize formatted date
  const formattedDOB = useMemo(() => {
    if (!formData.dob) return '';
    const date = new Date(formData.dob);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [formData.dob]);

  // Update form data when zodiac info changes - removed updateFormData from dependency
  useEffect(() => {
    if (zodiacInfo) {
      updateFormData('starSign', zodiacInfo.sign);
    }
  }, [zodiacInfo]); // Removed updateFormData from dependencies

  // Entrance animations
  useEffect(() => {
    if (!hasAnimated && zodiacInfo) {
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
        Animated.spring(slideAnim4, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [zodiacInfo, hasAnimated]);

  // Option button press animations
  const handleOptionPress = useCallback((option: 'yes' | 'no' | 'kinda', index: number) => {
    // Animate button press
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

    setBelief(option);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [optionScaleAnims]);

  // Continue button animations
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

  // Handle continue
  const handleContinue = useCallback(() => {
    if (!belief) return;

    updateFormData('believesInStarSigns', belief);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [belief, updateFormData, nextStep]);

  // Return early if no zodiac info
  if (!zodiacInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>loading your zodiac sign...</Text>
      </View>
    );
  }

  const isValidSelection = belief !== '';

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Birth date section */}
        <Animated.View 
          style={[
            styles.dateSection,
            { transform: [{ translateY: slideAnim1 }] }
          ]}
        >
          <Text style={styles.dateLabel}>you were born on</Text>
          <Text style={styles.dateText}>{formattedDOB}</Text>
        </Animated.View>

        {/* Zodiac sign section */}
        <Animated.View 
          style={[
            styles.zodiacSection,
            { transform: [{ translateY: slideAnim2 }] }
          ]}
        >
          <Text style={styles.zodiacHeading}>
            you're {zodiacInfo.article} {zodiacInfo.sign.toLowerCase()}
          </Text>
          <Text style={styles.zodiacFact}>{zodiacInfo.fact}</Text>
        </Animated.View>

        {/* Belief question section */}
        <Animated.View 
          style={[
            styles.beliefSection,
            { transform: [{ translateY: slideAnim3 }] }
          ]}
        >
          <Text style={styles.beliefQuestion}>do you believe in zodiac signs?</Text>
          <View style={styles.beliefOptions}>
            {['yes', 'no', 'kinda'].map((option, index) => (
              <Animated.View
                key={option}
                style={{ transform: [{ scale: optionScaleAnims[index] }] }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    belief === option && styles.optionButtonActive,
                  ]}
                  onPress={() => handleOptionPress(option as 'yes' | 'no' | 'kinda', index)}
                  accessibilityLabel={`${option} option`}
                  accessibilityHint={`select ${option} for zodiac belief`}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionText,
                      belief === option && styles.optionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Continue button */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            { transform: [{ translateY: slideAnim4 }] }
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
              accessibilityHint={isValidSelection ? 'continue to next step' : 'select your zodiac belief to continue'}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                isValidSelection && styles.buttonTextActive
              ]}>
                keep going
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  loadingText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '400',
  },
  dateText: {
    fontSize: 20,
    color: '#2c2c2c',
    fontWeight: '600',
    textAlign: 'center',
  },
  zodiacSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  zodiacHeading: {
    fontSize: 32,
    color: '#2c2c2c',
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 38,
  },
  zodiacFact: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  beliefSection: {
    marginBottom: 32,
  },
  beliefQuestion: {
    fontSize: 18,
    color: '#2c2c2c',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  beliefOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonActive: {
    backgroundColor: '#ffb6c1',
    borderColor: '#ffb6c1',
    shadowOpacity: 0.1,
  },
  optionText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
});

export default StarSignScreen;