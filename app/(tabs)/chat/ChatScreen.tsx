import { useAuthStore } from '@/store/authStore';
import { Conversation, useChatStore } from '@/store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ChatScreen: React.FC = () => {
  const { conversations, loading, fetchConversations, init } = useChatStore();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      init(profile.id);
    }
  }, [profile?.id, init]);

  // Optional: refetch on focus for edge cases, but rely on real-time primarily
  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchConversations();
      }
    }, [profile?.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!conversation.match || !profile?.id) return null;
    const isUser1 = conversation.match.user1.id === profile.id;
    return isUser1 ? conversation.match.user2 : conversation.match.user1;
  };
  
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // ... (Your existing time formatting logic is good)
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
    return `${prefix}${content.length > 30 ? content.substring(0, 30) + '...' : content}`;
  };

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
        <Image 
          source={{ uri: userImage }} 
          style={styles.avatar} 
          contentFit="cover" 
        />
        
        <View style={styles.messageInfo}>
          <View style={styles.messageHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadText]}>
              {otherUser.name}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>

          <View style={styles.lastMessageRow}>
            <View style={styles.previewContainer}>
              {isMyLastMessage && (
                  <Ionicons
                    name={item.last_message?.is_read ? "checkmark-done" : "checkmark"}
                    size={16}
                    color={item.last_message?.is_read ? "#FF1493" : "rgba(255,255,255,0.5)"}
                    style={styles.readIcon}
                  />
              )}
              <Text 
                style={[styles.lastMessage, hasUnread && styles.unreadText]} 
                numberOfLines={1}
              >
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

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

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
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="rgba(255,255,255,0.3)" />
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
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
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
        backgroundColor: '#222',
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
        color: '#fff',
    },
    timestamp: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
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
        color: 'rgba(255,255,255,0.6)',
        flexShrink: 1,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#fff',
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
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginLeft: 75,
    },
    centeredContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        height: 500, // Give it a fixed height to center properly
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
});

export default ChatScreen;