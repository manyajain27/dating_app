// screens/ChatListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

interface ConversationItemProps {
  conversation: any;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const userName = otherUser?.first_name || otherUser?.name || 'Unknown';
  const userImage = otherUser?.profile_pictures?.[0] || 'https://via.placeholder.com/60';
  const messagePreview = lastMessage?.content || 'Start a conversation...';
  const messageTime = lastMessage?.created_at ? formatTime(lastMessage.created_at) : '';

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: userImage }} 
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="disk"
        />
        {otherUser?.last_active && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.messageTime}>{messageTime}</Text>
        </View>
        
        <View style={styles.messagePreviewContainer}>
          <Text 
            style={[
              styles.messagePreview, 
              unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {messagePreview}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChatListScreen: React.FC = () => {
  const { 
    conversations, 
    loading, 
    fetchConversations, 
    subscribeToConversations,
    setCurrentConversation 
  } = useChatStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      const unsubscribe = subscribeToConversations();
      return unsubscribe;
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: any) => {
    setCurrentConversation(conversation);
    router.push({
      pathname: '/(tabs)/chat/[id]',
      params: { 
        id: conversation.id,
        userName: conversation.other_user?.first_name || conversation.other_user?.name || 'Chat',
        userImage: conversation.other_user?.profile_pictures?.[0] || ''
      }
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start swiping to find matches and begin chatting!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/swipe')}
      >
        <Text style={styles.exploreButtonText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = ({ item }: { item: any }) => (
    <ConversationItem 
      conversation={item} 
      onPress={() => handleConversationPress(item)}
    />
  );

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/swipe')}
        >
          <Ionicons name="heart" size={24} color="#FF1493" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF1493"
            colors={['#FF1493']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    lineHeight: 22,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  messageTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  unreadMessage: {
    color: '#fff',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatListScreen;