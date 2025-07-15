import React, { useEffect, useState, useRef } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, SafeAreaView, ActivityIndicator, Text, Dimensions, Animated, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useStoryStore } from '@/store/storyStore';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const formatTimeAgo = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMins = Math.floor(diffSeconds / 60);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h`;
};

const StoryViewerModal = () => {
  const { profile } = useAuthStore();
  const {
    isViewerVisible,
    closeStoryViewer,
    activeUserStories,
    activeStoryIndex,
    nextStory,
    previousStory,
    markStoryAsViewed,
    loading,
    deleteStory,
  } = useStoryStore();

  const [isPaused, setIsPaused] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const videoRef = useRef<Video>(null);
  const activeStory = activeUserStories?.[activeStoryIndex];
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('isViewerVisible:', isViewerVisible, 'activeStory:', activeStory, 'loading:', loading, 'activeUserStories:', activeUserStories);
    if (!loading && isViewerVisible && activeUserStories.length === 0) {
      console.log('Closing viewer due to no stories');
      closeStoryViewer();
      router.replace('/chat');
    }
  }, [loading, isViewerVisible, activeUserStories]);

  useEffect(() => {
    if (activeStory && profile?.id) {
      console.log('Marking story as viewed:', activeStory.id);
      markStoryAsViewed(activeStory.id, profile.id);
    }
    progressAnim.setValue(0);
    if (!isPaused && activeStory?.media_type === 'image') {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) nextStory();
      });
    }
    return () => progressAnim.stopAnimation();
  }, [activeStoryIndex, activeUserStories, isPaused]);

  const handleVideoPlaybackStatusUpdate = (status: any) => {
    console.log('Video Playback Status:', status);
    if (!status.isLoaded || !status.durationMillis) return;
    progressAnim.setValue(status.positionMillis / status.durationMillis);
    if (status.didJustFinish) nextStory();
  };

  const handleDelete = () => {
    if (activeStory) {
      console.log('Deleting story:', activeStory.id);
      deleteStory(activeStory.id, activeStory.user_id);
    }
    setIsDeleteModalVisible(false);
  };

  return (
    <Modal
      visible={isViewerVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={closeStoryViewer}
      statusBarTranslucent={true}
    >
      <View style={styles.container} onLayout={(e) => console.log('Container Layout:', e.nativeEvent.layout)}>
        {/* Media Container */}
        <View style={styles.mediaContainer} onLayout={(e) => console.log('MediaContainer Layout:', e.nativeEvent.layout)}>
          {loading && !activeStory ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : activeStory ? (
            activeStory.media_type === 'video' ? (
              <Video
                key={activeStory.id}
                ref={videoRef}
                source={{ uri: activeStory.media_url }}
                style={styles.media}
                resizeMode={Platform.OS === 'android' ? ResizeMode.CONTAIN : ResizeMode.COVER}
                shouldPlay={!isPaused}
                onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                isLooping={false}
                useNativeControls={false}
                onError={(error) => console.log('Video Error:', error)}
                onReadyForDisplay={() => console.log('Video Ready for Display')}
              />
            ) : (
              <Image
                key={activeStory.id}
                source={{ uri: activeStory.media_url }}
                style={styles.media}
                contentFit={Platform.OS === 'android' ? 'contain' : 'cover'}
                onError={(error) => console.log('Image Error:', error.nativeEvent)}
                onLoad={() => console.log('Image Loaded')}
              />
            )
          ) : (
            <View style={styles.centered}>
              <Text style={styles.errorText}>Could not load story.</Text>
            </View>
          )}
        </View>

        {/* Overlay with UI Elements */}
        <SafeAreaView style={styles.overlay}>
          <View style={styles.progressContainer} onLayout={(e) => console.log('ProgressContainer Layout:', e.nativeEvent.layout)}>
            {activeUserStories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: index === activeStoryIndex
                        ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : index < activeStoryIndex
                        ? '100%'
                        : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.gradient} />

          {activeStory && (
            <View style={styles.header} onLayout={(e) => console.log('Header Layout:', e.nativeEvent.layout)}>
              <Image source={{ uri: activeStory.profile_picture }} style={styles.avatar} />
              <View>
                <Text style={styles.userName}>{activeStory.user_name}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(activeStory.created_at)}</Text>
              </View>
              <View style={styles.headerButtons}>
                {activeStory.user_id === profile?.id && (
                  <TouchableOpacity
                    onPress={() => setIsDeleteModalVisible(true)}
                    style={styles.deleteButton}
                    onLayout={(e) => console.log('Delete Button Layout:', e.nativeEvent.layout)}
                  >
                    <Ionicons name="trash-outline" size={26} color="#fff" style={styles.iconShadow} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={closeStoryViewer}
                  style={styles.closeButton}
                  onLayout={(e) => console.log('Close Button Layout:', e.nativeEvent.layout)}
                >
                  <Ionicons name="close" size={30} color="#fff" style={styles.iconShadow} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>

        {/* Touch Zones */}
        <View style={styles.touchZoneContainer} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={previousStory}>
            <View style={styles.touchZone} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={nextStory}>
            <View style={styles.touchZone} />
          </TouchableWithoutFeedback>
        </View>
        <TouchableWithoutFeedback onPressIn={() => setIsPaused(true)} onPressOut={() => setIsPaused(false)}>
          <View style={styles.pauseZone} />
        </TouchableWithoutFeedback>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Story?</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to delete this story? This action cannot be undone.</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsDeleteModalVisible(false)}>
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.deleteConfirmButton]} onPress={handleDelete}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
    backgroundColor: '#000',
  },
  media: {
    width: width,
    height: height,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingTop: Platform.OS === 'android' ? 20 : 10, // Adjust for Android status bar
    paddingHorizontal: 10,
    gap: 4,
    zIndex: 25,
  },
  progressBar: {
    flex: 1,
    height: 3.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    zIndex: 30,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  headerButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 35,
  },
  deleteButton: {
    padding: 5,
    marginRight: 8,
    zIndex: 40,
  },
  closeButton: {
    padding: 5,
    zIndex: 40,
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
  touchZoneContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 15,
    pointerEvents: 'box-none', // Allow touches to pass through to buttons
  },
  touchZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pauseZone: {
    position: 'absolute',
    top: height * 0.2,
    bottom: height * 0.2,
    left: width * 0.2,
    right: width * 0.2,
    zIndex: 25,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#3A3A3C',
    marginRight: 10,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#fff',
  },
});

export default StoryViewerModal;