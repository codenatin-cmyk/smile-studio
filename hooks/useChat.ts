import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Message } from '../lib/types';

export const useChat = (roomId: string, currentUserId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Fetch existing messages and mark unread as read
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
        setLoading(false);

        // Mark unread messages as read (sent by others)
        await markMessagesAsRead(roomId, currentUserId);
       } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  // Function to mark all unread messages (sent by others) as read
  const markMessagesAsRead = async (roomId: string, currentUserId: string) => {
    try {
      // Update messages in Supabase where room_id matches, is_read = false, and sender_id != currentUserId
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('is_read', false)
        .neq('sender_id', currentUserId);

      if (error) throw error;

      // Update local messages state for UI consistency
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.sender_id !== currentUserId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const now = new Date().toISOString();
      
      // Insert the message - set is_read to FALSE by default (will be marked true when recipient opens it)
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: currentUserId,
          content: content.trim(),
          is_read: false,
          created_at: now,
        });

      if (messageError) throw messageError;

      // Update the chat_room's last_message_at timestamp
      const { error: roomError } = await supabase
        .from('chat_room')
        .update({ last_message_at: now })
        .eq('id', roomId);

      if (roomError) throw roomError;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
};