// screens/OTPScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

const OTPScreen = () => {
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleDigitPress = (digit: string) => {
    const nextIndex = code.findIndex(val => val === '');
    if (nextIndex !== -1) {
      const updated = [...code];
      updated[nextIndex] = digit;
      setCode(updated);
    }
  };

  const handleDelete = () => {
    const lastIndex = [...code].reverse().findIndex(val => val !== '');
    if (lastIndex !== -1) {
      const indexToDelete = 3 - lastIndex;
      const updated = [...code];
      updated[indexToDelete] = '';
      setCode(updated);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={20} color="#000" />
      </TouchableOpacity>

      <Text style={styles.timer}>{`00:${timer < 10 ? '0' + timer : timer}`}</Text>
      <Text style={styles.instruction}>Type the verification code we’ve sent you</Text>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.digitBox,
              digit !== '' && { backgroundColor: '#e64e5e' },
            ]}
          >
            <Text style={[styles.digitText, digit !== '' && { color: '#fff' }]}>
              {digit}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.keypad}>
        {['1','2','3','4','5','6','7','8','9','0'].map((num, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleDigitPress(num)}
            style={styles.key}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={handleDelete} style={styles.key}>
          <AntDesign name="delete" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setTimer(60)} style={styles.resend}>
        <Text style={styles.resendText}>Send again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  timer: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  digitBox: {
    width: 50,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    rowGap: 20,
    marginTop: 10,
  },
  key: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  resend: {
    marginTop: 20,
  },
  resendText: {
    color: '#e64e5e',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OTPScreen;
