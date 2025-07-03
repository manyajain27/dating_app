import { useAuthStore } from '@/store/authStore';
import { Message, useChatStore } from '@/store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const IndividualChatScreen: React.FC = () => {
  const { id, userName, userImage } = useLocalSearchParams<{ id: string; userName: string; userImage: string; }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const { messages, fetchMessages, sendMessage, sendImageMessage, setActiveConversation } = useChatStore();
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
      scrollToEnd(false); // Initial scroll should not be animated
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

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        const { status: requestStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (requestStatus !== 'granted') {
          Alert.alert('Camera access required', 'Please allow camera access to take photos.');
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Reduce quality to save bandwidth
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        try {
          await sendImageMessage(id, result.assets[0].uri);
        } catch (error) {
          console.error('Error sending image:', error);
          Alert.alert('Error', 'Failed to send image. Please try again.');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsUploadingImage(false);
    }
  };

  const handleCameraPicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your camera to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        try {
          await sendImageMessage(id, result.assets[0].uri);
        } catch (error) {
          console.error('Error sending image:', error);
          Alert.alert('Error', 'Failed to send image. Please try again.');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setIsUploadingImage(false);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const handleSaveImage = async () => {
    if (!fullScreenImage) return;
  
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save images.');
        return;
      }
  
      const fileName = `chat_image_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  
      // Download image to local file
      const downloadRes = await FileSystem.downloadAsync(fullScreenImage, fileUri);
  
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
  
      const album = await MediaLibrary.getAlbumAsync('Chat Images');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Chat Images', asset, false);
      }
  
      Alert.alert('Success', 'Image saved to your gallery!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };
  
  const showImageOptions = () => {
    Alert.alert(
      'Send Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCameraPicker },
        { text: 'Photo Library', onPress: handleImagePicker },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToEnd = (animated: boolean = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  const renderImageMessage = (message: Message) => {
    const maxWidth = screenWidth * 0.7;
    const maxHeight = 300;
    const isMyMessage = message.sender_id === profile?.id;

    return (
      <View style={[styles.imageMessageContainer, { maxWidth }]}>
        <TouchableOpacity
          onPress={() => handleImagePress(message.image_url!)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: message.image_url }}
            style={[styles.messageImage, { maxHeight }]}
            contentFit="cover"
          />
        </TouchableOpacity>
        {message.content && message.content !== 'Image' && (
          <View style={styles.imageTextContainer}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {message.content}
            </Text>
          </View>
        )}
      </View>
    );
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
          item.message_type === 'image' && styles.imageMessageBubble,
        ]}>
          {item.message_type === 'image' ? (
            renderImageMessage(item)
          ) : (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
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

      {/* Use KeyboardAvoidingView to wrap the list and input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToEnd(false)}
          keyboardDismissMode="on-drag"
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

        {/* Image upload loading indicator */}
        {isUploadingImage && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        )}

        {/* Input Container */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputWrapper}>
            {!inputText.trim() && (
              <>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handleCameraPicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={24} color="#B0B0B0" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image" size={24} color="#B0B0B0" />
                </TouchableOpacity>
              </>
            )}
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onFocus={() => scrollToEnd()}
              onChangeText={setInputText}
              placeholder={`Message ${userName}...`}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
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

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenContainer}>
          <StatusBar hidden />
          <Pressable
            style={styles.fullScreenOverlay}
            onPress={() => setFullScreenImage(null)}
          >
            <View style={styles.fullScreenContent}>
              {fullScreenImage && (
                <Image
                  source={{ uri: fullScreenImage }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                />
              )}
            </View>
          </Pressable>
          
          {/* Full Screen Controls */}
          <View style={styles.fullScreenControls}>
            <TouchableOpacity
              style={styles.fullScreenButton}
              onPress={() => setFullScreenImage(null)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fullScreenButton}
              onPress={handleSaveImage}
            >
              <Ionicons name="download" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default IndividualChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
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
    backgroundColor: '#3A3A3A',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  headerStatus: {
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '400',
  },

  // Main Content
  messagesList: {
    backgroundColor: '#000000',
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
    backgroundColor: '#3A3A3A',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#FF3B30',
    marginLeft: 40,
  },
  otherMessageBubble: {
    backgroundColor: '#2A2A2A',
    borderWidth: 0.5,
    borderColor: '#3A3A3A',
  },
  imageMessageBubble: {
    padding: 2,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Enhanced Image Message Styles
  imageMessageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  messageImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
  },
  imageTextContainer: {
    padding: 12,
    paddingTop: 8,
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
    borderRadius: 6,
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
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#9E9E9E',
  },
  readIndicator: {
    marginLeft: 4,
  },

  // Upload Indicator
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#B0B0B0',
  },

  // Enhanced Input Styles
  inputContainer: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2A2A2A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 44,
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  sendButtonActive: {
    backgroundColor: '#FF3B30',
  },
  sendButtonInactive: {
    backgroundColor: '#5A5A5A',
  },
  sendIcon: {
    marginLeft: 1,
  },

  // Full Screen Image Modal
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
  },
  fullScreenControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 16,
  },
  fullScreenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#3A3A3A',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
});