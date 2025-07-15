// File: screens/LocationScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');

const LocationScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [manualLocation, setManualLocation] = useState(formData.location_city || '');
  const [loading, setLoading] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const slideAnim4 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const detectButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const isValidLocation = useMemo(() => Boolean(manualLocation.trim()), [manualLocation]);

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
        Animated.spring(slideAnim4, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasAnimated]);

  const getLocation = useCallback(async () => {
    setLoading(true);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);
      
      if (address.length > 0) {
        const city = address[0].city || address[0].subregion || '';
        setManualLocation(city);
        updateFormData('location_city', city);
        
        // Success haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error(err);
      
      // Error haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    setLoading(false);
  }, [updateFormData]);

  const handleLocationChange = useCallback((text: string) => {
    setManualLocation(text);
    updateFormData('location_city', text.trim());
  }, [updateFormData]);

  const handleCitySelect = useCallback((city: string) => {
    setManualLocation(city);
    updateFormData('location_city', city);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateFormData]);

  const handleDetectButtonPressIn = useCallback(() => {
    Animated.spring(detectButtonScaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [detectButtonScaleAnim]);

  const handleDetectButtonPressOut = useCallback(() => {
    Animated.spring(detectButtonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [detectButtonScaleAnim]);

  const handleButtonPressIn = useCallback(() => {
    if (!isValidLocation) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidLocation, buttonScaleAnim]);

  const handleButtonPressOut = useCallback(() => {
    if (!isValidLocation) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidLocation, buttonScaleAnim]);

  const handleNext = useCallback(() => {
    if (!manualLocation.trim()) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    nextStep();
  }, [manualLocation, nextStep]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
            <Text style={styles.heading}>where are you from?</Text>
            <Text style={styles.subtext}>drop your city. we'll handle the distance thing.</Text>
          </Animated.View>

          {/* Input Section */}
          <Animated.View 
            style={[
              styles.inputSection,
              { transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
              <Ionicons name="search-outline" size={20} color="#a0a0a0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="type your city"
                placeholderTextColor="#a0a0a0"
                value={manualLocation}
                onChangeText={handleLocationChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCorrect={false}
                autoCapitalize="words"
                accessibilityLabel="enter your city"
                accessibilityHint="type the name of your city"
              />
            </View>

            <Animated.View style={{ transform: [{ scale: detectButtonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.detectButton} 
                onPress={getLocation}
                onPressIn={handleDetectButtonPressIn}
                onPressOut={handleDetectButtonPressOut}
                disabled={loading}
                activeOpacity={0.8}
                accessibilityLabel={loading ? "detecting location" : "use current location"}
                accessibilityHint="automatically detect your current city"
              >
                <Ionicons 
                  name={loading ? "refresh-outline" : "navigate-outline"} 
                  size={16} 
                  color="#ffb6c1" 
                  style={[styles.detectIcon, loading && styles.detectIconLoading]} 
                />
                <Text style={styles.detectText}>
                  {loading ? 'detecting...' : 'use current location'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* City Chips */}
          <Animated.View 
            style={[
              styles.cityChipSection,
              { transform: [{ translateY: slideAnim3 }] }
            ]}
          >
            <View style={styles.chipHeaderContainer}>
              <Ionicons name="location" size={16} color="#666666" />
              <Text style={styles.cityChipLabel}>or pick from popular cities</Text>
            </View>
            <View style={styles.cityChipContainer}>
              {[
                'mumbai', 'delhi', 'bangalore', 'hyderabad', 'pune',
                'kolkata', 'chennai', 'ahmedabad', 'jaipur', 'lucknow',
                'surat', 'indore', 'others'
              ].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityChip,
                    manualLocation.toLowerCase() === city && styles.cityChipActive,
                  ]}
                  onPress={() => handleCitySelect(city)}
                  activeOpacity={0.8}
                  accessibilityLabel={`select ${city}`}
                  accessibilityHint={`set ${city} as your location`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      manualLocation.toLowerCase() === city && styles.cityChipTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Continue Button */}
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
                  isValidLocation && styles.buttonActive,
                  !isValidLocation && styles.buttonInactive
                ]}
                onPress={handleNext}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={!isValidLocation}
                activeOpacity={0.8}
                accessibilityLabel="continue"
                accessibilityHint={isValidLocation ? 'continue to next step' : 'enter your city to continue'}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.buttonText,
                  isValidLocation && styles.buttonTextActive
                ]}>
                  next
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={isValidLocation ? "#ffffff" : "#a0a0a0"} 
                  style={styles.buttonIcon}
                />
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
    textTransform: 'lowercase',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
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
  inputContainerFocused: {
    backgroundColor: '#fff5f7',
    borderColor: '#ffb6c1',
    borderWidth: 2,
    shadowOpacity: 0.1,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingLeft: 48,
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '500',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff5f7',
    borderWidth: 1,
    borderColor: '#ffb6c1',
  },
  detectIcon: {
    marginRight: 8,
  },
  detectIconLoading: {
    // Add rotation animation here if needed
  },
  detectText: {
    color: '#ffb6c1',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  cityChipSection: {
    marginBottom: 32,
  },
  chipHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cityChipLabel: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 8,
    textTransform: 'lowercase',
    fontWeight: '500',
  },
  cityChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cityChipActive: {
    backgroundColor: '#ffb6c1',
    borderColor: '#ffb6c1',
    shadowOpacity: 0.1,
  },
  cityChipText: {
    color: '#666666',
    fontSize: 14,
    textTransform: 'lowercase',
    fontWeight: '500',
  },
  cityChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  buttonIcon: {
    marginLeft: 8,
  },
});

export default LocationScreen;