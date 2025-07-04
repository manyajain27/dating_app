import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AuthScreen = () => {
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Placeholder Logo + Title */}
      <View style={styles.logoContainer}>
        <View style={styles.placeholderCircle} />
        <Text style={styles.title}>Soulmate</Text>
      </View>

      <Text style={styles.heading}>Sign up to continue</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/(auth)/SignIn')}>
          <Text style={styles.emailButtonText}>Continue with email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.phoneButton} onPress={() => router.push('/(auth)/PhoneNumber')}>
          <Text style={styles.phoneButtonText}>Use phone number</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or sign up with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.socialIconCircle}>
            <FontAwesome name="facebook" size={32} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconCircle}>
            <Image source={require('../../assets/images/google-logo.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconCircle}>
            <AntDesign name="apple1" size={32} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => openLink('https://example.com/terms')}>
          <Text style={styles.footerLink}>Terms of use</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://example.com/privacy')}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const CIRCLE_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  logoContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  placeholderCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e64e5e',
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginVertical: 50,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 30,
  },
  emailButton: {
    backgroundColor: '#e64e5e',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e64e5e',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    
  },
  phoneButtonText: {
    color: '#e64e5e',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 8,
    color: '#999',
    fontSize: 14,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  socialIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginTop: 'auto',
  },
  footerLink: {
    color: '#e64e5e',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AuthScreen;
