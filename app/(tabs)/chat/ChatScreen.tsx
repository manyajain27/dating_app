import StoryRail from '@/components/StoryRail';
import { useAuthStore } from '@/store/authStore';
import { Conversation, useChatStore } from '@/store/chatStore';
import { StoryPreview, useStoryStore } from '@/store/storyStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ChatScreen: React.FC = () => {
  // State from stores
  const { conversations, loading: chatLoading, fetchConversations, init } = useChatStore();
  const { profile } = useAuthStore();
  const {
    storyPreviews,
    myStoriesCount,
    fetchStoryPreviews,
    openStoryViewer,
    loading: storiesLoading,
  } = useStoryStore();

  // Map storyPreviews to Story type for StoryRail
  const mappedStories = storyPreviews.map((preview) => ({
    story_id: preview.story_id,
    user_id: preview.user_id,
    user_name: preview.user_name,
    profile_picture: preview.profile_picture,
    media_url: '', // No preview media, so empty string
    media_type: 'image' as 'image', // Explicitly type as 'image'
    created_at: '', // Not available in preview
    is_viewed: preview.is_viewed,
    total_stories: 1, // Assume 1 for preview
  }));

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Initialize chat and fetch initial data
  useEffect(() => {
    if (profile?.id) {
      init(profile.id);
      fetchStoryPreviews(profile.id);
    }
  }, [profile?.id, init]);

  // Refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchConversations();
        fetchStoryPreviews(profile.id);
      }
    }, [profile?.id])
  );

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (!profile?.id) return;
    setRefreshing(true);
    await Promise.all([fetchConversations(), fetchStoryPreviews(profile.id)]);
    setRefreshing(false);
  };

  // --- Story Handlers ---
  const handlePressStory = (story: StoryPreview) => {
    if (!profile?.id) return;
    openStoryViewer(story.user_id, profile.id);
  };

  const handlePressYourStory = () => {
    if (!profile?.id) return;
    if (myStoriesCount > 0) {
      // View your own stories
      openStoryViewer(profile.id, profile.id);
    } else {
      // Go to the story creation screen
      router.push('/create-story');
      
    }
  };

  // --- Helper Functions ---
  const getOtherUser = (conversation: Conversation) => {
    if (!conversation.match || !profile?.id) return null;
    const isUser1 = conversation.match.user1.id === profile.id;
    return isUser1 ? conversation.match.user2 : conversation.match.user1;
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = (item: Conversation) => {
    if (!item.last_message) return 'Start a conversation!';
    const { content, sender_id } = item.last_message;
    const prefix = sender_id === profile?.id ? 'You: ' : '';
    const truncatedContent = content.length > 30 ? `${content.substring(0, 30)}...` : content;
    return `${prefix}${truncatedContent}`;
  };

  // --- Render Functions ---
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const userImage = otherUser.profile_pictures?.[0] || 'https://via.placeholder.com/60';
    const hasUnread = item.unread_count > 0;
    const isMyLastMessage = item.last_message?.sender_id === profile?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              userName: otherUser.name,
              userImage: userImage,
            },
          })
        }
        activeOpacity={0.7}
      >
        <Image source={{ uri: userImage }} style={styles.avatar} contentFit="cover" />
        <View style={styles.messageInfo}>
          <View style={styles.messageHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadText]}>{otherUser.name}</Text>
            <Text style={styles.timestamp}>{formatTime(item.last_message_at)}</Text>
          </View>
          <View style={styles.lastMessageRow}>
            <View style={styles.previewContainer}>
              {isMyLastMessage && (
                <Ionicons
                  name={item.last_message?.is_read ? 'checkmark-done' : 'checkmark'}
                  size={16}
                  color={item.last_message?.is_read ? '#FF1493' : 'rgba(0,0,0,0.5)'}
                  style={styles.readIcon}
                />
              )}
              <Text style={[styles.lastMessage, hasUnread && styles.unreadText]} numberOfLines={1}>
                {getLastMessagePreview(item)}
              </Text>
            </View>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (chatLoading && conversations.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <StoryRail
        stories={mappedStories}
        myStoriesCount={myStoriesCount}
        onPressStory={handlePressStory}
        onPressYourStory={handlePressYourStory}
      />

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !chatLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="rgba(0,0,0,0.15)" />
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptySubtitle}>
                When you match with someone, you'll see your conversation here.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed to white
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4458', // Accent color for Messages title
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#eee', // Lighter bg for white
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111', // Dark text
  },
  timestamp: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  readIcon: {
    marginRight: 5,
  },
  lastMessage: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.6)',
    flexShrink: 1,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#111', // Dark text
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginLeft: 95,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#fff', // White bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    height: 400,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111', // Dark text
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
});

export default ChatScreen;