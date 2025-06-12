// File: screens/LocationScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenProps } from '../types/FormData';

const LocationScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [manualLocation, setManualLocation] = useState(formData.location || '');
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
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
        updateFormData('location', city);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (manualLocation.trim()) {
      updateFormData('location', manualLocation.trim());
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContainer}>
        <Text style={styles.heading}>where are you from?</Text>
        <Text style={styles.subtext}>drop your city. we'll handle the distance thing.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="type your city"
            placeholderTextColor="#888"
            value={manualLocation}
            onChangeText={setManualLocation}
          />
        </View>

        <TouchableOpacity style={styles.detectButton} onPress={getLocation}>
          <Ionicons 
            name={loading ? "refresh-outline" : "navigate-outline"} 
            size={16} 
            color="#6366f1" 
            style={[styles.detectIcon]} 
          />
          <Text style={styles.detectText}>
            {loading ? 'detecting...' : 'use current location'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.cityChipSection}>
        <View style={styles.chipHeaderContainer}>
          <Ionicons name="location" size={16} color="#888" />
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
              onPress={() => {
                setManualLocation(city);
                updateFormData('location', city);
              }}
            >
              <Text
                style={[
                  styles.cityChipText,
                  manualLocation.toLowerCase() === city && { color: '#000' },
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <TouchableOpacity
          style={[styles.button, manualLocation && styles.buttonActive]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>next</Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={manualLocation ? "#ffffff" : "#666"} 
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0a0a0a',
  },
  headerContainer: {
    marginBottom: 32,
  },
  
  heading: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'lowercase',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#1c1c1c',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    textTransform: 'lowercase',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  detectIcon: {
    marginRight: 6,
  },
  detectText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  cityChipSection: {
    marginTop: 32,
  },
  chipHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityChipLabel: {
    color: '#888',
    fontSize: 14,
    marginLeft: 6,
    textTransform: 'lowercase',
  },
  cityChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cityChip: {
    backgroundColor: '#1f1f1f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderColor: '#333',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 10,
  },
  cityChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  cityChipText: {
    color: '#ffffff',
    fontSize: 14,
    textTransform: 'lowercase',
  },
  button: {
    marginTop: 36,
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
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

export default LocationScreen;