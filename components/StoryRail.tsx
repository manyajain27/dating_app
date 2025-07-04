// components/StoryRail.tsx
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Define the Story type based on our DB function
export interface Story {
  story_id: string;
  user_id: string;
  user_name: string;
  profile_picture: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  is_viewed: boolean;
  total_stories: number;
}

interface StoryRailProps {
  stories: Story[];
  myStoriesCount: number;
  onPressStory: (story: Story) => void;
  onPressYourStory: () => void;
}

const StoryRail: React.FC<StoryRailProps> = ({ stories, myStoriesCount, onPressStory, onPressYourStory }) => {
  const { profile } = useAuthStore();

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity style={styles.storyContainer} onPress={() => onPressStory(item)} activeOpacity={0.8}>
      <View style={[styles.avatarContainer, !item.is_viewed && styles.unviewedBorder]}>
        <Image source={{ uri: item.profile_picture }} style={styles.avatar} contentFit="cover" />
      </View>
      <Text numberOfLines={1} style={styles.userName}>{item.user_name}</Text>
    </TouchableOpacity>
  );

  const YourStory = () => (
    <TouchableOpacity style={styles.storyContainer} onPress={onPressYourStory} activeOpacity={0.8}>
       <View style={styles.avatarContainer}>
        <Image source={{ uri: profile?.profile_pictures?.[0] || 'https://via.placeholder.com/60' }} style={styles.avatar} contentFit="cover" />
        {myStoriesCount === 0 && (
          <View style={styles.plusIcon}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        )}
       </View>
      <Text style={styles.userName}>Your Story</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.user_id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={<YourStory />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
  },
  listContainer: {
    paddingRight: 20,
  },
  storyContainer: {
    alignItems: 'center',
    width: 80,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    marginBottom: 6,
  },
  unviewedBorder: {
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  plusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF1493',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  userName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});

export default StoryRail;