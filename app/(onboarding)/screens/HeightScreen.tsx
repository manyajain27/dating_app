// File: screens/HeightScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ScreenProps } from '../types/FormData';
import DropDownPicker from 'react-native-dropdown-picker';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

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
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(formData.height || null);
  const [unit, setUnit] = useState<'feet' | 'cm'>('feet');
  
  const currentHeights = unit === 'feet' ? feetHeights : cmHeights;
  const [items, setItems] = useState(currentHeights.map(h => ({ label: h, value: h })));

  // Animation values
  const slideAnimation = useSharedValue(unit === 'feet' ? 0 : 1);
  
  // Calculate the toggle container width (screen width - padding - border)
  const screenWidth = Dimensions.get('window').width;
  const toggleContainerWidth = screenWidth - 48 - 8; // 48 for padding, 8 for border/padding
  const buttonWidth = (toggleContainerWidth - 8) / 2; // 8 for internal padding

  const toggleUnit = (newUnit: 'feet' | 'cm') => {
    if (newUnit !== unit) {
      // Animate the slide
      slideAnimation.value = withTiming(newUnit === 'feet' ? 0 : 1, {
        duration: 300,
      });
      
      setUnit(newUnit);
      setValue(null); // Reset selection when switching units
      
      const newHeights = newUnit === 'feet' ? feetHeights : cmHeights;
      setItems(newHeights.map(h => ({ label: h, value: h })));
    }
  };

  // Animated style for the toggle indicator
  const toggleIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ 
        translateX: interpolate(
          slideAnimation.value,
          [0, 1],
          [0, buttonWidth] // Move exactly one button width
        ) 
      }],
    };
  });

  const handleContinue = () => {
    if (value) {
      updateFormData('height', value);
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContainer}>
        <Text style={styles.heading}>how tall are you?</Text>
        <Text style={styles.subtext}>we don't judge, just curious.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)} style={styles.contentContainer}>
        {/* Unit Toggle with smooth animation */}
        <View style={styles.unitToggleContainer}>
          <Animated.View style={[styles.toggleIndicator, toggleIndicatorStyle]} />
          <TouchableOpacity
            style={styles.unitButton}
            onPress={() => toggleUnit('feet')}
          >
            <Text style={[styles.unitButtonText, unit === 'feet' && styles.unitButtonTextActive]}>
              feet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.unitButton}
            onPress={() => toggleUnit('cm')}
          >
            <Text style={[styles.unitButtonText, unit === 'cm' && styles.unitButtonTextActive]}>
              cm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Container with proper z-index */}
        <View style={styles.dropdownWrapper}>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems}
            placeholder={`select height in ${unit}`}
            style={styles.dropdown}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { zIndex: open ? 9999 : 1 }
            ]}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.placeholderStyle}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            ArrowDownIconComponent={() => (
              <Ionicons name="chevron-down" size={20} color="#888" />
            )}
            ArrowUpIconComponent={() => (
              <Ionicons name="chevron-up" size={20} color="#888" />
            )}
            zIndex={open ? 9999 : 1}
            zIndexInverse={open ? 1 : 9999}
          />
        </View>
      </Animated.View>

      {/* Button with proper z-index */}
      <Animated.View 
        entering={FadeInUp.delay(500)} 
        style={[styles.buttonContainer, { zIndex: open ? 1 : 2 }]}
      >
        <TouchableOpacity
          style={[styles.button, value && styles.buttonActive]}
          onPress={handleContinue}
          disabled={open} // Disable when dropdown is open
        >
          <Text style={styles.buttonText}>continue</Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={value ? "#ffffff" : "#666"} 
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: '#0a0a0a',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 16,
    color: '#888888',
    textTransform: 'lowercase',
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  unitToggleContainer: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    height: 48,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (Dimensions.get('window').width - 48 - 8 - 8) / 2, // Calculate button width
    height: 40,
    backgroundColor: '#ffffff',
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
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  unitButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  dropdownWrapper: {
    zIndex: 1000,
    elevation: 1000,
  },
  dropdown: {
    backgroundColor: '#1c1c1c',
    borderColor: '#2a2a2a',
    borderRadius: 12,
    minHeight: 56,
    zIndex: 1000,
  },
  dropdownContainer: {
    backgroundColor: '#1c1c1c',
    borderColor: '#2a2a2a',
    maxHeight: 250,
    borderRadius: 12,
    marginTop: 4,
    elevation: 1000,
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: 16,
    textTransform: 'lowercase',
  },
  placeholderStyle: {
    color: '#888888',
    fontSize: 16,
    textTransform: 'lowercase',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444444',
    opacity: 0.4,
    flexDirection: 'row',
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
  buttonIcon: {
    marginLeft: 8,
  },
});

export default HeightScreen;