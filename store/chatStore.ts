import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';

// --- INTERFACES ---
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'teaser_reply';
  is_read: boolean;
  created_at: string;
  image_url?: string; // Add image_url field
  sender?: {
    id: string;
    name: string;
    profile_pictures: string[];
  };
  metadata?: {
    teaser?: string;
  }
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
  uploadingImages: { [messageId: string]: boolean }; // Track image upload progress
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

  // --- ACTIONS ---

  /**
   * Initializes the chat store, sets the user ID, and subscribes to real-time events.
   */
  init: (userId: string) => {
    if (get().currentUserId === userId) return; // Already initialized

    set({ currentUserId: userId });
    get().cleanup(); // Clean up any existing subscriptions

    const messageChannel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new as Message;
          const state = get();

          // Add message to the correct conversation's message list
          if (state.messages[newMessage.conversation_id]) {
            set(s => ({
              messages: {
                ...s.messages,
                [newMessage.conversation_id]: [
                  ...s.messages[newMessage.conversation_id],
                  newMessage
                ],
              },
            }));
          }

          // Update the conversation in the list
          let convo = state.conversations.find(c => c.id === newMessage.conversation_id);
          if (convo) {
            convo = {
              ...convo,
              last_message: newMessage,
              last_message_at: newMessage.created_at,
            };

            // Increment unread count if it's not our message and we're not in the chat
            if (newMessage.sender_id !== state.currentUserId && state.activeConversationId !== newMessage.conversation_id) {
              convo.unread_count = (convo.unread_count || 0) + 1;
            }

            // Update the conversations array and re-sort
            set(s => ({
              conversations: [convo!, ...s.conversations.filter(c => c.id !== newMessage.conversation_id)]
                .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
            }));
          } else {
            // If conversation doesn't exist, fetch it
            await state.fetchConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMessage = payload.new as Message;
          const state = get();

          // Update read status in IndividualChatScreen
          if (state.messages[updatedMessage.conversation_id]) {
            set(s => ({
              messages: {
                ...s.messages,
                [updatedMessage.conversation_id]: s.messages[updatedMessage.conversation_id].map(m =>
                  m.id === updatedMessage.id ? updatedMessage : m
                )
              }
            }));
          }

          // Update read status on ChatScreen last message
          const convo = state.conversations.find(c => c.id === updatedMessage.conversation_id);
          if (convo && convo.last_message?.id === updatedMessage.id) {
            set(s => ({
              conversations: s.conversations.map(c =>
                c.id === updatedMessage.conversation_id
                  ? { ...c, last_message: { ...c.last_message!, is_read: updatedMessage.is_read } }
                  : c
              )
            }));
          }
        }
      )
      .subscribe();

    set(state => ({ channels: [...state.channels, messageChannel] }));
    get().fetchConversations();
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
      set({ conversations: data as Conversation[] });
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
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set(state => ({
        messages: { ...state.messages, [conversationId]: data || [] },
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  /**
   * Creates a new conversation for a match or returns existing conversation ID.
   */
  createConversation: async (matchId: string): Promise<string | null> => {
    try {
      // First, check if a conversation already exists for this match
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      if (existingConversation) {
        // Conversation already exists, return its ID
        return existingConversation.id;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          match_id: matchId,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Refresh conversations list to include the new one
      await get().fetchConversations();

      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  /**
   * Sends a new message and updates the conversation's last message timestamp.
   */
  sendMessage: async (conversationId: string, content: string, options?: { teaser?: string }) => {
    const userId = get().currentUserId;
    if (!userId) return;

    try {
      const messageData: Partial<Message> = {
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: options?.teaser ? 'teaser_reply' : 'text',
        metadata: options?.teaser ? { teaser: options.teaser } : undefined
      }

      const { error } = await supabase.from('messages').insert(messageData);

      if (error) throw error;

      // Update the last_message_at timestamp to trigger sorting
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Sends an image message by uploading to Supabase Storage and creating a message record.
   */
  sendImageMessage: async (conversationId: string, imageUri: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    const tempMessageId = `temp_${Date.now()}_${Math.random()}`;

    try {
        set(state => ({
            uploadingImages: { ...state.uploadingImages, [tempMessageId]: true }
        }));

        // Correctly convert image to ArrayBuffer
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer(); // Directly get the ArrayBuffer

        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${conversationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(filePath);

        const messageData: Partial<Message> = {
            conversation_id: conversationId,
            sender_id: userId,
            content: 'Image',
            message_type: 'image',
            image_url: publicUrl
        };

        const { error: messageError } = await supabase.from('messages').insert(messageData);

        if (messageError) throw messageError;

        await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

    } catch (error) {
        console.error('Error sending image message:', error);
        throw error;
    } finally {
        set(state => {
            const newUploadingImages = { ...state.uploadingImages };
            delete newUploadingImages[tempMessageId];
            return { uploadingImages: newUploadingImages };
        });
    }
},
  /**
   * Marks all messages in a conversation as read for the current user.
   */
  markMessagesAsRead: async (conversationId: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    // Update the DB
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);

    // Update local state
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    }));
  },

  /**
   * Sets the currently active conversation to manage read receipts and notifications.
   */
  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      get().markMessagesAsRead(conversationId);
    }
  },

  /**
   * Unsubscribes from all real-time channels.
   */
  cleanup: () => {
    get().channels.forEach(channel => channel.unsubscribe());
    set({ channels: [] });
  },
}));