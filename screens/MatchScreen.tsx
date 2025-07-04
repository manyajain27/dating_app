import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location_city: string;
  height: string;
  profile_pictures: string[];
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

  const userName = userProfile?.name || userProfile?.name || 'You';
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
            userImage: matchedProfile.profile_pictures[0]
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="#666" />
      </TouchableOpacity>

      <View style={styles.cardsContainer}>
        {/* User's card */}
        <View style={[styles.cardWrapper, styles.userCard]}>
          <View style={styles.card}>
            <Image
              source={{ uri: userImage }}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="disk"
            />
            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={16} color="#FF4458" />
            </View>
          </View>
        </View>

        {/* Matched user's card */}
        <View style={[styles.cardWrapper, styles.overlappingCard]}>
          <View style={styles.card}>
            <Image
              source={{ uri: matchedProfile.profile_pictures[0] }}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="disk"
            />
            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={16} color="#FF4458" />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.title}>It's a match, {userName}!</Text>
      <Text style={styles.subtitle}>You and {matchedProfile.name} have liked each other</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleStartChatting}
        >
          <Text style={styles.primaryButtonText}>Say hello</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleKeepSwiping}
        >
          <Text style={styles.secondaryButtonText}>Keep swiping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardsContainer: {
    position: 'relative',
    width: 300,
    height: 300,
    marginBottom: 40,
  },
  cardWrapper: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  userCard: {
    transform: [{ rotate: '-8deg' }],
  },
  overlappingCard: {
    top: 60,
    left: 100,
    transform: [{ rotate: '8deg' }],
  },
  card: {
    width: 180,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4458',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF4458',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 30,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 68, 88, 0.1)',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4458',
    textAlign: 'center',
  },
});

export default MatchScreen;