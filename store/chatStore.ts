import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

// --- INTERFACES ---
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'gif' | 'teaser_reply';
  is_read: boolean;
  created_at: string;
  image_url?: string;
  metadata?: {
    teaser?: string;
  };
  sender?: {
    id: string;
    name: string;
    profile_pictures: string[];
  };
}

export interface Conversation {
  id: string;
  match_id: string;
  last_message_at: string;
  created_at: string;
  match?: {
    id: string;
    user1: { id: string; name: string; profile_pictures: string[] };
    user2: { id: string; name: string; profile_pictures: string[] };
  };
  last_message?: Message;
  unread_count: number;
}

// --- STORE STATE & ACTIONS ---
interface ChatState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  activeConversationId: string | null;
  loading: boolean;
  channels: RealtimeChannel[];
  currentUserId: string | null;
  uploadingImages: { [messageId: string]: boolean };
  messageSubscriptions: Set<string>; // Track active message subscriptions
  pendingMessages: { [tempId: string]: Message }; // Track pending messages
  failedMessages: Set<string>; // Track failed message IDs
}

interface ChatActions {
  init: (userId: string) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, options?: { teaser?: string }) => Promise<void>;
  sendImageMessage: (conversationId: string, imageUri: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  createConversation: (matchId: string) => Promise<string | null>;
  retryFailedMessage: (messageId: string) => Promise<void>;
  cleanup: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // --- INITIAL STATE ---
  conversations: [],
  messages: {},
  activeConversationId: null,
  loading: false,
  channels: [],
  currentUserId: null,
  uploadingImages: {},
  messageSubscriptions: new Set(),
  pendingMessages: {},
  failedMessages: new Set(),

  // --- ACTIONS ---

  /**
   * Initializes the chat store, sets the user ID, and subscribes to real-time events.
   */
  init: (userId: string) => {
    const state = get();
    
    // Prevent re-initialization if already initialized with same user
    if (state.currentUserId === userId && state.channels.length > 0) {
      return;
    }

    // Clean up if switching users or re-initializing
    if (state.currentUserId !== userId || state.channels.length > 0) {
      get().cleanup();
    }

    set({ currentUserId: userId });

    // Create unique channel names to avoid conflicts
    const messageChannelName = `messages:user:${userId}:${Date.now()}`;
    const conversationChannelName = `conversations:user:${userId}:${Date.now()}`;

    // Set up message channel with proper filtering
    const messageChannel = supabase
      .channel(messageChannelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${userId}` // Listen to user's own messages
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          await get().handleNewMessage(newMessage, true);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=neq.${userId}` // Listen to others' messages
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          // Only process if we're part of this conversation
          const conversation = get().conversations.find(c => c.id === newMessage.conversation_id);
          if (conversation) {
            await get().handleNewMessage(newMessage, false);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          get().handleMessageUpdate(updatedMessage);
        }
      );

    // Subscribe to message channel
    messageChannel.subscribe((status) => {
      console.log('Message channel status:', status);
      if (status === 'SUBSCRIBED') {
        // Fetch initial data when subscription is ready
        get().fetchConversations();
      }
    });

    // Set up conversation channel for real-time updates
    const conversationChannel = supabase
      .channel(conversationChannelName)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'conversations' 
        },
        async (payload) => {
          const updatedConversation = payload.new as Conversation;
          // Check if this conversation involves the current user
          const userConversations = get().conversations;
          if (userConversations.find(c => c.id === updatedConversation.id)) {
            await get().fetchConversations();
          }
        }
      )
      .subscribe();

    set(state => ({ 
      channels: [...state.channels, messageChannel, conversationChannel] 
    }));
  },

  /**
   * Handles new incoming messages
   */
  handleNewMessage: async (newMessage: Message, isOwnMessage: boolean) => {
    const state = get();
    
    console.log('Handling new message:', newMessage, 'isOwnMessage:', isOwnMessage);
    
    // Remove from pending messages if it's our own message
    if (isOwnMessage) {
      // Find and remove any pending message with matching content and conversation
      const pendingToRemove = Object.entries(state.pendingMessages).find(([tempId, msg]) => 
        msg.conversation_id === newMessage.conversation_id && 
        msg.content === newMessage.content &&
        msg.sender_id === newMessage.sender_id
      );
      
      if (pendingToRemove) {
        console.log('Removing pending message:', pendingToRemove[0]);
        set(s => {
          const newPending = { ...s.pendingMessages };
          delete newPending[pendingToRemove[0]];
          return { pendingMessages: newPending };
        });
      }
    }

    // Fetch sender info if not present
    if (!newMessage.sender) {
      const { data: senderData } = await supabase
        .from('profiles')
        .select('id, name, profile_pictures')
        .eq('id', newMessage.sender_id)
        .single();
      
      if (senderData) {
        newMessage.sender = senderData;
      }
    }

    // Add to messages if conversation is loaded
    if (state.messages[newMessage.conversation_id]) {
      // Check if message already exists (deduplication)
      const existingMessages = state.messages[newMessage.conversation_id];
      if (!existingMessages.find(m => m.id === newMessage.id)) {
        console.log('Adding new message to conversation:', newMessage.conversation_id);
        set(s => ({
          messages: {
            ...s.messages,
            [newMessage.conversation_id]: [
              ...s.messages[newMessage.conversation_id],
              newMessage
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          },
        }));
      } else {
        console.log('Message already exists, skipping:', newMessage.id);
      }
    }

    // Update conversation
    let convo = state.conversations.find(c => c.id === newMessage.conversation_id);
    if (convo) {
      const updatedConvo = {
        ...convo,
        last_message: newMessage,
        last_message_at: newMessage.created_at,
        unread_count: !isOwnMessage && state.activeConversationId !== newMessage.conversation_id
          ? (convo.unread_count || 0) + 1
          : convo.unread_count,
      };

      set(s => ({
        conversations: [
          updatedConvo,
          ...s.conversations.filter(c => c.id !== newMessage.conversation_id)
        ].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
      }));
    } else {
      // Fetch conversation if it doesn't exist
      await get().fetchConversations();
    }
  },

  /**
   * Handles message updates (e.g., read status)
   */
  handleMessageUpdate: (updatedMessage: Message) => {
    const state = get();

    // Update in messages array
    if (state.messages[updatedMessage.conversation_id]) {
      set(s => ({
        messages: {
          ...s.messages,
          [updatedMessage.conversation_id]: s.messages[updatedMessage.conversation_id].map(m =>
            m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
          )
        }
      }));
    }

    // Update in conversation's last message
    const convo = state.conversations.find(c => c.id === updatedMessage.conversation_id);
    if (convo && convo.last_message?.id === updatedMessage.id) {
      set(s => ({
        conversations: s.conversations.map(c =>
          c.id === updatedMessage.conversation_id && c.last_message
            ? { ...c, last_message: { ...c.last_message, ...updatedMessage } }
            : c
        )
      }));
    }
  },

  /**
   * Fetches all conversations with their last message and unread count.
   */
  fetchConversations: async () => {
    set({ loading: true });
    const userId = get().currentUserId;
    if (!userId) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_conversations_with_details', {
        p_user_id: userId,
      });

      if (error) throw error;

      // Sort conversations by last message time
      const sortedData = (data as Conversation[]).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      set({ conversations: sortedData });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetches all messages for a specific conversation.
   */
  fetchMessages: async (conversationId: string) => {
    const state = get();
    
    // Mark conversation as subscribed
    state.messageSubscriptions.add(conversationId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set(s => ({
        messages: { ...s.messages, [conversationId]: data || [] },
      }));
      
      // Mark messages as read after fetching
      if (state.activeConversationId === conversationId) {
        await get().markMessagesAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  /**
   * Creates a new conversation for a match or returns existing conversation ID.
   */
  createConversation: async (matchId: string): Promise<string | null> => {
    try {
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingConversation) {
        return existingConversation.id;
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          match_id: matchId,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) throw createError;

      await get().fetchConversations();
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  /**
   * Sends a new message with optimistic updates and error handling
   */
  sendMessage: async (conversationId: string, content: string, options?: { teaser?: string }) => {
    const userId = get().currentUserId;
    if (!userId) return;

    // Generate a more unique temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      message_type: options?.teaser ? 'teaser_reply' : 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: options?.teaser ? { teaser: options.teaser } : undefined,
      sender: get().conversations.find(c => c.match?.user1.id === userId || c.match?.user2.id === userId)
        ?.match?.user1.id === userId 
        ? get().conversations.find(c => c.match?.user1.id === userId)?.match?.user1
        : get().conversations.find(c => c.match?.user2.id === userId)?.match?.user2,
    };

    // Add optimistic message
    set(s => ({
      pendingMessages: { ...s.pendingMessages, [tempId]: optimisticMessage },
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] || []), optimisticMessage],
      },
    }));

    try {
      // Prepare the message data
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: options?.teaser ? 'teaser_reply' : 'text',
      };

      // Add metadata if it's a teaser reply
      if (options?.teaser) {
        messageData.metadata = { teaser: options.teaser };
      }

      console.log('Sending message with data:', messageData); // Debug log

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Message sent successfully:', data); // Debug log

      // Remove optimistic message and add real one
      set(s => {
        const newPending = { ...s.pendingMessages };
        delete newPending[tempId];
        
        // Remove the temp message from the messages array
        const messagesWithoutTemp = s.messages[conversationId]?.filter(m => m.id !== tempId) || [];
        const messageAlreadyExists = messagesWithoutTemp.some(m => m.id === data.id);
        
        console.log('Replacing optimistic message:', {
          tempId,
          realMessageId: data.id,
          messageAlreadyExists,
          messagesCount: messagesWithoutTemp.length
        });
        
        return {
          pendingMessages: newPending,
          messages: {
            ...s.messages,
            [conversationId]: messageAlreadyExists 
              ? messagesWithoutTemp
              : [...messagesWithoutTemp, data].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ),
          },
        };
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      set(s => ({
        failedMessages: new Set([...s.failedMessages, tempId]),
      }));
      
      throw error;
    }
  },

  /**
   * Sends an image message with upload progress tracking - FIXED VERSION
   */
  sendImageMessage: async (conversationId: string, imageUri: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    // Generate a more unique temporary ID
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      set(s => ({
        uploadingImages: { ...s.uploadingImages, [tempMessageId]: true }
      }));

      // Fixed: Use different approach for React Native file upload
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;

      // For React Native, we need to create a proper file object
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: fileName,
      } as any);

      // Upload using Supabase storage with FormData
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: 'Image',
          message_type: 'image',
          image_url: publicUrl
        })
        .select()
        .single();

      if (messageError) throw messageError;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    } finally {
      set(s => {
        const newUploadingImages = { ...s.uploadingImages };
        delete newUploadingImages[tempMessageId];
        return { uploadingImages: newUploadingImages };
      });
    }
  },

  /**
   * Retry sending a failed message
   */
  retryFailedMessage: async (messageId: string) => {
    const state = get();
    const failedMessage = state.pendingMessages[messageId];
    
    if (!failedMessage) return;

    // Remove from failed set
    set(s => {
      const newFailed = new Set(s.failedMessages);
      newFailed.delete(messageId);
      return { failedMessages: newFailed };
    });

    // Retry sending
    await get().sendMessage(
      failedMessage.conversation_id, 
      failedMessage.content,
      failedMessage.metadata?.teaser ? { teaser: failedMessage.metadata.teaser } : undefined
    );
  },

  /**
   * Marks all messages in a conversation as read for the current user.
   */
  markMessagesAsRead: async (conversationId: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      // Update local state
      set(s => ({
        conversations: s.conversations.map(c =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
        messages: {
          ...s.messages,
          [conversationId]: s.messages[conversationId]?.map(m => 
            m.sender_id !== userId ? { ...m, is_read: true } : m
          ) || []
        }
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  /**
   * Sets the currently active conversation
   */
  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      get().markMessagesAsRead(conversationId);
    }
  },

  /**
   * Cleanup all subscriptions and reset state
   */
  cleanup: () => {
    const state = get();
    
    // Unsubscribe from all channels
    state.channels.forEach(channel => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error);
      }
    });
    
    // Reset state
    set({ 
      channels: [],
      messageSubscriptions: new Set(),
      pendingMessages: {},
      failedMessages: new Set(),
      conversations: [],
      messages: {},
      activeConversationId: null,
      currentUserId: null,
    });
  },
}));