// screens/PhoneNumberScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const PhoneNumberScreen = () => {
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('1');
  const [phone, setPhone] = useState('');

  const onContinue = () => {
    if (phone.length >= 8) {
      router.push('/(auth)/OtpScreen');
    } else {
      alert('Enter a valid number');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Text style={styles.heading}>My mobile</Text>
      <Text style={styles.subtext}>
        Please enter your valid phone number. We will send you a 4-digit code to verify your account.
      </Text>

      <View style={styles.inputContainer}>
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withCallingCode
          onSelect={country => {
            setCountryCode(country.cca2);
            setCallingCode(country.callingCode[0]);
          }}
        />
        <Text style={styles.code}>+{callingCode}</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="331 623 8413"
          keyboardType="number-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    marginTop: 20,
  },
  code: {
    marginLeft: 6,
    fontSize: 16,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  continueButton: {
    marginTop: 30,
    backgroundColor: '#e64e5e',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhoneNumberScreen;
