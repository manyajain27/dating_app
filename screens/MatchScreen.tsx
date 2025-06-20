import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { router } from 'expo-router';
import { Image } from 'expo-image';

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  distance: string;
  height?: string;
  image: string;
  interests: string[];
  match_id?: string;
}

interface MatchScreenProps {
  profile: Profile;
  onClose: () => void;
}

const MatchScreen: React.FC<MatchScreenProps> = ({ profile: matchedProfile, onClose }) => {
  const { profile: userProfile } = useAuthStore();
  const { createConversation } = useChatStore();

  const userName = userProfile?.first_name || userProfile?.name || 'You';
  const userImage = userProfile?.profile_pictures?.[0] || 'https://via.placeholder.com/100';

  const handleStartChatting = async () => {
    try {
      if (!matchedProfile.match_id) {
        console.error('No match_id provided');
        onClose();
        return;
      }

      // Create or get existing conversation
      const conversationId = await createConversation(matchedProfile.match_id);
      
      if (conversationId) {
        onClose(); // Close the match screen
        
        // Navigate to the individual chat screen
        router.push({
          pathname: '/(tabs)/chat/[id]',
          params: { 
            id: conversationId,
            userName: matchedProfile.name,
            userImage: matchedProfile.image
          }
        });
      } else {
        console.error('Failed to create conversation');
        // Fallback to chat list
        onClose();
        router.push('/(tabs)/chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      // Fallback to chat list
      onClose();
      router.push('/(tabs)/chat');
    }
  };

  const handleKeepSwiping = () => {
    onClose();
    // Stay on the current screen (presumably the discover/swipe screen)
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <Text style={styles.title}>🎉 It's a Match!</Text>
      <Text style={styles.subtitle}>You and {matchedProfile.name} have liked each other</Text>

      <View style={styles.avatarsRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: userImage }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="disk"
          />
          <View style={styles.avatarGlow} />
        </View>
        
        <View style={styles.heartContainer}>
          <Ionicons name="heart" size={30} color="#FF1493" />
          <View style={styles.heartGlow} />
        </View>
        
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: matchedProfile.image }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="disk"
          />
          <View style={styles.avatarGlow} />
        </View>
      </View>

      <Text style={styles.namesText}>
        {userName} & {matchedProfile.name}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleStartChatting}
        >
          <BlurView intensity={25} tint="dark" style={styles.buttonInner}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Chatting</Text>
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleKeepSwiping}
        >
          <BlurView intensity={15} tint="dark" style={styles.buttonInner}>
            <Ionicons name="refresh-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Floating particles animation */}
      <View style={styles.particle1} />
      <View style={styles.particle2} />
      <View style={styles.particle3} />
      <View style={styles.particle4} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarGlow: {
    // Optional glow effect - commented out for now
  },
  heartContainer: {
    marginHorizontal: 25,
    position: 'relative',
  },
  heartGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF1493',
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  namesText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  secondaryButton: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 10,
  },
  // Floating particles
  particle1: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF1493',
    top: '20%',
    left: '10%',
    opacity: 0.6,
  },
  particle2: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF69B4',
    top: '30%',
    right: '15%',
    opacity: 0.4,
  },
  particle3: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1493',
    bottom: '25%',
    left: '20%',
    opacity: 0.3,
  },
  particle4: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF69B4',
    bottom: '35%',
    right: '10%',
    opacity: 0.5,
  },
});

export default MatchScreen;