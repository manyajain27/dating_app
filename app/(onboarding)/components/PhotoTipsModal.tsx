import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Camera, Lightbulb, Smile, Eye } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface PhotoTipsModalProps {
  visible: boolean;
  onClose: () => void;
}

const PhotoTipsModal: React.FC<PhotoTipsModalProps> = ({
  visible,
  onClose,
}) => {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      opacity.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      translateY.value = withSpring(height);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const tips = [
    {
      icon: <Camera size={24} color="#ffffff" />,
      title: 'natural lighting is key ☀️',
      description: 'step near a window or head outdoors for that soft glow',
    },
    {
      icon: <Smile size={24} color="#ffffff" />,
      title: 'genuine smiles win 😄',
      description: 'think of your favorite person, food, or meme before clicking',
    },
    {
      icon: <Eye size={24} color="#ffffff" />,
      title: 'make eye contact 👀',
      description: 'look straight at the lens — connect with whoever’s swiping',
    },
    {
      icon: <Lightbulb size={24} color="#ffffff" />,
      title: 'show some personality ✨',
      description: 'include photos doing what you love — gym, gigs, travel, anything',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={50} tint="dark" style={styles.overlay}>
          <Animated.View style={[styles.modal, animatedStyle]}>
            <View style={styles.header}>
              <Text style={styles.title}>photo tips 📸</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
                <X size={24} color="#a0a0a0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>
                great photos = more right swipes. here’s how to boost your chances:
              </Text>

              {tips.map((tip, index) => (
                <View key={index} style={styles.tip}>
                  <View style={styles.tipIcon}>{tip.icon}</View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.gotItButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.gotItText}>got it!</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

export default PhotoTipsModal

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'lowercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    lineHeight: 22,
    marginBottom: 28,
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  tipDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'lowercase',
  },
});
