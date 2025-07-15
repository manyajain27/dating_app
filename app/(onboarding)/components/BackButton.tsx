// File: components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BackButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, disabled = false }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={[styles.container, disabled && styles.disabled]}
      disabled={disabled}
      accessibilityLabel="go back"
      accessibilityHint="return to previous step"
      accessibilityRole="button"
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <ChevronLeft size={24} color="#2c2c2c" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 85,
    left: 24,
    zIndex: 10,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default BackButton;