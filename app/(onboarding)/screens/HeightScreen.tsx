import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated,
  Platform
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ScreenProps } from '../types/FormData';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const feetHeights = [
  "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"",
  "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"",
  "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\""
];

// Generate CM heights from 130cm to 210cm in 1cm increments
const cmHeights = (() => {
  const heights = [];
  for (let i = 130; i <= 210; i++) {
    heights.push(`${i} cm`);
  }
  return heights;
})();

const HeightScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [value, setValue] = useState(formData.height || null);
  const [unit, setUnit] = useState<'feet' | 'cm'>('feet');
  const [isFocus, setIsFocus] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const toggleSlideAnim = useRef(new Animated.Value(unit === 'feet' ? 0 : 1)).current;

  const toggleContainerWidth = screenWidth - 48 - 8;
  const buttonWidth = (toggleContainerWidth - 8) / 2;

  // Prepare dropdown data
  const currentHeights = unit === 'feet' ? feetHeights : cmHeights;
  const dropdownData = currentHeights.map(height => ({
    label: height,
    value: height,
  }));

  const isValidSelection = Boolean(value);

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

  const toggleUnit = useCallback((newUnit: 'feet' | 'cm') => {
    if (newUnit !== unit) {
      Animated.timing(toggleSlideAnim, {
        toValue: newUnit === 'feet' ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      setUnit(newUnit);
      setValue(null);
      updateFormData('height', '');
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [unit, toggleSlideAnim, updateFormData]);

  const handleValueChange = useCallback((item: any) => {
    setValue(item.value);
    updateFormData('height', item.value);
    setIsFocus(false);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateFormData]);

  const handleFocus = useCallback(() => {
    setIsFocus(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocus(false);
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
    if (!value) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [value, nextStep]);

  const toggleIndicatorStyle = {
    transform: [
      {
        translateX: toggleSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, buttonWidth],
        }),
      },
    ],
  };

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
        {/* Header */}
        <Animated.View 
          style={[
            styles.headerContainer,
            { transform: [{ translateY: slideAnim1 }] }
          ]}
        >
          <Text style={styles.heading}>how tall are you?</Text>
          <Text style={styles.subtext}>we don't judge, just curious.</Text>
        </Animated.View>

        {/* Unit Toggle */}
        <Animated.View 
          style={[
            styles.toggleSection,
            { transform: [{ translateY: slideAnim2 }] }
          ]}
        >
          <View style={styles.unitToggleContainer}>
            <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
            <TouchableOpacity
              style={styles.unitButton}
              onPress={() => toggleUnit('feet')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitButtonText, unit === 'feet' && styles.unitButtonTextActive]}>
                feet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.unitButton}
              onPress={() => toggleUnit('cm')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitButtonText, unit === 'cm' && styles.unitButtonTextActive]}>
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dropdown */}
        <Animated.View 
          style={[
            styles.dropdownSection,
            { transform: [{ translateY: slideAnim2 }] }
          ]}
        >
          <Dropdown
            style={[styles.dropdown, isFocus && styles.dropdownFocused]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            data={dropdownData}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? `select height in ${unit}` : '...'}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleValueChange}
            renderRightIcon={() => (
              <Ionicons
                style={styles.icon}
                color={isFocus ? '#ffb6c1' : '#a0a0a0'}
                name={isFocus ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            )}
            containerStyle={styles.dropdownContainer}
            itemTextStyle={styles.itemTextStyle}
            activeColor="#fff5f7"
          />
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
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                isValidSelection && styles.buttonTextActive
              ]}>
                continue
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={isValidSelection ? "#ffffff" : "#a0a0a0"} 
                style={styles.buttonIcon}
              />
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
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    color: '#2c2c2c',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    textTransform: 'lowercase',
  },
  toggleSection: {
    marginBottom: 24,
  },
  unitToggleContainer: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 48,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (screenWidth - 48 - 8 - 8) / 2,
    height: 40,
    backgroundColor: '#ffb6c1',
    borderRadius: 8,
    zIndex: 1,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  unitButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  unitButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dropdownSection: {
    marginBottom: 32,
  },
  dropdown: {
    height: 56,
    backgroundColor: '#f8f8f8',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dropdownFocused: {
    backgroundColor: '#fff5f7',
    borderColor: '#ffb6c1',
    borderWidth: 2,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#a0a0a0',
    textTransform: 'lowercase',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: '#2c2c2c',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemTextStyle: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  buttonIcon: {
    marginLeft: 8,
  },
});

export default HeightScreen;