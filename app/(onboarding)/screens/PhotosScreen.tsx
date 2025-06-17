import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PhotoTipsModal from '../components/PhotoTipsModal';
import { ScreenProps } from '../types/FormData';

const MAX_PHOTOS = 6;

const PhotosScreen: React.FC<ScreenProps> = ({
  formData,
  updateFormData,
  prevStep,
  handleComplete,
  isSaving
}) => {
  const [photos, setPhotos] = useState<string[]>(formData.photos || []);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTips(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "We need access to your gallery to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets
        .map(asset => asset.uri)
        .filter(uri => uri);

      const total = photos.length + newPhotos.length;

      if (total > MAX_PHOTOS) {
        Alert.alert('Limit reached', `You can only upload ${MAX_PHOTOS} photos total.`);
        return;
      }

      const updatedPhotos = [...photos, ...newPhotos].slice(0, MAX_PHOTOS);
      setPhotos(updatedPhotos);
      updateFormData('photos', updatedPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    updateFormData('photos', updated);
  };

  return (
    <View style={styles.container}>
      <PhotoTipsModal visible={showTips} onClose={() => setShowTips(false)} />

      <View style={styles.headerContainer}>
        <Animated.Text entering={FadeInDown.delay(100)} style={styles.heading}>
          finally,{"\n"}add your best shots
        </Animated.Text>
        <Text style={styles.subtext}>first impressions matter. no pressure.</Text>

        <TouchableOpacity onPress={() => setShowTips(true)} style={styles.tipLink}>
          <Text style={styles.tipText}>view photo tips</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        <FlatList
          data={[...photos, photos.length < MAX_PHOTOS ? 'add' : null].filter(Boolean)}
          numColumns={3}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if (item === 'add') {
              return (
                <TouchableOpacity style={styles.addBox} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#888" />
                </TouchableOpacity>
              );
            }
            return (
              <View style={styles.imageBox}>
                <Image source={{ uri: item as string }} style={styles.image} />
                <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(index)}>
                  <Ionicons name="close-circle" size={22} color="#ff6666" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueBtn, photos.length > 0 && styles.continueBtnActive]}
          disabled={photos.length === 0 || isSaving}
          onPress={handleComplete}
        >
          <Text style={styles.continueText}>
            {isSaving ? 'saving...' : 'continue'}
          </Text>
          {!isSaving && (
            <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  subtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  tipLink: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#aaa',
    textDecorationLine: 'underline',
  },
  gridContainer: {
    flex: 1,
    marginBottom: 20,
  },
  grid: {
    justifyContent: 'center',
    paddingBottom: 20,
  },
  imageBox: {
    width: 100,
    height: 140,
    margin: 6,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
  },
  addBox: {
    width: 100,
    height: 140,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#333',
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  continueBtn: {
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.5,
  },
  continueBtnActive: {
    opacity: 1,
    backgroundColor: '#fff',
  },
  continueText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
    textTransform: 'lowercase',
  },
});

export default PhotosScreen;
