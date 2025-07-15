import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated,
  Platform,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

const INTEREST_OPTIONS = [
  'music', 'movies', 'reading', 'fitness', 'travel',
  'photography', 'art', 'fashion', 'gaming', 'foodie',
  'dancing', 'yoga', 'nature', 'pets', 'memes'
];

const MAX_SELECTION = 5;

const InterestsScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState<string[]>(formData.interests || []);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const chipScaleAnims = useRef(INTEREST_OPTIONS.map(() => new Animated.Value(1))).current;

  const isValidSelection = useMemo(() => selected.length > 0, [selected]);

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

  // Update form data whenever selection changes - removed to prevent infinite loop
  // updateFormData is called directly in toggleInterest instead

  const toggleInterest = useCallback((interest: string, index: number) => {
    const alreadySelected = selected.includes(interest);

    // Animate chip press
    Animated.sequence([
      Animated.timing(chipScaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(chipScaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    let newSelected: string[];
    if (alreadySelected) {
      newSelected = selected.filter((item) => item !== interest);
    } else if (selected.length < MAX_SELECTION) {
      newSelected = [...selected, interest];
    } else {
      return; // Don't do anything if limit reached
    }
    
    setSelected(newSelected);
    updateFormData('interests', newSelected);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      if (alreadySelected || selected.length < MAX_SELECTION) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Gentle feedback when limit reached
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [selected, chipScaleAnims]); // Removed updateFormData from dependencies

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

  const handleContinue = useCallback(() => {
    if (selected.length === 0) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [selected, nextStep]);

  const renderInterestChip = useCallback((item: string, index: number) => {
    const isActive = selected.includes(item);
    const isDisabled = !isActive && selected.length >= MAX_SELECTION;

    return (
      <Animated.View 
        key={item}
        style={[
          styles.chipContainer,
          { transform: [{ scale: chipScaleAnims[index] }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleInterest(item, index)}
          disabled={isDisabled}
          style={[
            styles.chip,
            isActive && styles.chipActive,
            isDisabled && styles.chipDisabled,
          ]}
          accessibilityLabel={`${isActive ? 'remove' : 'add'} ${item} interest`}
          accessibilityHint={`${isActive ? 'tap to remove' : 'tap to add'} ${item} to your interests`}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive, disabled: isDisabled }}
          activeOpacity={0.8}
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
      </Animated.View>
    );
  }, [selected, toggleInterest, chipScaleAnims]);

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
            <Text style={styles.heading}>what are you into?</Text>
            <Text style={styles.subtext}>pick up to 5. helps break the ice.</Text>
            {selected.length > 0 && (
              <Text style={styles.counterText}>
                {selected.length} of {MAX_SELECTION} selected
              </Text>
            )}
          </Animated.View>

          {/* Interest Chips */}
          <Animated.View 
            style={[
              styles.chipSection,
              { transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            <View style={styles.chipGrid}>
              {INTEREST_OPTIONS.map((item, index) => renderInterestChip(item, index))}
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
                accessibilityHint={isValidSelection ? 'continue to next step' : 'select at least one interest to continue'}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.buttonText,
                  isValidSelection && styles.buttonTextActive
                ]}>
                  done
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
    paddingBottom: 60,
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
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  counterText: {
    fontSize: 14,
    color: '#ffb6c1',
    fontWeight: '600',
    marginTop: 8,
  },
  chipSection: {
    marginBottom: 32,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  chipContainer: {
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#f8f8f8',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#ffb6c1',
    borderColor: '#ffb6c1',
    shadowOpacity: 0.1,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 24,
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

export default InterestsScreen;