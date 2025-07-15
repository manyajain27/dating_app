import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Conversation } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import StoryRail from '@/components/StoryRail';
import { StoryPreview, useStoryStore } from '@/store/storyStore';

const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { conversations, loading, fetchConversations, currentUserId, init, cleanup } = useChatStore();
  const { profile } = useAuthStore();

  const {
    storyPreviews,
    myStoriesCount,
    fetchStoryPreviews,
    openStoryViewer,
    loading: storiesLoading,
  } = useStoryStore();

  const mappedStories = storyPreviews.map((preview) => ({
    story_id: preview.story_id,
    user_id: preview.user_id,
    user_name: preview.user_name,
    profile_picture: preview.profile_picture,
    media_url: '',
    media_type: 'image' as 'image',
    created_at: '',
    is_viewed: preview.is_viewed,
    total_stories: 1,
  }));

  useEffect(() => {
    if (profile?.id && currentUserId !== profile.id) {
      init(profile.id);
      fetchStoryPreviews(profile.id);
    }
  }, [profile?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (profile?.id && currentUserId === profile.id) {
        fetchConversations();
        fetchStoryPreviews(profile.id);
      }
    }, [profile?.id, currentUserId])
  );

  const handleRefresh = () => {
    fetchConversations();
    fetchStoryPreviews(profile?.id ?? '');
  };

  const handlePressStory = (story: StoryPreview) => {
    if (!profile?.id) return;
    openStoryViewer(story.user_id, profile.id);
  };

  const handlePressYourStory = () => {
    if (!profile?.id) return;
    if (myStoriesCount > 0) {
      openStoryViewer(profile.id, profile.id);
    } else {
      router.push('/create-story');
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.last_message;
    if (!lastMessage) return 'Start a conversation';

    const isMyMessage = lastMessage.sender_id === currentUserId;
    const prefix = isMyMessage ? 'You: ' : '';

    if (lastMessage.message_type === 'image') {
      return `${prefix}📷 Photo`;
    }

    if (lastMessage.message_type === 'teaser_reply' && lastMessage.metadata?.teaser) {
      return `${prefix}Replied to: "${lastMessage.metadata.teaser}"`;
    }

    const truncatedContent = lastMessage.content.length > 50
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content;

    return `${prefix}${truncatedContent}`;
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!conversation.match) return null;
    return conversation.match.user1.id === currentUserId
      ? conversation.match.user2
      : conversation.match.user1;
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const hasUnread = item.unread_count > 0;
    const lastMessage = item.last_message;
    const isLastMessageMine = lastMessage?.sender_id === currentUserId;
    const isLastMessageRead = lastMessage?.is_read;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => {
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: item.id,
              userName: otherUser.name,
              userImage: otherUser.profile_pictures?.[0] || '',
            },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherUser.profile_pictures?.[0] || 'https://via.placeholder.com/56' }}
            style={styles.avatar}
            contentFit="cover"
          />
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.userNameUnread]} numberOfLines={1}>
              {otherUser.name}
            </Text>
            <View style={styles.metaContainer}>
              {isLastMessageMine && lastMessage && (
                <Ionicons
                  name={isLastMessageRead ? "checkmark-done" : "checkmark"}
                  size={16}
                  color={isLastMessageRead ? "#e64e5e" : "#8E8E93"}
                  style={styles.readIndicator}
                />
              )}
              <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
                {lastMessage ? formatLastMessageTime(lastMessage.created_at) : ''}
              </Text>
            </View>
          </View>

          <View style={styles.messagePreviewContainer}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {formatLastMessage(item)}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start matching to begin chatting with people
      </Text>
    </View>
  );

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = a.last_message?.created_at || a.last_message_at;
      const timeB = b.last_message?.created_at || b.last_message_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [conversations]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" size={24} color="#e64e5e" />
        </TouchableOpacity>
      </View>

      <StoryRail
        stories={mappedStories}
        myStoriesCount={myStoriesCount}
        onPressStory={handlePressStory}
        onPressYourStory={handlePressYourStory}
      />

      <FlatList
        data={sortedConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#e64e5e"
            colors={['#e64e5e']}
          />
        }
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {loading && conversations.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e64e5e" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#000000' },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { flexGrow: 1 },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e64e5e',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: { flex: 1, justifyContent: 'center' },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  userNameUnread: { fontWeight: '700' },
  metaContainer: { flexDirection: 'row', alignItems: 'center' },
  readIndicator: { marginRight: 4 },
  timestamp: { fontSize: 13, color: '#8E8E93', fontWeight: '400' },
  timestampUnread: { color: '#e64e5e', fontWeight: '600' },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: { fontSize: 14, color: '#8E8E93', flex: 1, marginRight: 8 },
  lastMessageUnread: { color: '#000000', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: '#e64e5e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  separator: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 88 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default ChatScreen;