import { useAuthStore } from '@/store/authStore';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadImageToSupabase } from '@/utils/uploadImage';
import AgeModal from './components/AgeModal';
import BackButton from './components/BackButton';
import PhotoTipsModal from './components/PhotoTipsModal';
import ProgressBar from './components/ProgressBar';
import ChildrenScreen from './screens/ChildrenScreen';
import DOBScreen from './screens/DOBScreen';
import EducationScreen from './screens/EducationScreen';
import GenderScreen from './screens/GenderScreen';
import HeightScreen from './screens/HeightScreen';
import InterestsScreen from './screens/InterestsScreen';
import LocationScreen from './screens/LocationScreen';
import LookingForScreen from './screens/LookingForScreen';
import NameScreen from './screens/NameScreen';
import PhotosScreen from './screens/PhotosScreen';
import StarSignScreen from './screens/StarSignScreen';
import SuccessScreen from './screens/SuccessScreen';
import TeasersScreen from './screens/TeasersScreen';
import { IFormData } from './types/FormData';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IFormData>({
    name: '',
    dob: '',
    gender: '',
    height: '',
    education: '',
    starSign: '',
    lookingFor: [],
    photos: [],
    location_city: '',
    interests: [],
    teasers: {},
    children: '',
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showPhotoTipsModal, setShowPhotoTipsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { updateProfile, profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const steps = [
    'name', 'dob', 'starSign', 'gender', 'height', 'education',
    'lookingFor', 'location_city', 'interests', 'teasers', 'children', 'photos', 'complete'
  ];

  const updateFormData = (field: keyof IFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.dob) { // after dob screen
      setShowAgeModal(true);
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const confirmAge = () => {
    setShowAgeModal(false);
    setCurrentStep(prev => prev + 1);
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Helper function to extract star sign belief from formData if it exists
  const getStarSignBelief = (): 'yes' | 'no' | 'kinda' | undefined => {
    // This assumes you might have this data in your form somewhere
    // You might need to add this to your StarSignScreen component
    return formData.believesInStarSigns;
  };



const saveProfileToDatabase = async (): Promise<boolean> => {
  try {
    setIsSaving(true);

    // Upload all photos first
    const uploadedUrls: string[] = [];
    
    // Add error handling for each upload
    for (const uri of formData.photos) {
      try {
        const url = await uploadImageToSupabase(uri, profile?.id);
        if (url) {
          uploadedUrls.push(url);
        } else {
          console.warn('Failed to upload image:', uri);
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue with other uploads even if one fails
      }
    }

    // Prepare profile updates with proper field mapping
    const profileUpdates = {
      name: formData.name,
      date_of_birth: formData.dob,
      age: formData.dob ? calculateAge(formData.dob) : undefined,
      gender: formData.gender,
      star_sign: formData.starSign,
      // Remove or fix this field since it's not in formData
      // believes_in_star_signs: getStarSignBelief(),
      height: formData.height,
      education: formData.education,
      // looking_for: formData.lookingFor,
      location_city: formData.location_city,
      interests: formData.interests,
      children: formData.children,
      teasers: formData.teasers,
      profile_pictures: uploadedUrls,
      updated_at: new Date().toISOString(), // Add timestamp
    };

    // Remove undefined/empty values but be more specific about what to filter
    const cleanedUpdates = Object.fromEntries(
      Object.entries(profileUpdates).filter(([key, value]) => {
        // Keep specific fields even if they're empty arrays/objects
        if (['looking_for', 'interests', 'teasers', 'profile_pictures'].includes(key)) {
          return true;
        }
        // Filter out undefined, null, and empty strings
        if (value === undefined || value === null || value === '') {
          return false;
        }
        // Keep non-empty arrays and objects
        if (Array.isArray(value)) {
          return true; // Keep arrays even if empty for these specific fields
        }
        if (typeof value === 'object' && value !== null) {
          return true; // Keep objects even if empty for teasers
        }
        return true;
      })
    );

    console.log('Updating profile with:', cleanedUpdates); // Debug log
    console.log('Profile ID:', profile?.id); // Debug log

    // Ensure we have a valid profile ID
    if (!profile?.id) {
      console.error('No profile ID available');
      Alert.alert('Error', 'Profile not found. Please try logging out and back in.');
      return false;
    }

    const { data, error } = await updateProfile(cleanedUpdates);

    if (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', `Failed to save your profile: ${error.message || 'Unknown error'}`);
      return false;
    }

    console.log('Profile updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error in saveProfileToDatabase:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    return false;
  } finally {
    setIsSaving(false);
  }
};


  const handleComplete = async () => {
    console.log('Onboarding complete. Final data:', formData);
    
    // Save to database
    const success = await saveProfileToDatabase();
    
    if (success) {
      // Only proceed to success screen if save was successful
      nextStep();
    }
    // If save failed, stay on current screen and let user try again
  };

  const screenProps = {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    handleComplete,
    setShowPhotoTipsModal,
    isSaving, // Pass saving state to screens that might need it
  };

  const screenComponents = [
    <NameScreen {...screenProps} />,
    <DOBScreen {...screenProps} />,
    <StarSignScreen {...screenProps} />,
    <GenderScreen {...screenProps} />,
    <HeightScreen {...screenProps} />,
    <EducationScreen {...screenProps} />,
    <LookingForScreen {...screenProps} />,
    <LocationScreen {...screenProps} />,
    <InterestsScreen {...screenProps} />,
    <TeasersScreen {...screenProps} />,
    <ChildrenScreen {...screenProps} />,
    <PhotosScreen {...screenProps} />,
    <SuccessScreen {...screenProps} />
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {currentStep < steps.length - 1 && (
        <ProgressBar
          currentStep={currentStep}
          totalSteps={steps.length - 2}
        />
      )}
      
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <BackButton onPress={prevStep} disabled={isSaving} />
      )}

      <View style={styles.screenContainer}>
        {screenComponents[currentStep]}
      </View>

      <AgeModal
        visible={showAgeModal}
        onCancel={() => setShowAgeModal(false)}
        onConfirm={confirmAge}
        dob={formData.dob}
      />

      <PhotoTipsModal
        visible={showPhotoTipsModal}
        onClose={() => setShowPhotoTipsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  screenContainer: {
    flex: 1,
  },
});

export default OnboardingFlow;