// screens/IndividualChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { BlurView } from 'expo-blur';
import { useCallback } from 'react';

interface MessageItemProps {
  message: any;
  isCurrentUser: boolean;
  showTime: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser, showTime }) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {message.content}
        </Text>
      </View>
      {showTime && (
        <Text style={[
          styles.messageTime,
          isCurrentUser ? styles.currentUserTime : styles.otherUserTime
        ]}>
          {formatTime(message.created_at)}
        </Text>
      )}
    </View>
  );
};

const IndividualChatScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const userName = params.userName as string;
  const userImage = params.userImage as string;

  const { 
    messages, 
    loading, 
    sendingMessage,
    currentConversation,
    fetchMessages, 
    sendMessage, 
    markMessagesAsRead,
    subscribeToMessages,
    setCurrentConversation 
  } = useChatStore();
  
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Use useFocusEffect to manage subscriptions when screen is focused/unfocused
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        console.log('Screen focused, setting up chat for:', conversationId);
        
        // Set current conversation
        const currentConv = {
          id: conversationId,
          match_id: '',
          last_message_at: '',
          created_at: '',
          other_user: {
            id: '',
            name: userName,
            profile_pictures: [userImage]
          }
        };
        setCurrentConversation(currentConv);

        // Fetch messages
        fetchMessages(conversationId);
        
        // Mark messages as read
        markMessagesAsRead(conversationId);
        
        // Subscribe to real-time messages
        const unsubscribe = subscribeToMessages(conversationId);
        unsubscribeRef.current = unsubscribe;

        return () => {
          console.log('Screen unfocused, cleaning up chat for:', conversationId);
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
          setCurrentConversation(null);
        };
      }
    }, [conversationId, userName, userImage])
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !conversationId) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await sendMessage(conversationId, messageText);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(messageText); // Restore input text on error
    }
  };

  const shouldShowTime = (currentMsg: any, prevMsg: any, index: number) => {
    if (index === 0) return true;
    
    const currentTime = new Date(currentMsg.created_at).getTime();
    const prevTime = new Date(prevMsg.created_at).getTime();
    const timeDiff = currentTime - prevTime;
    
    // Show time if more than 5 minutes apart or different sender
    return timeDiff > 5 * 60 * 1000 || currentMsg.sender_id !== prevMsg.sender_id;
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTime = shouldShowTime(item, prevMessage, index);

    return (
      <MessageItem 
        message={item} 
        isCurrentUser={isCurrentUser}
        showTime={showTime}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: userImage || 'https://via.placeholder.com/40' }}
          style={styles.headerAvatar}
          contentFit="cover"
          cachePolicy="disk"
        />
        <View style={styles.userDetails}>
          <Text style={styles.headerUserName}>{userName}</Text>
          <Text style={styles.headerStatus}>Active recently</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image 
        source={{ uri: userImage || 'https://via.placeholder.com/100' }}
        style={styles.emptyAvatar}
        contentFit="cover"
        cachePolicy="disk"
      />
      <Text style={styles.emptyTitle}>You matched with {userName}!</Text>
      <Text style={styles.emptySubtitle}>Start the conversation with a message</Text>
    </View>
  );

  const renderInputArea = () => (
    <BlurView intensity={90} tint="dark" style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          maxLength={1000}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? "#fff" : "rgba(255,255,255,0.5)"} 
            />
          )}
        </TouchableOpacity>
      </View>
    </BlurView>
  );

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Conversation not found</Text>
          <TouchableOpacity 
            style={styles.backToChatsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToChatsText}>Back to Chats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF1493" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyMessagesList
            ]}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Only auto-scroll when content changes and we're near the bottom
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            onLayout={() => {
              // Scroll to bottom when layout changes (like when keyboard opens)
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }}
          />
        )}
        
        {renderInputArea()}
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  moreButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
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
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyMessagesList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 2,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 2,
  },
  currentUserBubble: {
    backgroundColor: '#FF1493',
    borderBottomRightRadius: 6,
  },
  otherUserBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  currentUserTime: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },
  otherUserTime: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'left',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 15 : 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF1493',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  backToChatsButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToChatsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default IndividualChatScreen;