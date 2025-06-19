import React, { useEffect } from 'react';
import IndividualChatScreen from '@/screens/IndividualChatScreen';
import { useChatStore } from '@/store/chatStore';
import { useLocalSearchParams } from 'expo-router';

const ChatDetailsScreen = () => {
  const { id: conversationId } = useLocalSearchParams();

  useEffect(() => {
    if (!conversationId || typeof conversationId !== 'string') return;

    const unsubscribe = useChatStore.getState().subscribeToMessages(conversationId);
    return () => unsubscribe();
  }, [conversationId]);

  return <IndividualChatScreen />;
};

export default ChatDetailsScreen;
