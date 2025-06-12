import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChildrenScreen from './screens/ChildrenScreen';
import DOBScreen from './screens/DOBScreen';
import EducationScreen from './screens/EducationScreen';
import GenderScreen from './screens/GenderScreen';
import HeightScreen from './screens/HeightScreen';
import InterestsScreen from './screens/InterestsScreen';
import LocationScreen from './screens/LocationScreen';
import LookingForScreen from './screens/LookingForScreen';
import NameScreen from './screens/NameScreen';
import StarSignScreen from './screens/StarSignScreen';
import SuccessScreen from './screens/SuccessScreen';
import TeasersScreen from './screens/TeasersScreen';
import { IFormData } from './types/FormData';
import AgeModal from './components/AgeModal';
import BackButton from './components/BackButton';
import PhotoTipsModal from './components/PhotoTipsModal';
import ProgressBar from './components/ProgressBar';
import PhotosScreen from './screens/PhotosScreen';

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
    location: '',
    interests: [],
    teasers: {},
    children: '',
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showPhotoTipsModal, setShowPhotoTipsModal] = useState(false);

  const insets = useSafeAreaInsets();

  const steps = [
    'name', 'dob', 'starSign', 'gender', 'height', 'education',
    'lookingFor', 'location', 'interests', 'teasers', 'children', 'photos', 'complete'
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

  const handleComplete = () => {
    console.log('onboarding complete. final data:', formData);
    nextStep();
  };

  const screenProps = {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    handleComplete,
    setShowPhotoTipsModal,
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
        <BackButton onPress={prevStep} />
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