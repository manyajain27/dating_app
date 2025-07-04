import { AuthGuard } from '@/context/AuthGaurd';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('screen');

const slides = [
  {
    title: 'Algorithm',
    subtitle: 'Users going through a vetting process to ensure you never match with bots.',
    image: require('../assets/images/girl1.png'),
    gradient: ['#FFB800', '#FF8C00'],
  },
  {
    title: 'Matches',
    subtitle: 'We match you with people that have a large array of similar interests.',
    image: require('../assets/images/girl2.png'),
    gradient: ['#FF6B6B', '#FF8E8E'],
  },
  {
    title: 'Premium',
    subtitle: 'Sign up today and enjoy the first month of premium benefits on us.',
    image: require('../assets/images/girl3.png'),
    gradient: ['#6B73FF', '#000DFF'],
  },
];

const ITEM_WIDTH = width * 0.8;
const ITEM_HEIGHT = height * 0.5;

export default function App() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true, // ✅ This is the key difference!
      listener: (e) => {
        const x = e.nativeEvent.contentOffset.x;
        setCurrentIndex(Math.round(x / width));
      },
    }
  );

  return (
    <AuthGuard requireAuth={false}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Animated.FlatList
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          onScroll={handleScroll}
          renderItem={({ item, index }) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const translateX = scrollX.interpolate({
              inputRange,
              outputRange: [-width * 0.7, 0, width * 0.7],
            });

            return (
              <View style={{ width, height, alignItems: 'center' }}>
                {/* Outer container with shadow */}
                <View style={styles.shadowContainer}>
                  {/* Inner container with clipping */}
                  <View style={styles.imageClipContainer}>
                    <Animated.Image
                      source={item.image}
                      style={[
                        styles.image,
                        { 
                          transform: [{ translateX }],
                          // Make image wider than container for smooth parallax
                          width: ITEM_WIDTH * 1.4,
                        }
                      ]}
                    />
                  </View>
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                  <View style={styles.dotsContainer}>
                    {slides.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          currentIndex === i && styles.activeDot,
                        ]}
                      />
                    ))}
                  </View>
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={() => router.replace('/(auth)/AuthScreen')}
                  >
                    <Text style={styles.buttonText}>Create an account</Text>
                  </TouchableOpacity>
                  <Text style={styles.signinText}>
                    Already have an account? 
                    <Link href="/(auth)/SignIn" asChild>
                      <Text style={styles.signIn}> Sign In</Text>
                    </Link>
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  shadowContainer: {
    marginTop: 60,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    backgroundColor: '#fff',
    padding: 2, // Small padding for shadow effect
  },
  imageClipContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden', // ✅ Critical for clipping the oversized image
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    height: ITEM_HEIGHT,
    resizeMode: 'cover',
    // Width is set dynamically in the component (ITEM_WIDTH * 1.4)
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e53935',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 25,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#e53935',
    width: 10,
    height: 10,
  },
  button: {
    backgroundColor: '#e53935',
    paddingVertical: 18,
    paddingHorizontal: 70,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signinText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  signIn: {
    color: '#e53935',
    fontWeight: 'bold',
  },
});