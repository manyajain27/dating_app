import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ScreenProps } from '../types/FormData';

const getZodiacSign = (dateString: string): { sign: string; fact: string; article: string } => {
  const date = new Date(dateString);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: 'Aquarius', article: 'an', fact: 'people say aquarians are always ahead of their time — the visionary rebels of the zodiac.' };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { sign: 'Pisces', article: 'a', fact: 'pisceans are said to have a sixth sense for emotions — dreamy and intuitive.' };
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: 'Aries', article: 'an', fact: 'aries are known as fearless starters — impulsive, bold, and born leaders.' };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: 'Taurus', article: 'a', fact: 'taurus is all about stability — but they’ll fight for what they love.' };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: 'Gemini', article: 'a', fact: 'geminis are curious and social — sometimes called the chameleons of the zodiac.' };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: 'Cancer', article: 'a', fact: 'cancers are emotional deep-divers — nurturing but protective.' };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: 'Leo', article: 'a', fact: 'leos are natural performers — said to thrive under the spotlight.' };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: 'Virgo', article: 'a', fact: 'virgos are detail-oriented perfectionists — the zodiac’s quiet fixers.' };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: 'Libra', article: 'a', fact: 'libras are peacemakers — always chasing balance and beauty.' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: 'Scorpio', article: 'a', fact: 'scorpios are intense and magnetic — known to carry mystery in their eyes.' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: 'Sagittarius', article: 'a', fact: 'sagittarians are explorers — blunt, bold, and full of wanderlust.' };
  return { sign: 'Capricorn', article: 'a', fact: 'capricorns are ambitious — born with a to-do list in their soul.' };
};

const StarSignScreen = ({ formData, updateFormData, nextStep }: ScreenProps) => {
  const [sign, setSign] = useState('');
  const [fact, setFact] = useState('');
  const [article, setArticle] = useState('a');
  const [formattedDOB, setFormattedDOB] = useState('');
  const [belief, setBelief] = useState<'yes' | 'no' | 'kinda' | ''>('');

  useEffect(() => {
    if (formData.dob) {
      const d = new Date(formData.dob);
      const zodiac = getZodiacSign(formData.dob);
      setSign(zodiac.sign);
      setFact(zodiac.fact);
      setArticle(zodiac.article);
      updateFormData('starSign', zodiac.sign);
      setFormattedDOB(d.toDateString());
    }
  }, [formData.dob]);

  const handleContinue = () => {
    updateFormData('believesInStarSigns', belief);
    nextStep();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text style={styles.dob}>you were born on</Text>
        <Text style={styles.dobDate}>{formattedDOB}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <Text style={styles.heading}>you're {article} {sign.toLowerCase()}.</Text>
        <Text style={styles.subtext}>{fact}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
        <Text style={styles.question}>do you believe in zodiac signs?</Text>
        <View style={styles.beliefOptions}>
          {['yes', 'no', 'kinda'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                belief === option && styles.optionButtonActive,
              ]}
              onPress={() => setBelief(option as 'yes' | 'no' | 'kinda')}
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
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(700)}>
        <TouchableOpacity
          style={[styles.button, !belief && { opacity: 0.4 }]}
          onPress={handleContinue}
          disabled={!belief}
        >
          <Text style={styles.buttonText}>keep going</Text>
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
  dob: {
    fontSize: 16,
    color: '#888888',
    textTransform: 'lowercase',
  },
  dobDate: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 32,
    textTransform: 'lowercase',
  },
  heading: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 36,
    textTransform: 'lowercase',
  },
  question: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  beliefOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#444444',
  },
  optionButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  optionText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  optionTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
});

export default StarSignScreen;
