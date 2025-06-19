// store/chatStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'gif';
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  match_id: string;
  last_message_at: string;
  created_at: string;
  match?: {
    id: string;
    user1_id: string;
    user2_id: string;
    matched_at: string;
    is_super_like: boolean;
  };
  other_user?: {
    id: string;
    first_name?: string;
    name?: string;
    profile_pictures?: string[];
    last_active?: string;
  };
  last_message?: Message;
  unread_count?: number;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sendingMessage: boolean;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  createConversation: (matchId: string) => Promise<string | null>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  subscribeToMessages: (conversationId: string) => () => void;
  subscribeToConversations: () => () => void;
  cleanup: () => void;
  // Add helper methods
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
}

// Store channels with conversation IDs to prevent multiple subscriptions
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sendingMessage: false,

  fetchConversations: async () => {
    try {
      set({ loading: true });
      const { user } = useAuthStore.getState();
      if (!user) return;

      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchError) {
        console.error('Error fetching user matches:', matchError);
        return;
      }

      const matchIds = matches?.map(m => m.id);
      if (!matchIds || matchIds.length === 0) {
        set({ conversations: [] });
        return;
      }

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches (
            id,
            user1_id,
            user2_id,
            matched_at,
            is_super_like
          )
        `)
        .in('match_id', matchIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
          const otherId = conv.match.user1_id === user.id
            ? conv.match.user2_id
            : conv.match.user1_id;

          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, name, profile_pictures, last_active')
            .eq('id', otherId)
            .single();

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_user: {
              ...otherUser,
              name: otherUser?.name || 'Unknown'
            },
            unread_count: unreadCount || 0,
            last_message: lastMessage || null
          };
        })
      );

      set({ conversations: conversationsWithUsers });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ loading: true });
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      set({ messages: messages || [] });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      set({ sendingMessage: true });
      const { user } = useAuthStore.getState();
      if (!user) return;

      // Create optimistic message for immediate UI update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString()
      };

      // Add optimistic message to UI
      const { messages } = get();
      set({ messages: [...messages, tempMessage] });

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        set({ messages: messages.filter(m => m.id !== tempMessage.id) });
        return;
      }

      // Replace optimistic message with real one
      set({ 
        messages: messages.map(m => 
          m.id === tempMessage.id ? message : m
        )
      });

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      set({ sendingMessage: false });
    }
  },

  markMessagesAsRead: async (conversationId: string) => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      // Update local state
      const { messages, conversations } = get();
      const updatedMessages = messages.map(msg =>
        msg.conversation_id === conversationId && msg.sender_id !== user.id
          ? { ...msg, is_read: true }
          : msg
      );

      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, unread_count: 0 }
          : conv
      );

      set({ messages: updatedMessages, conversations: updatedConversations });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  createConversation: async (matchId: string) => {
    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (existingConv) return existingConv.id;

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({ match_id: matchId, last_message_at: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      get().fetchConversations();
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
    
    // If setting a new conversation, mark its messages as read
    if (conversation) {
      get().markMessagesAsRead(conversation.id);
    }
  },

  // Helper methods for real-time updates
  addMessage: (message: Message) => {
    const { messages } = get();
    const exists = messages.some(m => m.id === message.id);
    if (!exists) {
      set({ messages: [...messages, message] });
    }
  },

  updateMessage: (message: Message) => {
    const { messages } = get();
    set({
      messages: messages.map(m => m.id === message.id ? message : m)
    });
  },

  subscribeToMessages: (conversationId: string) => {
    const channelKey = `messages-${conversationId}`;
    
    // Clean up existing channel for this conversation
    if (activeChannels.has(channelKey)) {
      const existingChannel = activeChannels.get(channelKey);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
        activeChannels.delete(channelKey);
      }
    }

    const { user } = useAuthStore.getState();
    if (!user) return () => {};

    console.log(`Subscribing to messages for conversation: ${conversationId}`);

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('New message received via real-time:', newMessage);
          
          // Use helper method to add message
          get().addMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          console.log('Message updated via real-time:', updatedMessage);
          
          // Use helper method to update message
          get().updateMessage(updatedMessage);
        }
      )
      .subscribe((status) => {
        console.log(`Message channel ${channelKey} status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to messages for conversation: ${conversationId}`);
        }
      });

    // Store the channel
    activeChannels.set(channelKey, channel);

    return () => {
      console.log(`Unsubscribing from messages for conversation: ${conversationId}`);
      if (activeChannels.has(channelKey)) {
        const channelToRemove = activeChannels.get(channelKey);
        if (channelToRemove) {
          supabase.removeChannel(channelToRemove);
          activeChannels.delete(channelKey);
        }
      }
    };
  },

  subscribeToConversations: () => {
    const channelKey = 'conversations-global';
    
    // Clean up existing conversation subscription
    if (activeChannels.has(channelKey)) {
      const existingChannel = activeChannels.get(channelKey);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
        activeChannels.delete(channelKey);
      }
    }

    const { user } = useAuthStore.getState();
    if (!user) return () => {};

    console.log('Subscribing to conversations updates');

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('Conversation updated via real-time:', payload);
          // Use a debounced refresh to avoid too many calls
          setTimeout(() => {
            get().fetchConversations();
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message detected, updating conversations:', payload);
          // Refresh conversations to update last message and timestamps
          setTimeout(() => {
            get().fetchConversations();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Conversation subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to conversation updates');
        }
      });

    // Store the channel
    activeChannels.set(channelKey, channel);

    return () => {
      console.log('Cleaning up conversation subscription');
      if (activeChannels.has(channelKey)) {
        const channelToRemove = activeChannels.get(channelKey);
        if (channelToRemove) {
          supabase.removeChannel(channelToRemove);
          activeChannels.delete(channelKey);
        }
      }
    };
  },

  cleanup: () => {
    console.log('Cleaning up all chat subscriptions');
    
    // Clean up all active channels
    activeChannels.forEach((channel, key) => {
      console.log(`Removing channel: ${key}`);
      supabase.removeChannel(channel);
    });
    
    // Clear the map
    activeChannels.clear();
  }
}));