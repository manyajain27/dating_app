// File: screens/GenderScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

const options = ['man', 'woman', 'non-binary', 'prefer not to say'];

const GenderScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [selected, setSelected] = useState(formData.gender);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const optionScaleAnims = useRef(options.map(() => new Animated.Value(1))).current;

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
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasAnimated]);

  // Handle option selection
  const handleSelect = useCallback((value: string, index: number) => {
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

    setSelected(value);
    updateFormData('gender', value);
    
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
  const renderOption = useCallback(({ item, index }: { item: string; index: number }) => {
    const isSelected = selected === item;
    
    return (
      <Animated.View 
        style={[
          styles.optionContainer,
          { transform: [{ scale: optionScaleAnims[index] }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.option,
            isSelected && styles.optionSelected
          ]}
          onPress={() => handleSelect(item, index)}
          accessibilityLabel={`select ${item}`}
          accessibilityHint={`choose ${item} as your gender identity`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.optionText,
            isSelected && styles.optionTextSelected
          ]}>
            {item}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selected, handleSelect, optionScaleAnims]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <View style={styles.headerSection}>
          <Text style={styles.heading}>how do you identify?</Text>
          <Text style={styles.subtext}>just being respectful here.</Text>
        </View>

        <View style={styles.optionsSection}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={renderOption}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        <View style={styles.buttonContainer}>
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
              accessibilityHint={isValidSelection ? 'continue to next step' : 'select your gender identity to continue'}
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
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 120, // Space for back button
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    color: '#2c2c2c',
    marginBottom: 12,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  optionsSection: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 12,
  },
  optionContainer: {
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
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
  optionSelected: {
    backgroundColor: '#fff5f7',
    borderColor: '#ffb6c1',
    borderWidth: 2,
    shadowOpacity: 0.1,
  },
  optionText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#2c2c2c',
    fontWeight: '600',
  },
  separator: {
    height: 0, // Remove default separator since we're using marginBottom
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

export default GenderScreen;