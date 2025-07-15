import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import PhotoTipsModal from '../components/PhotoTipsModal';
import { ScreenProps } from '../types/FormData';

const { width: screenWidth } = Dimensions.get('window');
const MAX_PHOTOS = 6;

const PhotosScreen: React.FC<ScreenProps> = ({
  formData,
  updateFormData,
  prevStep,
  handleComplete,
  isSaving,
  setShowPhotoTipsModal
}) => {
  const [photos, setPhotos] = useState<string[]>(formData.photos || []);
  const [showTips, setShowTips] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const backButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const isValidSelection = useMemo(() => photos.length > 0, [photos]);
  const canAddMore = useMemo(() => photos.length < MAX_PHOTOS, [photos]);

  // Show tips on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (setShowPhotoTipsModal) {
        setShowPhotoTipsModal(true);
      } else {
        setShowTips(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [setShowPhotoTipsModal]);

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
      ]).start();
    }
  }, [hasAnimated]);

  const pickImage = useCallback(async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("permission required", "we need access to your gallery to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8, // Optimize for better performance
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets
        .map(asset => asset.uri)
        .filter(uri => uri);

      const total = photos.length + newPhotos.length;

      if (total > MAX_PHOTOS) {
        Alert.alert('limit reached', `you can only upload ${MAX_PHOTOS} photos total.`);
        return;
      }

      const updatedPhotos = [...photos, ...newPhotos].slice(0, MAX_PHOTOS);
      setPhotos(updatedPhotos);
      updateFormData('photos', updatedPhotos);

      // Success haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [photos, updateFormData]);

  const removePhoto = useCallback((index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    updateFormData('photos', updated);

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [photos, updateFormData]);

  const handleShowTips = useCallback(() => {
    if (setShowPhotoTipsModal) {
      setShowPhotoTipsModal(true);
    } else {
      setShowTips(true);
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [setShowPhotoTipsModal]);

  const handleBackPress = useCallback(() => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    prevStep();
  }, [prevStep]);

  const handleContinuePress = useCallback(() => {
    if (!isValidSelection || isSaving) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    handleComplete();
  }, [isValidSelection, isSaving, handleComplete]);

  // Button animations
  const handleButtonPressIn = useCallback(() => {
    if (!isValidSelection || isSaving) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidSelection, isSaving, buttonScaleAnim]);

  const handleButtonPressOut = useCallback(() => {
    if (!isValidSelection || isSaving) return;
    
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [isValidSelection, isSaving, buttonScaleAnim]);

  const handleBackButtonPressIn = useCallback(() => {
    Animated.spring(backButtonScaleAnim, {
      toValue: 0.9,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [backButtonScaleAnim]);

  const handleBackButtonPressOut = useCallback(() => {
    Animated.spring(backButtonScaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [backButtonScaleAnim]);

  const renderPhotoItem = useCallback(({ item, index }: { item: string | 'add'; index: number }) => {
    if (item === 'add') {
      return (
        <TouchableOpacity 
          style={styles.addBox} 
          onPress={pickImage}
          activeOpacity={0.8}
          accessibilityLabel="add photo"
          accessibilityHint="tap to select photos from your gallery"
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={32} color="#ffb6c1" />
          <Text style={styles.addText}>add photo</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.imageBox}>
        <Image source={{ uri: item as string }} style={styles.image} />
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => removePhoto(index)}
          accessibilityLabel="remove photo"
          accessibilityHint="tap to remove this photo"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.photoNumber}>
          <Text style={styles.photoNumberText}>{index + 1}</Text>
        </View>
      </View>
    );
  }, [pickImage, removePhoto]);

  const gridData = useMemo(() => {
    const data = [...photos];
    if (canAddMore) {
      data.push('add');
    }
    return data;
  }, [photos, canAddMore]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PhotoTipsModal visible={showTips} onClose={() => setShowTips(false)} />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.heading}>
              finally,{'\n'}add your best shots
            </Text>
            <Text style={styles.subtext}>first impressions matter. no pressure.</Text>

            <TouchableOpacity 
              onPress={handleShowTips} 
              style={styles.tipLink}
              activeOpacity={0.7}
              accessibilityLabel="view photo tips"
              accessibilityHint="tap to see tips for taking great photos"
              accessibilityRole="button"
            >
              <Text style={styles.tipText}>view photo tips</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {photos.length} of {MAX_PHOTOS} photos
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(photos.length / MAX_PHOTOS) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Photo Grid */}
          <Animated.View 
            style={[
              styles.gridContainer,
              { transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            <FlatList
              data={gridData}
              numColumns={3}
              keyExtractor={(_, idx) => idx.toString()}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              renderItem={renderPhotoItem}
              scrollEnabled={false}
            />
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Button Container */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          { transform: [{ translateY: slideAnim3 }] }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: backButtonScaleAnim }] }}>
          <TouchableOpacity 
            onPress={handleBackPress}
            onPressIn={handleBackButtonPressIn}
            onPressOut={handleBackButtonPressOut}
            style={styles.backButton}
            accessibilityLabel="go back"
            accessibilityHint="return to previous step"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#2c2c2c" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              isValidSelection && styles.continueBtnActive,
              !isValidSelection && styles.continueBtnInactive
            ]}
            disabled={!isValidSelection || isSaving}
            onPress={handleContinuePress}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            accessibilityLabel="continue"
            accessibilityHint={isValidSelection ? 'continue to complete profile' : 'add at least one photo to continue'}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={[
              styles.continueText,
              isValidSelection && styles.continueTextActive
            ]}>
              {isSaving ? 'saving...' : 'continue'}
            </Text>
            {!isSaving && isValidSelection && (
              <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 12,
    textTransform: 'lowercase',
    lineHeight: 34,
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textTransform: 'lowercase',
  },
  tipLink: {
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#ffb6c1',
    textDecorationLine: 'underline',
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#ffb6c1',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffb6c1',
    borderRadius: 2,
  },
  gridContainer: {
    marginBottom: 20,
  },
  grid: {
    justifyContent: 'center',
    paddingBottom: 20,
  },
  imageBox: {
    width: (screenWidth - 72) / 3, // Responsive width
    height: 140,
    margin: 6,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addBox: {
    width: (screenWidth - 72) / 3, // Responsive width
    height: 140,
    margin: 6,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#e0e0e0',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addText: {
    color: '#ffb6c1',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textTransform: 'lowercase',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  continueBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueBtnActive: {
    backgroundColor: '#ffb6c1',
  },
  continueBtnInactive: {
    backgroundColor: '#f0f0f0',
  },
  continueText: {
    fontWeight: '600',
    fontSize: 16,
    textTransform: 'lowercase',
    color: '#a0a0a0',
  },
  continueTextActive: {
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default PhotosScreen;