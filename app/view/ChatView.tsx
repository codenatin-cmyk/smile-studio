import { useChat } from "@/hooks/useChat";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useSession } from "@/lib/SessionContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import type { ChatRoom, Message } from "../../lib/types";

interface ChatScreenProps {
  roomId: string;
  currentUserId: string;
  otherUserName?: string;
  role: "clinic" | "patient";
}

type Props = {
  role: "clinic" | "patient";
};

const ChatView: React.FC<Props> = (props) => {
  const { session } = useSession();

  const { width } = useWindowDimensions();
  const [tabScreen, setTabScreen] = useState<"rooms" | "chat">("rooms");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [otherUserName, setOtherUserName] = useState<string>("");
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const { createOrFindRoom, getUserRooms } = useChatRoom();

  const handleRoomSelect = (roomId: string, otherUserName: string) => {
    setSelectedRoomId(roomId);
    setOtherUserName(otherUserName);
    setTabScreen("chat");
  };

  const fetchAvatar = async (userId: string) => {
    if (!userId || avatars[userId]) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (!error && data?.avatar_url) {
      setAvatars((prev) => ({ ...prev, [userId]: data.avatar_url }));
    }
  };

  const handleCreateRoom = async (targetUserId: string) => {
    if (!session?.user?.id) return;

    try {
      const roomId = await createOrFindRoom(session.user.id, targetUserId);
      handleRoomSelect(roomId, "User");
    } catch (error) {
      Alert.alert("Error", "Failed to create chat room");
    }
  };

  const handleBackToRooms = () => {
    setTabScreen("rooms");
    setSelectedRoomId("");
    setOtherUserName("");
    // Refresh rooms list when going back
    if (session?.user?.id) {
      getUserRooms(session.user.id);
    }
  };

  if (!session?.user?.id) {
    return (
      <View style={styles.centerContainer}>
        <Text>You need to be logged in to chat.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {tabScreen === "rooms" ? (
          <ChatRoomsList
            role={props.role}
            currentUserId={session.user.id}
            onRoomSelect={handleRoomSelect}
            onCreateRoom={handleCreateRoom}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: "#f0f0f0" }}
              onPress={handleBackToRooms}
            >
              <Text>← Back to Chats</Text>
            </TouchableOpacity>
            <ChatScreen
              role={props.role}
              roomId={selectedRoomId}
              currentUserId={session.user.id}
              otherUserName={otherUserName}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default ChatView;

export const ChatScreen: React.FC<ChatScreenProps> = ({
  role,
  roomId,
  currentUserId,
  otherUserName = "User",
}) => {
  const [inputText, setInputText] = useState("");
  const { messages, loading, error, sendMessage } = useChat(roomId, currentUserId);
  const flatListRef = useRef<FlatList>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure the layout has been updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Also scroll when keyboard appears (on focus)
  const handleFocus = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      await sendMessage(inputText.trim());
      setInputText("");
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === currentUserId;

    return (
      <View>
        <Text
          style={{
            alignSelf: isMyMessage ? "flex-end" : "flex-start",
            marginHorizontal: 10,
            fontWeight: "600",
            color: "#555",
            marginBottom: 4,
          }}
        >
          {isMyMessage ? "You" : otherUserName}
        </Text>
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={{
              ...styles.timestamp,
              color: isMyMessage ? "#e3f1ffff" : "#555",
            }}
          >
            {new Date(item.created_at).toLocaleString([], {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with {otherUserName}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 10 }}
          onContentSizeChange={() => {
            // Scroll to end when content size changes
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            // Scroll to end when layout is complete
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          alignItems: "flex-end",
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          onFocus={handleFocus}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

interface ChatRoomsListProps {
  role: "clinic" | "patient";
  currentUserId: string;
  onRoomSelect: (roomId: string, otherUserName: string) => void;
  onCreateRoom: (otherUserId: string) => void;
}

export const ChatRoomsList: React.FC<ChatRoomsListProps> = ({
  role,
  currentUserId,
  onRoomSelect,
  onCreateRoom,
}) => {
  const { rooms, loading, getUserRooms, subscribeToMessages } = useChatRoom();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  useEffect(() => {
    if (currentUserId) {
      getUserRooms(currentUserId);
      // Start real-time subscription for message updates
      subscribeToMessages(currentUserId);
    }
  }, [currentUserId]);

  // Sort rooms by last message date (most recent first)
  const sortedRooms = [...rooms].sort((a, b) => {
    // Get most recent message date for room A
    let aLastMessageDate = new Date(a.created_at).getTime();
    if (a.messages && a.messages.length > 0) {
      const aSortedMessages = [...a.messages].sort((m1, m2) => 
        new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime()
      );
      aLastMessageDate = new Date(aSortedMessages[0].created_at).getTime();
    }
    
    // Get most recent message date for room B
    let bLastMessageDate = new Date(b.created_at).getTime();
    if (b.messages && b.messages.length > 0) {
      const bSortedMessages = [...b.messages].sort((m1, m2) => 
        new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime()
      );
      bLastMessageDate = new Date(bSortedMessages[0].created_at).getTime();
    }
    
    return bLastMessageDate - aLastMessageDate; // Descending order (newest first)
  });

 const renderRoom = ({ item }: { item: ChatRoom }) => {
  const otherUserName =
    role === "clinic"
      ? `${item.profiles.first_name} ${item.profiles.last_name}`
      : item?.clinic_profiles?.clinic_name || "Unknown Clinic";

  const otherUserAvatarUrl =
    role === "clinic"
      ? item?.profiles?.avatar_url
      : item?.clinic_profiles?.clinic_photo_url;

  // Count unread messages (messages sent by others that haven't been read)
  const unreadCount = item.messages?.filter(
    (msg) => msg.sender_id !== currentUserId && msg.is_read === false
  ).length || 0;

  // Get the date from the most recent message
  let displayDate = item.created_at; // fallback to room creation date
  
  if (item.messages && item.messages.length > 0) {
    // Find the most recent message by comparing all message dates
    const mostRecentMessage = item.messages.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });
    displayDate = mostRecentMessage.created_at;
  }

  return (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => onRoomSelect(item.id, otherUserName)}
    >
      {/* Avatar */}
      {otherUserAvatarUrl ? (
        <Image
          source={{ uri: otherUserAvatarUrl }}
          style={styles.avatar}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            {
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            },
          ]}
        >
          <FontAwesome5 name="clinic-medical" size={24} color="#4a878bff" />
        </View>
      )}

      {/* Name */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            styles.roomTitle,
            isMobile
              ? otherUserName.length > 25
                ? { fontSize: 14 }
                : { fontSize: 18 }
              : null,
          ]}
          numberOfLines={1}
        >
          {isMobile && otherUserName.length > 25
            ? otherUserName.slice(0, 25) + "..."
            : otherUserName}
        </Text>
      </View>

      {/* Unread badge - positioned on the right */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
        </View>
      )}

      {/* Date - positioned on the right */}
      <Text style={styles.roomDate}>
        {new Date(displayDate).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{...styles.title, textAlign: isMobile ? "center" : "left"}}>Your Chats</Text>
      <FlatList
        data={sortedRooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No chats yet</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#4a90e2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e1e4ea",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 6,
    textAlign: "right",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginRight: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a90e2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "#a5b1c2",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    padding: 20,
    color: "#003f30ff",
  },
  list: {
    flex: 1,
  },
  roomItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  roomDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 60,
    fontSize: 16,
    fontStyle: "italic",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});