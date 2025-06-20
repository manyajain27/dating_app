import { useAuthStore } from '@/store/authStore';
import { Message, useChatStore } from '@/store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

const IndividualChatScreen: React.FC = () => {
  const { id, userName, userImage } = useLocalSearchParams<{ id: string; userName: string; userImage: string; }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { messages, fetchMessages, sendMessage, setActiveConversation } = useChatStore();
  const { profile } = useAuthStore();
  
  const conversationMessages = messages[id] || [];

  useEffect(() => {
    if (id) {
        fetchMessages(id);
        setActiveConversation(id);
    }
    // Cleanup on unmount
    return () => {
        setActiveConversation(null);
    };
  }, [id]);

  useEffect(() => {
  if (conversationMessages.length > 0) {
    scrollToEnd();
  }
}, [conversationMessages.length]);


  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await sendMessage(id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageContent); // Restore the message on failure
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === profile?.id;
    
    // Grouping logic
    const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
    const nextMessage = index < conversationMessages.length - 1 ? conversationMessages[index + 1] : null;

    const isSameSenderAsPrev = prevMessage && prevMessage.sender_id === item.sender_id;
    const isSameSenderAsNext = nextMessage && nextMessage.sender_id === item.sender_id;

    const isFirstInGroup = !isSameSenderAsPrev;
    const isLastInGroup = !isSameSenderAsNext;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        isLastInGroup && styles.messageGroupSpacing
      ]}>
        {!isMyMessage && isLastInGroup && (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: userImage || 'https://via.placeholder.com/32' }}
              style={styles.messageAvatar}
            />
          </View>
        )}
        {!isMyMessage && !isLastInGroup && (
          <View style={styles.avatarSpacer} />
        )}

        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isFirstInGroup && isLastInGroup && styles.singleMessage,
          isFirstInGroup && !isLastInGroup && (isMyMessage ? styles.myFirstMessage : styles.otherFirstMessage),
          !isFirstInGroup && !isLastInGroup && styles.middleMessage,
          !isFirstInGroup && isLastInGroup && (isMyMessage ? styles.myLastMessage : styles.otherLastMessage),
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          {isLastInGroup && (
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime
              ]}>
                {formatMessageTime(item.created_at)}
              </Text>
              {isMyMessage && (
                <Ionicons
                  name={item.is_read ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={item.is_read ? "#0084FF" : "#B0B0B0"}
                  style={styles.readIndicator}
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const scrollToEnd = () => {
  requestAnimationFrame(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  });
};

const handleInputFocus = () => {
  setTimeout(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, 100);
};

  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerAvatarContainer}>
            <Image 
              source={{ uri: userImage || 'https://via.placeholder.com/36' }} 
              style={styles.headerAvatar} 
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.headerStatus}>Active now</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="videocam" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >

        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"

          // maintainVisibleContentPosition={{
          //   minIndexForVisible: 0,
          //   autoscrollToTopThreshold: 10,
          // }}
          ListEmptyComponent={
            <View style={styles.emptyChatContainer}>
              <View style={styles.emptyAvatarContainer}>
                <Image 
                  source={{ uri: userImage || 'https://via.placeholder.com/80' }}
                  style={styles.emptyAvatar}
                />
              </View>
              <Text style={styles.emptyTitle}>Start your conversation with {userName}</Text>
              <Text style={styles.emptySubtitle}>Messages are end-to-end encrypted</Text>
            </View>
          }
        />

        {/* Input Container */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onFocus={handleInputFocus}
              onChangeText={setInputText}
              placeholder={`Message ${userName}...`}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={18} 
                  color="#FFFFFF" 
                  style={styles.sendIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default IndividualChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  headerStatus: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },

  // Main Content
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  // Message Styles
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 1,
  },
  messageGroupSpacing: {
    marginBottom: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSpacer: {
    width: 40,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#0084FF',
    marginLeft: 40,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Bubble Shapes
  singleMessage: {
    borderRadius: 20,
  },
  myFirstMessage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
  },
  otherFirstMessage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
  },
  middleMessage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  myLastMessage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  otherLastMessage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  // Message Text
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  readIndicator: {
    marginLeft: 4,
  },

  // Input Styles
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 20,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: '#0084FF',
  },
  sendButtonInactive: {
    backgroundColor: '#D1D5DB',
  },
  sendIcon: {
    marginLeft: 1,
  },

  // Empty State
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyAvatarContainer: {
    marginBottom: 24,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});