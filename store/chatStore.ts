import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- INTERFACES ---
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio';
  is_read: boolean;
  created_at: string;
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
}

interface ChatActions {
  init: (userId: string) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
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
   * Sends a new message and updates the conversation's last message timestamp.
   */
  sendMessage: async (conversationId: string, content: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    try {
        // We no longer need to manually add the message to the state here.
        // The real-time 'INSERT' subscription will catch the new message
        // from the database and add it, creating a single source of truth.
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: 'text',
      });

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