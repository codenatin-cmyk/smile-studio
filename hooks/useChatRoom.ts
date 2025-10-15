import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { ChatRoom } from '../lib/types';

export const useChatRoom = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedUserId, setSubscribedUserId] = useState<string | null>(null);

  const createOrFindRoom = async (client1: string, client2: string) => {
    try {
      // First, try to find existing room
      const { data: existingRoom } = await supabase
        .from('chat_room')
        .select(`*,
          clinic_profiles (
            clinic_name,
            clinic_photo_url
          ),
          profiles (
            first_name,
            last_name,
            avatar_url
          )`)
        .or(`and(client1.eq.${client1},client2.eq.${client2}),and(client1.eq.${client2},client2.eq.${client1})`)
        .single();

      if (existingRoom) {
        return existingRoom.id;
      }

      // Create new room if none exists
      const { data: newRoom, error } = await supabase
        .from('chat_room')
        .insert({
          client1,
          client2,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.log(`ERR Cannot create or find chat : ${error}`);
        return null;
      }
      return newRoom.id;
    } catch (error) {
      console.log(`ERR Cannot create or find chat : ${error}`);
      return null;
    }
  };

  const getUserRooms = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_room')
        .select(`
          *,
          clinic_profiles (
            clinic_name,
            clinic_photo_url
          ),
          profiles (
            first_name,
            last_name,
            avatar_url
          ),
          messages (
            id,
            content,
            sender_id,
            created_at,
            is_read
          )
        `)
        .or(`client1.eq.${userId},client2.eq.${userId}`);

      if (error) {
        console.error("Failed to fetch chat rooms:", error);
        setRooms([]);
      } else {
        setRooms(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!subscribedUserId) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Refresh rooms when any message changes
          await getUserRooms(subscribedUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscribedUserId]);

  // Function to start subscription
  const subscribeToMessages = (userId: string) => {
    setSubscribedUserId(userId);
  };

  return {
    rooms,
    loading,
    createOrFindRoom,
    getUserRooms,
    subscribeToMessages,
  };
};