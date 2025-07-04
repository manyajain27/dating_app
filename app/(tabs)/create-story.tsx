import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { router, useFocusEffect } from 'expo-router';

const CreateStoryScreen = () => {
  const createStory = useStoryStore((state) => state.createStory);
  const uploading = useStoryStore((state) => state.uploading);
  const { profile } = useAuthStore();

  useFocusEffect(
    React.useCallback(() => {
      // This effect runs when the screen comes into focus
      if (!profile?.id) {
        // If there's no profile, something is wrong, go back.
        router.back();
        return;
      }

      // Immediately trigger the story creation flow
      createStory(profile.id);

      // We don't need a cleanup function as the logic handles navigation.
    }, [profile?.id, createStory])
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF1493" />
      <Text style={styles.loadingText}>
        {uploading ? 'Uploading your story...' : 'Preparing...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
  },
});

export default CreateStoryScreen;