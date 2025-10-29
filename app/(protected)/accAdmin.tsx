import ActivityLogScreen from '@/components/ActivityLogScreen';
import { activityLogger } from '@/hooks/useActivityLogs';
import { useSession } from '@/lib/SessionContext';
import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import * as FileSystem from "expo-file-system";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Modal from "react-native-modal";
import { supabase } from '../../lib/supabase';
import DayScheduleView from "../view/DayScheduleView";
import MapPickerView from "../view/MapPickerView";

export default function Account() {
  const { session, isLoading, signOut } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [adminId, setAdminId] = useState('')
  const [adminName, setNameAdmin] = useState('')
  const [avatarAdmin, setAvatarAdmin] = useState('')

  const [moved, setMoved] = useState(() => {
    // Initialize sidebar state based on screen size
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return windowWidth < 1200; // Collapsed by default on smaller screens
  });
  const [mobilemoved, mobilesetMoved] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [userCount, setUserCount] = useState<number | null>(null);
  const [clinicCount, setClinicCount] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 768;
  const isDesktop = width >= 768;
  const drawerWidth = isMobile ? 370 : isTablet ? 300 : 350;
  const [modalMap, setModalMap] = useState(false);
  
  useEffect(() => {
    if (isDesktop) {
      setMoved(false); // Always show sidebar on desktop
    } else if (isTablet || width < 1200) {
      setMoved(true)
    }
  }, [isDesktop, isTablet, width]);

  const [selectedSunday, setSelectedSunday] = useState("");
  const [selectedMonday, setSelectedMonday] = useState("");
  const [selectedTuesday, setSelectedTuesday] = useState("");
  const [selectedWednesday, setSelectedWednesday] = useState("");
  const [selectedThursday, setSelectedThursday] = useState("");
  const [selectedFriday, setSelectedFriday] = useState("");
  const [selectedSaturday, setSelectedSaturday] = useState("");

  const [userName, setUserName] = useState("");
  const [notifmessage, setNotifMessage] = useState("");

  const [tempID, setTempID] = useState("");
  const [tempWarn, setTempwarn] = useState(false);
  const [tempBan, setTempBan] = useState(false);

  const [modalType, setModalType] = useState<"warn" | "ban" | null>(null);
  const [userMessage, setUserMessage] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reason, setReason] = useState('');

  const [clinicMessage, setClinicMessage] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);

  const [selectedClinicName, setSelectedClinicName] = useState("");
  const [selectedClinicEmail, setSelectedClinicEmail] = useState("");
  const [selectedClinicSlogan, setSelectedClinicSlogan] = useState("");
  const [selectedClinicAddress, setSelectedClinicAddress] = useState("");
  const [selectedClinicMobile, setSelectedClinicMobile] = useState("");
  const [selectedClinicCreatedAt, setSelectedClinicCreatedAt] = useState("");
  const [selectedClinicRole, setSelectedClinicRole] = useState("");
  const [selectedClinicDentist, setSelectedClinicDentist] = useState(false);
  const [selectedClinicImage, setSelectedClinicImage] = useState();
  const [termsOfUse, setTermsOfUse] = useState(false);
  const [selectedCI, setSelectedCI] = useState("");
  const [selectedOffers, setSelectedOffers] = useState("");

  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [denialModalVisible, setDenialModalVisible] = useState(false);
  const [selectedClinicForAction, setSelectedClinicForAction] = useState<any>(null);
  const [denialReason, setDenialReason] = useState("");

  const [selectedClinicId, setSelectedClinicId] = useState<string>();
  const [messageToClinic, setMessageToClinic] = useState<string>();
  const [mapView, setMapView] = useState<[number | undefined, number| undefined]>([undefined,undefined]);

  const offset = moved ? -320 : 0
  const moboffset = moved ? -370 : 0
  const mobbutoffset = moved ? -305: 0

  const [fullProfile, setFullProfile] = useState(false);
  const [viewClinic, setviewClinic] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSignout, setModalSignout] = useState(false);
  const [modalUpdate, setModalUpdate] = useState(false);
  
  const [dashboardView, setDashboardView] = useState('profile');

  const [clinicList, setClinicList] = useState<any[]>([]);

  const [tMap, setTMap] = useState(false);
  const [verified, setVerified] = useState(false);

  const [dentistList, setDentistList] = useState<Dentist[]>([]);
  const [patientUsers, setPatientUsers] = useState<any[]>([]);
  const [showAllClinics, setShowAllClinics] = useState(false);



const [supportModalVisible, setSupportModalVisible] = useState(false);
const [supportInput, setSupportInput] = useState('');
const [supportMessages, setSupportMessages] = useState<any[]>([]);
const [supportLoading, setSupportLoading] = useState(false);
const [supportFilter, setSupportFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

const [verificationRequestCount, setVerificationRequestCount] = useState(0);

useEffect(() => {
  if (dashboardView === 'ar') {
    // Optional: You could add a "last_viewed" timestamp to track when admin checked
    // This is just to give visual feedback that they've seen the notifications
  }
}, [dashboardView]);

// Add this useEffect to fetch and listen for verification requests
useEffect(() => {
  const fetchVerificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('clinic_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('request_verification', true)
        .eq('isVerified', false);
      
      if (error) throw error;
      setVerificationRequestCount(count ?? 0);
    } catch (error) {
      console.error('Error fetching verification count:', error);
    }
  };

  // Initial fetch
  fetchVerificationCount();

  // Set up real-time subscription
  const channel = supabase
    .channel('verification-requests-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'clinic_profiles',
      },
      (payload) => {
        console.log('Clinic profile change detected:', payload);
        // Refetch count whenever any clinic profile changes
        fetchVerificationCount();
      }
    )
    .subscribe();

  // Also refresh count when dashboard view changes to 'ar'
  if (dashboardView === 'ar') {
    fetchVerificationCount();
  }

  return () => {
    supabase.removeChannel(channel);
  };
}, [dashboardView]);


useEffect(() => {
  const fetchPatientUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Patient');

      if (error) throw error;
      setPatientUsers(data || []);
    } catch (err) {
      console.error("Error fetching patient users:", err);
    }
  };

  fetchPatientUsers();
}, []);


const warnUser = async (id, currentStatus, reason) => {
  const newStatus = !currentStatus;

  try {
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('profiles')
      .update({
        isWarning: newStatus,
        notif_message: newStatus ? reason : null,
        isStriked: true,
      })
      .eq('id', id);

    if (error) throw error;

    await activityLogger.log(
      adminId,
      'admin',
      `${newStatus ? 'Warned' : 'Unwarned'} user ${userData.first_name} ${userData.last_name}`
    );


    setPatientUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, isWarning: newStatus, notif_message: newStatus ? reason : null }
          : u
      )
    );
  } catch (err) {
    console.error('Failed to warn/unwarn user:', err);
  }
};

const banUser = async (id, currentStatus, reason) => {
  const newStatus = !currentStatus;

  try {
    // get user info
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // update ban status
    const { error } = await supabase
      .from('profiles')
      .update({
        isBan: newStatus,
        notif_message: newStatus ? reason : null,
      })
      .eq('id', id);

    if (error) throw error;

    // activity log
    await activityLogger.log(
      adminId,
      'admin',
      `${newStatus ? 'Banned' : 'Unbanned'} user ${userData.first_name} ${userData.last_name}`
    );

    // update state
    setPatientUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, isBan: newStatus, notif_message: newStatus ? reason : null }
          : u
      )
    );
  } catch (err) {
    console.error('❌ Failed to ban/unban user:', err);
  }
};
  

const updateSupportStatus = async (messageId: string, status: string, adminNotes?: string) => {
  try {
    const updates: any = { status };
    if (adminNotes !== undefined) {
      updates.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('support_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) throw error;

    Alert.alert('Success', 'Status updated successfully');
  } catch (error) {
    console.error('Error updating support status:', error);
    Alert.alert('Error', 'Failed to update status');
  }
};

const fetchSupportMessages = async () => {
  setSupportLoading(true);
  try {
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    const userIds = [...new Set(messages?.map(m => m.user_id).filter(Boolean))];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, avatar_url')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    const messagesWithProfiles = messages?.map(msg => ({
      ...msg,
      profiles: profileMap.get(msg.user_id) || null
    })) || [];

    setSupportMessages(messagesWithProfiles);
  } catch (error) {
    console.error('Error fetching support messages:', error);
    Alert.alert('Error', 'Failed to load support messages');
  } finally {
    setSupportLoading(false);
  }
};


useEffect(() => {
  async function fetchClinics() {
    try {
      const { data, error } = await supabase
        .from('clinic_profiles')
        .select('*, clinic_schedule(*)');

      if (error) throw error;
      setClinicList(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  }

  fetchClinics();
}, []);

  useEffect(() => {
    getProfile()
    getAdmin()
  }, [])

  useEffect(() => {
  async function loadUserCount() {
    try {
      const { count, error } = await supabase
        .from('profiles')  // or 'auth.users' if you have access
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      setUserCount(count ?? 0);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    }
  }
  loadUserCount();
}, []);

useEffect(() => {
  async function loadClinicCount() {
    try {
      const { count, error } = await supabase
        .from('clinic_profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setClinicCount(count ?? 0);
    } catch (error) {
      console.error('Failed to fetch clinic count:', error);
    }
  }

  loadClinicCount();
}, []);

  useEffect(() => {
    if(!!isMobile){
      setMoved(true)
    }
}, []);



useEffect(() => {
  if (!session?.user?.id) return;

  fetchSupportMessages();

  const channel = supabase
    .channel('admin-support-messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'support_messages',
      },
      (payload) => {
        console.log('Real-time support message change:', payload);

        if (payload.eventType === 'INSERT') {
          fetchSupportMessages();
        } else if (payload.eventType === 'UPDATE') {
          setSupportMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          );
        } else if (payload.eventType === 'DELETE') {
          setSupportMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session?.user?.id]);



  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single()

      if (error && status !== 406) throw error

      if (data) {
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

    useEffect(() => {
      async function fetchClinics() {
        try {
          const { data, error } = await supabase
            .from("clinic_profiles")
            .select("*, clinic_schedule(*)");
  
          if (error) throw error;
          setClinicList(data || []);
        } catch (error) {
          console.error("Error fetching clinics:", error);
        }
      }
  
      fetchClinics();
    }, []);

  async function getAdmin() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('admin_profiles')
        .select(`nameadmin, avatar_url`)
        .eq('id', session?.user.id)
        .single()

      if (error && status !== 406) throw error

      if (data) {
        setAdminId(session.user.id)
        setNameAdmin(data.nameadmin)
        setAvatarAdmin(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need access to your photos to set a profile picture.');
      return;
    }
  
    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // crop to square
      quality: 1,
    });
  
    // If not cancelled
    if (!result.canceled && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const uri = selectedAsset.uri;
  
      // 👇 Set avatar to display it
      setAvatarUrl(uri);
  
      // OPTIONAL: Upload to Supabase or your backend here
    }
  };

  async function updateProfile({
    website,
    avatar_url,
  }: {
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        website,
        avatar_url,
        updated_at: new Date(),
      }

    const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

    const handleUploadAvatar = async (file: File | Blob | string) => {
      try {
        if (!session) throw new Error("No session available");
  
        // 1️⃣ Detect file extension
        let fileExt = "png";
        if (typeof file === "string") {
          const match = file.match(/^data:(image\/\w+);/);
          fileExt = match ? match[1].split("/")[1] : "png";
        } else if (typeof File !== "undefined" && file instanceof File) {
          // Only runs on web
          fileExt = file.name.split(".").pop() ?? "png";
        } else if (file instanceof Blob && file.type) {
          fileExt = file.type.split("/")[1] ?? "png";
        }
  
        // 2️⃣ Normalize to Blob
        let fileData: Blob;
        if (typeof file === "string") {
          // Convert base64 string → Blob
          const base64 = file.split(",")[1];
          const byteChars = atob(base64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileData = new Blob([byteArray], { type: `image/${fileExt}` });
        } else {
          // ✅ Works both on web (File) and mobile (Blob)
          fileData = file as Blob;
        }
  
        // 3️⃣ Create unique path
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
  
        // 4️⃣ Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, fileData, { upsert: true });
  
        if (uploadError) throw uploadError;
  
        // 5️⃣ Get Public URL (bucket must be set to "public")
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) throw new Error("Failed to get public URL");
  
        // 6️⃣ Save to profile table
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", session.user.id);
  
        if (updateError) throw updateError;
  
        // 7️⃣ Update local state
        setAvatarUrl(publicUrl);
      } catch (err: any) {
        console.error("Upload failed:", err.message);
      }
    };
  
    const pickImageMobile = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!result.canceled) {
        const asset = result.assets[0];
  
        // 🔑 Read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        // Convert base64 → Uint8Array
        const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  
        // Guess file extension from uri (png/jpg/jpeg/webp)
        const fileExt = asset.uri.split(".").pop() || "jpg";
  
        // Create unique file name
        const fileName = `${session!.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${session!.user.id}/${fileName}`;
  
        // ✅ Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, byteArray, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });
  
        if (uploadError) {
          console.error("Upload error:", uploadError.message);
          return;
        }
  
        // Get Public URL
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;
  
        // Save to DB
        await supabase.from("clinic_profiles")
          .update({ clinic_photo_url: publicUrl })
          .eq("id", session!.user.id);
  
        setAvatarUrl(publicUrl);
      }
    }
  
    const pickImageWeb = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
          // ✅ Upload to Supabase
          await handleUploadAvatar(file);
        }
      };
      input.click();
    };


useEffect(() => {
  async function fetchRequestedClinics() {
    const { data, error } = await supabase
      .from('clinic_profiles')
      .select('*')
      .eq('request_verification', true);

    if (error) {
      console.error("Error fetching requested clinics:", error);
    } else {
      setClinicList(data || []);
    }
  }

  fetchRequestedClinics();
}, []);


  return (
    <LinearGradient
      colors={['#ffffffff', '#6ce2ffff']}
      style={{ 
        flex: 1, justifyContent: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        width: isMobile ? '100%' : isTablet ? '100%' : '100%',
        position: 'relative',
        
      }}
    > 
      {/* Glider Panel */}
      <View style={{width: isMobile ? drawerWidth : "18%", left: 0, top: 0, flexDirection: 'row', height: '100%', position: 'absolute', zIndex: 1, transform: [{ translateX: isMobile ? mobbutoffset : offset }]}}>
        <LinearGradient
            style={{ ...styles.glider,  bottom: 0, left: 0, top: 0, width: drawerWidth }}
            colors={['#80c4c4ff', '#009b84ff']}
          >
          <View style={{flex: 1}}>

         <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalSignout} onBackdropPress={() => setModalSignout(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 20,
                  alignItems: "center",
                  width: !isMobile ? "30%" : "85%",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Do you wanna signout?
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {/* CANCEL BUTTON */}
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#b32020",
                      paddingVertical: 12,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => setModalSignout(false)}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  {/* SIGNOUT BUTTON */}
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#2ecc71",
                      paddingVertical: 12,
                      borderRadius: 8,
                      marginLeft: 8,
                    }}
                    onPress={() => {
                      console.log("Signing out...");
                      setModalSignout(false);
                      signOut();
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Signout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
          </Modal>
          {(isMobile) && (
            <View style={[{ height: 60}]}>
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: 'transparent',
                  alignSelf: 'flex-end',
                  left: 60,
                  borderRadius: 10,
                  zIndex: 9999,
                }}
                onPress={() => {
                  setMoved((prev) => !prev);
                  setExpanded((prev) => !prev);
                }}
                disabled={loading}
              >
                {moved ? (
                  <MaterialIcons name="keyboard-arrow-right" size={34} color="#00505cff" />
                ) : (
                  <MaterialIcons name="keyboard-arrow-left" size={34} color="#00505cff" />
                )}
              </TouchableOpacity>
            </View>
          )}

            <Image
              source={require('../../assets/favicon.ico.png')}
              style={{...styles.logo, marginTop: isMobile ? -50  : null}}
            />

            <Text style={{fontWeight: 'bold', fontSize: 20, marginTop: -40, color: '#00505cff', textAlign: 'center', }}>SMILE STUDIO</Text>
            <Text style={{fontSize: 12, color: '#00505cff', textAlign: 'center', marginBottom: 7 }}>GRIN CREATORS</Text>
           <View style={{
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  marginBottom: 30,
  borderRadius: 20,
  borderWidth: 2,
  borderColor: '#00505cff',
  alignSelf: 'center',
  minWidth: 120,
}}>
  <Text style={{
    fontSize: 11,
    color: '#00505cff',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
  }}>
    • ADMIN •
  </Text>
</View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#00505cff',
                    borderRadius: 12,
                    marginTop: 0,
                    marginBottom: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                    height: 30,
                    alignSelf: "center",
                    width: "90%",
                    paddingHorizontal: 20
                  }}
                  onPress={() => setModalUpdate(true)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator animating color={"white"} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "white",
                        textTransform: "uppercase",
                        textAlign: "center",
                      }}
                    >
                      Edit Information
                    </Text>
                  )}
                </TouchableOpacity>
            <ScrollView 
              contentContainerStyle={{   
                flexGrow: 1,
                alignItems: "center",
                marginTop: 12,
              }}
              showsVerticalScrollIndicator={false}
              > 
            <View style={{ ...styles.container, width: '100%' }}>

                <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalUpdate} onBackdropPress={() => setModalUpdate(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
                    <View
                      style={{
                        backgroundColor: "white",
                        borderRadius: 12,
                        padding: 20,
                        alignItems: "center",
                        width: !isMobile ? "300px" : "85%",
                        
                       
                      }}
                    >
                      <View style={styles.avatarSection}>
                        
                        <TouchableOpacity
                        onPress={() => {
                          if (Platform.OS === "web") {
                            pickImageWeb();
                          } else {
                            pickImageMobile();
                          }
                        }}
                        style={styles.avatarContainer}>
                          {avatarUrl ? (
                            <Image
                              source={{ uri: avatarUrl ? `${avatarUrl}?t=${Date.now()}` : require("../../assets/default.png") }} // ✅ Type-safe (fallback empty string)
                              style={styles.avatar}
                            />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <MaterialIcons name="person" size={50} color="#ccc" />
                            </View>
                          )}
                          <View style={styles.cameraIcon}>
                            <MaterialIcons name="camera-alt" size={20} color="#007AFF" />
                          </View>
                        </TouchableOpacity>

                        <Text style={styles.avatarText}>Tap to change profile picture</Text>
                      </View>

                      {/* Rest of your profile content */}
                      <View>
                        <Text style={{fontWeight: "bold", fontStyle: "italic", fontSize: 16, textAlign: "center", color: "#003f30ff"}}>{adminName}</Text>
                        <Text style={{fontStyle: "italic", fontSize: 16, textAlign: "center", color: "#003f30ff"}}>{website}</Text>
                      </View>

                      <Text style={{fontWeight: "bold", fontSize: 16, textAlign: "center", color: "#003f30ff"}}>Bio</Text>
                      <TextInput
                        style={{
                          ...styles.contentsmenu,
                          outlineWidth: 0,
                          width: "100%",
                          color: 'black'
                        }}
                        placeholder="add bio..."
                        placeholderTextColor="black"
                        value={website}
                        onChangeText={setWebsite}
                      />

                      <Text
                        style={{
                          fontSize: 18,
                          marginBottom: 20,
                          textAlign: "center",
                          color: 'black'
                        }}
                      >
                        Do you wanna update it?
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        {/* CANCEL BUTTON */}
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "#b32020",
                            paddingVertical: 12,
                            borderRadius: 8,
                            marginRight: 8,
                          }}
                          onPress={() => setModalUpdate(false)}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        {/* SIGNOUT BUTTON */}
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "#2e7dccff",
                            paddingVertical: 12,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}
                          onPress={() => {
                            console.log("Updating...");
                            setModalUpdate(false);
                            updateProfile({ website, avatar_url: avatarUrl });
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            Update
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                </Modal>

<TouchableOpacity
  onPress={() => {
    setDashboardView("profile");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "profile" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="user" size={24} color={dashboardView === "profile" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "profile" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Dashboard
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("activityLogs");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "activityLogs" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="tasks" size={24} color={dashboardView === "activityLogs" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "activityLogs" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Activity Logs
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("clinics");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "clinics" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="hospital-o" size={24} color={dashboardView === "clinics" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "clinics" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Clinics
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("authusers");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "authusers" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="users" size={24} color={dashboardView === "authusers" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "authusers" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Auth Users
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("authclinics");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "authclinics" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="hospital-o" size={24} color={dashboardView === "authclinics" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "authclinics" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Auth Clinics
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("ar");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "ar" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
    position: 'relative', // Important for badge positioning
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="check-circle" size={24} color={dashboardView === "ar" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "ar" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Verify Clinics
      </Text>
      
      {/* Notification Badge */}
      {verificationRequestCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            left: -5,
            backgroundColor: '#ff4444',
            borderRadius: 12,
            minWidth: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
            borderWidth: 2,
            borderColor: dashboardView === "ar" ? '#ffffff' : '#00505cff',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {verificationRequestCount > 99 ? '99+' : verificationRequestCount}
          </Text>
        </View>
      )}
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("chats");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "chats" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="comments" size={24} color={dashboardView === "chats" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "chats" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Support
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("team");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "team" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="cogs" size={24} color={dashboardView === "team" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "team" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        About Us
      </Text>
    </View>
  )}
</TouchableOpacity>

            </View>
            </ScrollView>
<TouchableOpacity
  onPress={() => setModalSignout(true)}
  style={{
    alignSelf: 'center',  // Align to left side
    marginLeft: -35,  // Optional: some left margin
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"white"} />
  ) : (
    <>
      <SimpleLineIcons name="logout" size={24} color="white" />
      <Text style={{ color: 'white', fontSize: 16, marginLeft: 8 }}>
        Logout
      </Text>
    </>
  )}
</TouchableOpacity>
          </View>
          </LinearGradient>
                                           {/* Toggle Button */}
          {(isMobile) && (
            <View style={[styles.toggleButtonWrapper, { height: 60 }]}>
                <TouchableOpacity
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: !moved ? 'transparent' : '#00505cff',
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    zIndex: 9999,
                    shadowColor: !moved ? "transparent" : "#00000045",
                    shadowRadius: !moved ? null : 2,
                    shadowOffset: !moved ? null : { width: 2, height: 2 },
                  }}
                  onPress={() => {
                    setMoved((prev) => !prev);
                    setExpanded((prev) => !prev);
                  }}
                  disabled={loading}
                >
                  {moved ? (
                    <MaterialIcons name="keyboard-arrow-right" size={34} color= {!moved ? 'transparent' : 'white'} />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-left" size={34} color= {!moved ? 'transparent' : 'white'} />
                  )}
                </TouchableOpacity>
            </View>
          )}
      </View>

     

      {/* Dashboard */}
      <LinearGradient style={{ flex: 1, position: 'relative' }} colors={['#b9d7d3ff', '#00505cff']}>

    
          {/* Dashboard Profile --------------------------------------------------------------------------------------- */}
    

        <View style={[styles.dashboard, { width: !isDesktop ? '95%' : expanded ? '80%' : '95%', right: dashboardView === 'profile' ? 11 : 20000, backgroundColor: '#f1f5f9',}]}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, alignSelf: isMobile ? 'center' : 'flex-start', color: '#00505cff'}}>
            Dashboard
          </Text>
                    <View style={styles.proinfo}>
                        <Image
                          source={
                            avatarUrl
                              ? { uri: avatarUrl}
                              : require("../../assets/default.png") // fallback/default image
                          }
                          style={{
                            width: 170,
                            height: 170,
                            borderRadius: 100,
                            borderWidth: 3,
                            borderColor: '#cbd5e1',
                            backgroundColor: "#eaeaea",
                          }}
                        />
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 20,
                          color: '#00505cff',
                          textAlign: "center",
                          marginBottom: 4,
                          marginTop: 10,
                        }}
                      >
                        {adminName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#8a8a8aff",
                          textAlign: "center",
                          marginBottom: 4,
                        }}
                      >
                        {session?.user?.email}
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#416e5dff",
                          fontStyle: "italic",
                          textAlign: "center",
                          marginBottom: 4,
                        }}
                      >
                        {website}
                      </Text>
                    </View>
              <View style={styles.cardRow}>
                <View style={styles.card}>
                    <Text style={{color: '#00505cff', fontWeight: 'bold', fontSize: 50, textAlign: 'center'}}>
                      {userCount !== null ? userCount : '...'}
                    </Text>
                    <Text style={{color: '#00505cff', textAlign: 'center', marginTop: 6, fontSize: isMobile ? 15 : 25 }}>
                      Total Patients
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={{color: '#00505cff', fontWeight: 'bold', fontSize: 50, textAlign: 'center'}}>
                      {clinicCount !== null ? clinicCount : '...'}
                    </Text>
                    <Text style={{color: '#00505cff', textAlign: 'center', marginTop: 6, fontSize: isMobile ? 15 : 25 }}>
                      SJDM Registered Clinics
                    </Text>
                </View>
                
              </View>
              
            </View>
        
        {/* Activity Logs */}
          <View style={[styles.dashboard, { width: !isDesktop ? '95%' : expanded ? '80%' : '95%', right: dashboardView === 'activityLogs' ? 11 : 20000, backgroundColor: '#f1f5f9',}]}>
         
          <ActivityLogScreen />
                  
        </View>

            
        {/* Dashboard Clinics --------------------------------------------------------------------------------------- */}
    
        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "clinics" ? 11 : 20000,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: isMobile ? "center" : "flex-start",
              color: "#00505cff",
            }}
          >
            Clinics
          </Text>
            <ScrollView
              contentContainerStyle={{
                backgroundColor: 'white',
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
            <TouchableOpacity
              style={{
                ...styles.card,
                backgroundColor: '#00505cff',
                marginBottom: 8,
                width: isMobile ? "91%" : "98%",
                height: 50,
                alignSelf: "center",
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                setTMap(true);
              }}
            >
              <FontAwesome5 name="map-marked-alt" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                View All Registered Clinics in Map
              </Text>
            </TouchableOpacity>
            <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={tMap} onBackdropPress={() => setTMap(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
              <View
                style={{
                  width: isMobile ? "90%" : "80%",
                  maxHeight: "90%",
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 20,
                  position: "relative",
                }}
              >
                {/* ✅ Circular red "X" close button in top right */}
                <TouchableOpacity
                  onPress={() => setTMap(false)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    backgroundColor: "#e74c3c",
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 18,
                      lineHeight: 18,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>

                <ScrollView
                  contentContainerStyle={{
                    paddingTop: 10,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      marginBottom: 10,
                      color: "#00505cff",
                      alignSelf: isMobile ? "center" : "flex-start",
                    }}
                  >
                    Map
                  </Text>

                  <Text
                    style={{
                      fontSize: 15,
                      color: "#000",
                      fontStyle: "italic",
                      marginBottom: 10,
                      alignSelf: "flex-start",
                    }}
                  >
                    Click/Tap the pin to view dental clinic details
                  </Text>

                  <View
                    style={{
                      width: "100%",
                      height: isMobile ? 350 : 450,
                      marginBottom: 20,
                    }}
                  >
                    <MapPickerView allowEdit={false} pins={clinicList} />
                  </View>
                </ScrollView>
              </View> 
            </Modal>

          {clinicList.length === 0 ? (
            <Text style={{ textAlign: "center" }}>No clinics found.</Text>
          ) : (
            <>
              <View style={{ flexDirection: isMobile ? "column" : "row", flexWrap: isMobile ? "nowrap" : "wrap", justifyContent: isMobile ? "flex-start" : "center", }} >
                {clinicList
                  .filter((clinic) => clinic.isFirst === false)
                  .slice(0, showAllClinics ? clinicList.length : 8) // Show only 8 clinics unless "showAllClinics" is true
                  .map((clinic, index) => (
                    <LinearGradient
                      colors={["#ffffffff", "#bdeeffff"]}
                      key={clinic.id || index}
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#fff",
                        padding: 20,
                        margin: 8,
                        borderRadius: 16,
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 4,
                        alignItems: "center",
                        minHeight: 140,
                       width: width < 1024 ? "95%" : "45%",
                      }}
                    >
                    {/* Left side: Image + Info */}
                    <View style={{ flex: 7, flexDirection: "row", alignItems: "center", marginLeft: 4, }} >
                      <View style={{ position: "relative" }}>
                        {clinic.clinic_photo_url ? (
                          <Image
                            source={{ uri: clinic.clinic_photo_url }}
                            style={{
                              width: isMobile ? 70 : 100,
                              height: isMobile ? 70 : 100,
                              borderRadius: 16,
                              marginRight: 16,
                              backgroundColor: "#fff",
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: isMobile ? 70 : 100,
                              height: isMobile ? 70 : 100,
                              borderRadius: 16,
                              marginRight: 16,
                              backgroundColor: "#fff",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <FontAwesome5 name="clinic-medical" size={64} color="#4a878bff" />
                          </View>
                        )}

                        {/* Small Button Overlay */}
                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            bottom: -4,
                            backgroundColor: "rgba(0,0,0,0.4)",
                            right: 6,
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                          }}
                          onPress={() => {
                            setSelectedSunday(clinic.clinic_schedule[0]?.sunday || {});
                            setSelectedMonday(clinic.clinic_schedule[0]?.monday || {});
                            setSelectedTuesday(clinic.clinic_schedule[0]?.tuesday || {});
                            setSelectedWednesday(clinic.clinic_schedule[0]?.wednesday || {});
                            setSelectedThursday(clinic.clinic_schedule[0]?.thursday || {});
                            setSelectedFriday(clinic.clinic_schedule[0]?.friday || {});
                            setSelectedSaturday(clinic.clinic_schedule[0]?.saturday || {});

                            setSelectedClinicName(clinic.clinic_name);
                            setSelectedClinicEmail(clinic.email);
                            setSelectedClinicSlogan(clinic.bio);
                            setSelectedClinicAddress(clinic.address);
                            setSelectedClinicMobile(clinic.mobile_number);
                            setSelectedClinicCreatedAt(clinic.created_at);
                            setSelectedClinicRole(clinic.role);
                            setSelectedClinicDentist(clinic.isDentistAvailable);
                            setSelectedClinicImage(clinic.clinic_photo_url);
                            setviewClinic(true);
                            setSelectedClinicId(clinic.id);
                            setMapView([clinic.longitude, clinic.latitude]);
                            setSelectedCI(clinic.introduction);
                            setSelectedOffers(clinic.offers);
                            setVerified(clinic.isVerified);
                            setDentistList(clinic.dentists)
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: isMobile ? 8 : 10 }}>View Clinic</Text>
                        </TouchableOpacity>

                        {/* Modal */}
                       <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={viewClinic} onBackdropPress={() => setviewClinic(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>                    
                          <View
                            style={{
                              backgroundColor: "#fff",
                              borderRadius: 20,
                              padding: 24,
                              width: isMobile ? "90%" : "60%",
                              elevation: 8,
                              borderWidth: 2,
                              borderColor: "rgba(214, 214, 214, 1)",
                              position: "relative",
                            }}
                          >
                            {/* ❌ Top-Right Close Button */}
                            <TouchableOpacity
                              onPress={() => setviewClinic(false)}
                              style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                zIndex: 10,
                                padding: 8,
                                borderRadius: 20,
                                width: 36,
                                height: 36,
                                backgroundColor: "#da3434ff",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#da3434ff",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                              }}
                            >
                              <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>×</Text>
                            </TouchableOpacity>

                            {/* Profile Header */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 20,
                                paddingRight: 40,
                              }}
                            >
                              {selectedClinicImage ? (
                                <Image
                                  source={{ uri: selectedClinicImage }}
                                  style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    marginRight: 16,
                                    backgroundColor: "#f2f2f2",
                                    borderWidth: 3,
                                    borderColor: "rgba(214, 214, 214, 1)",
                                  }}
                                />
                              ) : (
                                <View
                                  style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    marginRight: 16,
                                    backgroundColor: "#e8f4f5",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 3,
                                    borderColor: "rgba(214, 214, 214, 1)",
                                  }}
                                >
                                  <FontAwesome5 name="clinic-medical" size={40} color="#4a878bff" />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text style={{  fontSize: isMobile ? 16 : 22, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 }}>
                                  {selectedClinicName || "Unnamed Clinic"}
                                </Text>
                                <View
                                  style={{
                                    backgroundColor: verified ? "#e8f5e9" : "#ffebee",
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    alignSelf: "flex-start",
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text style={{ fontSize: 11, color: verified ? "#2e7d32" : "#c62828", fontWeight: "600" }}>
                                    {verified ? "✅ Verified Clinic" : "❌ Unverified"}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 13, color: "#3c6422ff", marginBottom: 2 }}>
                                  {selectedClinicEmail}
                                </Text>
                                {selectedClinicSlogan && (
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      color: "#416e5dff",
                                      fontStyle: "italic",
                                      marginTop: 2,
                                    }}
                                  >
                                    "{selectedClinicSlogan}"
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* Divider */}
                            <View
                              style={{
                                height: 2,
                                backgroundColor: "#f0f0f0",
                                marginBottom: 20,
                                borderRadius: 1,
                              }}
                            />

                            {/* Info Section */}
                            <View style={{ gap: 12, marginBottom: 20 }}>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: "#e8f4f5",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 16 }}>📍</Text>
                                </View>
                                <Text style={{ fontSize: 14, color: "#333", flex: 1 }}>
                                  {selectedClinicAddress || "No address provided"}
                                </Text>
                              </View>

                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: "#e8f4f5",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 16 }}>📞</Text>
                                </View>
                                <Text style={{ fontSize: 14, color: "#333" }}>
                                  {selectedClinicMobile || "No contact"}
                                </Text>
                              </View>

                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: "#e8f4f5",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 16 }}>🗓️</Text>
                                </View>
                                <Text style={{ fontSize: 14, color: "#333", width: '90%' }}>
                                  Joined: {selectedClinicCreatedAt || "N/A"}
                                </Text>
                              </View>

                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: selectedClinicDentist ? "#e8f5e9" : "#ffebee",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 16 }}>🦷</Text>
                                </View>
                                <Text style={{ fontSize: 14, color: "#333" }}>
                                  Dentist: {selectedClinicDentist ? "Available" : "Not Available"}
                                </Text>
                              </View>
                            </View>

                            {/* Schedule Section */}
                            <View
                              style={{
                                backgroundColor: "#f8f9fa",
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 20,
                              }}
                            >
                              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 }}>
                                📅 Clinic Schedule
                              </Text>
                              <View style={{ gap: 6 }}>
                                {[
                                  { label: "Sunday", time: selectedSunday },
                                  { label: "Monday", time: selectedMonday },
                                  { label: "Tuesday", time: selectedTuesday },
                                  { label: "Wednesday", time: selectedWednesday },
                                  { label: "Thursday", time: selectedThursday },
                                  { label: "Friday", time: selectedFriday },
                                  { label: "Saturday", time: selectedSaturday },
                                ].map((day) => (
                                  <DayScheduleView
                                    key={day.label}
                                    label={day.label}
                                    time={
                                      day.time
                                        ? {
                                            ...day.time,
                                            from: {
                                              ...day.time.from,
                                              minute: day.time.from?.minute?.toString().padStart(2, "0"),
                                            },
                                            to: {
                                              ...day.time.to,
                                              minute: day.time.to?.minute?.toString().padStart(2, "0"),
                                            },
                                          }
                                        : undefined
                                    }
                                  />
                                ))}

                                {/* If all days have no schedule */}
                                {[
                                  selectedSunday,
                                  selectedMonday,
                                  selectedTuesday,
                                  selectedWednesday,
                                  selectedThursday,
                                  selectedFriday,
                                  selectedSaturday,
                                ].every((day) => !day || day.from == null || day.to == null) && (
                                  <Text
                                    style={{
                                      color: "#999",
                                      fontSize: 14,
                                      textAlign: "center",
                                      marginTop: 8,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No schedule available
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* View Full Button */}
                            <TouchableOpacity
                              onPress={() => {
                                setFullProfile(true);
                              }}
                              style={{
                                backgroundColor: "#2ecc71",
                                paddingVertical: 14,
                                borderRadius: 12,
                                alignItems: "center",
                                elevation: 4,
                              }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                View Full Profile
                              </Text>
                            </TouchableOpacity>
                          </View>
                   
                      </Modal>
                      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={fullProfile} onBackdropPress={() => setFullProfile(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                      
                        <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
                          
                          {/* Header with Back Button */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingTop: 25,
                              paddingHorizontal: 16,
                              paddingBottom: 12,
                              borderBottomWidth: 1,
                              borderColor: "#e0e0e0",
                              backgroundColor: "white",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.05,
                              shadowRadius: 3,
                              elevation: 2,
                            }}
                          >
                            <TouchableOpacity 
                              onPress={() => setFullProfile(false)}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "#f1f5f9",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MaterialIcons
                                name="keyboard-arrow-left"
                                size={28}
                                color="#00505cff"
                              />
                            </TouchableOpacity>
                            <Text
                              style={{
                                fontSize: 22,
                                fontWeight: "bold",
                                marginLeft: 12,
                                color: "#00505cff",
                              }}
                            >
                              Clinic Profile
                            </Text>
                          </View>

                          <ScrollView style={{ backgroundColor: '#f8fafc' }}>

                            {/* Cover Photo and Profile Picture */}
                            <View style={{ position: "relative", marginBottom: 80 }}>
                              {/* Cover Photo */}
                              <View
                                style={{
                                  width: isMobile ? "95%" : "60%",
                                  height: 200,
                                  alignSelf: "center",
                                  marginTop: isMobile ? 8 : 26,
                                  borderRadius: 16,
                                  backgroundColor: "#d9d9d9",
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.1,
                                  shadowRadius: 8,
                                  elevation: 4,
                                }}
                              />
                              
                              {/* Profile Picture */}
                              <View
                                style={{
                                  position: "absolute",
                                  top: 125,
                                  left: 0,
                                  right: 0,
                                  alignItems: "center",
                                }}
                              >
                                {selectedClinicImage ? (
                                  <Image
                                    source={{ uri: selectedClinicImage }}
                                    style={{
                                      width: 150,
                                      height: 150,
                                      borderRadius: 75,
                                      borderWidth: 5,
                                      borderColor: "#fff",
                                      backgroundColor: "#e0e0e0",
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 4 },
                                      shadowOpacity: 0.15,
                                      shadowRadius: 8,
                                      elevation: 5,
                                    }}
                                  />
                                ) : (
                                  <View
                                    style={{
                                      width: 150,
                                      height: 150,
                                      borderRadius: 75,
                                      borderWidth: 5,
                                      borderColor: "#fff",
                                      backgroundColor: "#e8f4f5",
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 4 },
                                      shadowOpacity: 0.15,
                                      shadowRadius: 8,
                                      elevation: 5,
                                    }}
                                  >
                                    <FontAwesome5 name="clinic-medical" size={70} color="#4a878bff" />
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* Scrollable Content */}
                            <View style={{ paddingHorizontal: 16, paddingLeft: isMobile ? 16 : "20%", paddingRight: isMobile ? 16 : "20%" }}>

                              {/* Clinic Details Section */}
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  color: "#003f30",
                                  marginBottom: 12,
                                  marginTop: 8,
                                }}
                              >
                                Clinic Details
                              </Text>

                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  borderRadius: 16,
                                  padding: 20,
                                  marginBottom: 24,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.08,
                                  shadowRadius: 8,
                                  elevation: 3,
                                }}
                              >
                                <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#1a1a1a" }}>
                                  {selectedClinicName || "Unnamed Clinic"}
                                </Text>
                                
                                <View
                                  style={{
                                    backgroundColor: verified ? "#e8f5e9" : "#ffebee",
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    alignSelf: "flex-start",
                                    marginBottom: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 12, color: verified ? "#2e7d32" : "#c62828", fontWeight: "600" }}>
                                    {verified ? "✅ Verified Clinic" : "❌ Unverified Clinic"}
                                  </Text>
                                </View>

                                <Text style={{ fontSize: 15, color: "#0b5a51", marginBottom: 6 }}>
                                  {selectedClinicEmail}
                                </Text>
                                
                                {selectedClinicSlogan && (
                                  <Text style={{ fontSize: 15, fontStyle: "italic", color: "#416e5dff", marginBottom: 16, paddingLeft: 4 }}>
                                    "{selectedClinicSlogan}"
                                  </Text>
                                )}

                                <View style={{ gap: 10, marginTop: 8 }}>
                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: "#f1f5f9",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10,
                                      }}
                                    >
                                      <Text style={{ fontSize: 16 }}>📍</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: "#333", flex: 1 }}>
                                      {selectedClinicAddress || "No address provided"}
                                    </Text>
                                  </View>

                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: "#f1f5f9",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10,
                                      }}
                                    >
                                      <Text style={{ fontSize: 16 }}>📞</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: "#333" }}>
                                      {selectedClinicMobile || "No contact"}
                                    </Text>
                                  </View>

                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: "#f1f5f9",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10,
                                      }}
                                    >
                                      <Text style={{ fontSize: 16 }}>🗓️</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: "#333", width: '90%' }}>
                                      Joined: {selectedClinicCreatedAt || "N/A"}
                                    </Text>
                                  </View>

                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: selectedClinicDentist ? "#e8f5e9" : "#ffebee",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 10,
                                      }}
                                    >
                                      <Text style={{ fontSize: 16 }}>🦷</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: "#333" }}>
                                      Dentist: {selectedClinicDentist ? "Available" : "Not Available"}
                                    </Text>
                                  </View>
                                </View>

                                {!isMobile && (
                                  <TouchableOpacity
                                    onPress={() => setModalMap(true)}
                                    style={{
                                      backgroundColor: "#f39c12",
                                      paddingVertical: 14,
                                      paddingHorizontal: 20,
                                      borderRadius: 12,
                                      marginTop: 16,
                                      alignItems: "center",
                                      flexDirection: "row",
                                      justifyContent: "center",
                                      shadowColor: "#f39c12",
                                      shadowOffset: { width: 0, height: 3 },
                                      shadowOpacity: 0.3,
                                      shadowRadius: 6,
                                      elevation: 4,
                                    }}
                                  >
                                    <FontAwesome5 name="map-marker-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>View in Map</Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* Introduction Section */}
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  color: "#003f30",
                                  marginBottom: 12,
                                }}
                              >
                                Introduction
                              </Text>

                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  borderRadius: 16,
                                  padding: 20,
                                  marginBottom: 24,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.08,
                                  shadowRadius: 8,
                                  elevation: 3,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: selectedCI ? 15 : 14,
                                    lineHeight: 22,
                                    color: selectedCI ? "#333" : "#999",
                                    textAlign: selectedCI ? "left" : "center",
                                    fontStyle: selectedCI ? "normal" : "italic",
                                  }}
                                >
                                  {selectedCI || "Introduction has not yet been set"}
                                </Text>
                              </View>

                              {/* Clinic's Dentist Section */}
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  color: "#003f30",
                                  marginBottom: 12,
                                }}
                              >
                                Clinic's Dentists
                              </Text>

                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  borderRadius: 16,
                                  padding: 20,
                                  marginBottom: 24,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.08,
                                  shadowRadius: 8,
                                  elevation: 3,
                                }}
                              >
                                {(() => {
                                  try {
                                    const dentists = JSON.parse(dentistList);
                                    return dentists.map((d, i) => (
                                      <View 
                                        key={i} 
                                        style={{ 
                                          marginBottom: 16,
                                          paddingBottom: i < dentists.length - 1 ? 16 : 0,
                                          borderBottomWidth: i < dentists.length - 1 ? 1 : 0,
                                          borderBottomColor: "#f0f0f0",
                                        }}
                                      >
                                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                          <View
                                            style={{
                                              width: 36,
                                              height: 36,
                                              borderRadius: 18,
                                              backgroundColor: "#e8f4f5",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              marginRight: 10,
                                            }}
                                          >
                                            <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
                                          </View>
                                          <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, color: "#1a1a1a", fontWeight: "bold" }}>
                                              Dr. {d.name}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                                              {d.specialty}
                                            </Text>
                                          </View>
                                        </View>

                                        {Object.entries(d.weeklySchedule || {}).map(([day, slots], j) =>
                                          slots.length > 0 ? (
                                            <View key={j} style={{ marginLeft: 46, marginTop: 6 }}>
                                              <Text style={{ fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 2 }}>
                                                {day.charAt(0).toUpperCase() + day.slice(1)}:
                                              </Text>
                                              {slots.map((s, k) => (
                                                <Text key={k} style={{ fontSize: 13, color: "#666", marginLeft: 8, marginTop: 2 }}>
                                                  • {s}
                                                </Text>
                                              ))}
                                            </View>
                                          ) : null
                                        )}
                                      </View>
                                    ));
                                  } catch {
                                    return (
                                      <Text style={{
                                        fontSize: 14,
                                        color: "#999",
                                        textAlign: "center",
                                        fontStyle: "italic",
                                      }}>
                                        Dentist list has not yet been set
                                      </Text>
                                    );
                                  }
                                })()}
                              </View>

                              {/* Offers Section */}
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  color: "#003f30",
                                  marginBottom: 12,
                                }}
                              >
                                Offers
                              </Text>

                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  borderRadius: 16,
                                  padding: 20,
                                  marginBottom: 24,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.08,
                                  shadowRadius: 8,
                                  elevation: 3,
                                }}
                              >
                                {selectedOffers && selectedOffers.trim() !== '' ? (
                                  <View style={{ gap: 8 }}>
                                    {selectedOffers
                                      .split('?')
                                      .filter(offer => offer.trim() !== '')
                                      .map((offer, i) => (
                                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                                          <Text style={{ fontSize: 15, color: "#4a878bff", marginRight: 8, marginTop: 2 }}>•</Text>
                                          <Text style={{ fontSize: 15, color: "#333", flex: 1, lineHeight: 22 }}>
                                            {offer.trim()}
                                          </Text>
                                        </View>
                                      ))}
                                  </View>
                                ) : (
                                  <Text style={{
                                    fontSize: 14,
                                    color: "#999",
                                    textAlign: "center",
                                    fontStyle: "italic",
                                  }}>
                                    Offers have not yet been set
                                  </Text>
                                )}
                              </View>

                              {/* Clinic Schedule Section */}
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  color: "#003f30",
                                  marginBottom: 12,
                                }}
                              >
                                Clinic Schedule
                              </Text>

                              <View
                                style={{
                                  backgroundColor: "#fff",
                                  borderRadius: 16,
                                  padding: 20,
                                  marginBottom: 200,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.08,
                                  shadowRadius: 8,
                                  elevation: 3,
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 12,
                                  }}
                                >
                                  {[
                                    { label: "Sun", time: selectedSunday },
                                    { label: "Mon", time: selectedMonday },
                                    { label: "Tue", time: selectedTuesday },
                                    { label: "Wed", time: selectedWednesday },
                                    { label: "Thu", time: selectedThursday },
                                    { label: "Fri", time: selectedFriday },
                                    { label: "Sat", time: selectedSaturday },
                                  ].map((day) => {
                                    const hasValidTime = day.time && day.time.from && day.time.to;
                                    const formattedTime = hasValidTime
                                      ? {
                                          ...day.time,
                                          from: {
                                            ...day.time.from,
                                            minute: day.time.from.minute?.toString().padStart(2, "0"),
                                          },
                                          to: {
                                            ...day.time.to,
                                            minute: day.time.to.minute?.toString().padStart(2, "0"),
                                          },
                                        }
                                      : undefined;

                                    return (
                                      <View
                                        key={day.label}
                                        style={{
                                          flex: isMobile ? 0 : 1,
                                          minWidth: isMobile ? "30%" : "auto",
                                          alignItems: "center",
                                          backgroundColor: hasValidTime ? "#f8fafc" : "#fff5f5",
                                          padding: 12,
                                          borderRadius: 12,
                                          borderWidth: 1,
                                          borderColor: hasValidTime ? "#e2e8f0" : "#fee",
                                        }}
                                      >
                                        <Text style={{ fontWeight: "700", fontSize: isMobile ? 13 : 15, marginBottom: 6, color: "#1a1a1a" }}>
                                          {day.label}
                                        </Text>
                                        {formattedTime ? (
                                          <Text
                                            style={{
                                              fontSize: isMobile ? 10 : 13,
                                              color: "#555",
                                              textAlign: "center",
                                              lineHeight: isMobile ? 14 : 18,
                                            }}
                                          >
                                            {`${formattedTime.from.hour.toString().padStart(2, "0")}:${formattedTime.from.minute} ${formattedTime.from.atm}`}
                                            {'\n'}
                                            {`${formattedTime.to.hour.toString().padStart(2, "0")}:${formattedTime.to.minute} ${formattedTime.to.atm}`}
                                          </Text>
                                        ) : (
                                          <Text
                                            style={{
                                              fontSize: isMobile ? 11 : 13,
                                              color: "#c62828",
                                              fontWeight: "600",
                                              textAlign: "center",
                                            }}
                                          >
                                            Closed
                                          </Text>
                                        )}
                                      </View>
                                    );
                                  })}
                                </View>

                                {[
                                  selectedSunday,
                                  selectedMonday,
                                  selectedTuesday,
                                  selectedWednesday,
                                  selectedThursday,
                                  selectedFriday,
                                  selectedSaturday,
                                ].every((day) => !day || !day.from || !day.to) && (
                                  <Text
                                    style={{
                                      color: "#999",
                                      fontSize: 14,
                                      textAlign: "center",
                                      marginTop: 16,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No schedule available
                                  </Text>
                                )}
                              </View>
                            </View>
                          </ScrollView>

                          {isMobile && (
                            <View
                              style={{
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderTopWidth: 1,
                                borderColor: "#e0e0e0",
                                backgroundColor: "white",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: -2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 3,
                                elevation: 5,
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => setModalMap(true)}
                                style={{
                                  backgroundColor: "#f39c12",
                                  paddingVertical: 14,
                                  paddingHorizontal: 20,
                                  borderRadius: 12,
                                  alignItems: "center",
                                  flexDirection: "row",
                                  justifyContent: "center",
                                  shadowColor: "#f39c12",
                                  shadowOffset: { width: 0, height: 3 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 6,
                                  elevation: 4,
                                }}
                              >
                                <FontAwesome5 name="map-marker-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>View in Map</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </Modal>

                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: isMobile ? 15 : 18,
                            marginBottom: 6,
                            color: 'black'
                          }}
                        >
                          {clinic.clinic_name || "Unnamed Clinic"}
                        </Text>
                        <Text style={{ marginBottom: 2, fontSize: isMobile ? 13 : 16, color: 'black' }}>
                          {clinic.address || "No address provided"}
                        </Text>
                      </View>
                    </View>

                    {/* Right side: Buttons */}
                    <View style={{ flex: 3, justifyContent: "space-around" }}>
                      <TouchableOpacity
                        onPress={() => {
                          console.log(`Proceed to map: ${clinic.id}`);
                          setSelectedClinicId(clinic.id);
                          setModalMap(true);
                          setMapView([clinic.longitude, clinic.latitude]);
                        }}
                        style={{
                          backgroundColor: "#0058aaff",
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: isMobile ? 9 : 14,
                            textAlign: "center",
                          }}
                        >
                          Check in Map
                        </Text>
                      </TouchableOpacity>

                      {/* Modal: Map View */}
                     <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalMap} onBackdropPress={() => setModalMap(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>

                          <View
                            style={{
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#ccc",
                              padding: 20,
                              width: !isMobile ? "90%" : "100%",
                              position: "relative",
                            }}
                          >
                            {/* ✅ Circular red close button in upper right */}
                            <TouchableOpacity
                              onPress={() => setModalMap(false)}
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                zIndex: 10,
                                backgroundColor: "#e74c3c",
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18, lineHeight: 18 }}>
                                ×
                              </Text>
                            </TouchableOpacity>

                            <Text
                              style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                marginBottom: 20,
                                alignSelf: isMobile ? "center" : "flex-start",
                                color: "#00505cff",
                              }}
                            >
                              Map
                            </Text>

                            {(mapView[0] || mapView[1]) ? (
                              <MapPickerView
                                pinLongitude={mapView[0]}
                                pinLatitude={mapView[1]}
                                allowEdit={false}
                              />
                            ) : (
                              <Text>No map provided by the clinic</Text>
                            )}
                          </View>
                
                      </Modal>
                    </View>
                  </LinearGradient>
                ))}
              </View>
              {/* Show More / Show Less Button */}
              {clinicList.filter((clinic) => clinic.isFirst === false).length > 8 && (
                <View style={{ alignItems: "center", marginTop: 20, marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => setShowAllClinics(!showAllClinics)}
                    style={{
                      backgroundColor: "#00505cff",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 8,
                      shadowColor: "#000",
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      {showAllClinics ? "Show Less" : `Show More (${clinicList.filter((clinic) => clinic.isFirst === false).length - 8} more)`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
            </ScrollView>
        </View>

        {/* Dashboard Auth Users --------------------------------------------------------------------------------------- */}

        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "authusers" ? 11 : 20000,
            },
          ]}
        >
         <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: isMobile ? "center" : "flex-start",
              color: "#00505cff",
            }}
          >
            Auth Users
          </Text>
          {isMobile ? (
            // 📱 Mobile Layout (Card style)
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {patientUsers.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: 20, color: "gray" }}>- No Patients -</Text>
                </View>
              ) : (
                patientUsers.map((user, index) => (
                  <View
                    key={user.id}
                    style={{
                      backgroundColor: "#f9f9f9",
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: "#ccc",
                    }}
                  >
                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Name:</Text>
                    <Text style={{ marginBottom: 10 }}>{`${user.first_name || ""} ${user.last_name || ""}`}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Gender:</Text>
                    <Text style={{ marginBottom: 10 }}>{user.gender || "N/A"}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Birthdate:</Text>
                    <Text style={{ marginBottom: 10 }}>{user.birthdate || "N/A"}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Mobile:</Text>
                    <Text style={{ marginBottom: 10 }}>{user.mobile_number || "N/A"}</Text>

                    <Text style={{ fontWeight: "700", marginBottom: 6 }}>Striked:</Text>
                    <Text style={{ marginBottom: 10 }}>{user.isStriked ? "Yes" : "No"}</Text>

                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <TouchableOpacity
                        onPress={() => {
                          setModalType("warn");
                          setSelectedUser(user);
                          setUserMessage(true);
                        }}
                        style={{
                          backgroundColor: user.isWarning ? "#7f8c8d" : "#f39c12",
                          padding: 8,
                          borderRadius: 5,
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ color: "#fff", textAlign: "center" }}>
                          {user.isWarning ? "Unwarn" : "Warn"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setModalType("ban");
                          setSelectedUser(user);
                          setUserMessage(true);
                        }}
                        style={{
                          backgroundColor: user.isBan ? "#7f8c8d" : "#c0392b",
                          padding: 8,
                          borderRadius: 5,
                          flex: 1,
                        }}
                      >
                        <Text style={{ color: "#fff", textAlign: "center" }}>
                          {user.isBan ? "Unban" : "Ban"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
          // 🖥️ Desktop / Tablet Patient Table
          <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, minWidth: 900 }}>
              {patientUsers.length === 0 ? (
                <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: 20, color: "gray" }}>- No Patients -</Text>
                </View>
              ) : (
                <>
                  {/* Header Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#00505cff",
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      minWidth: "100%",
                    }}
                  >
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Name</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Gender</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Birthdate</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Mobile</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Striked?</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Actions</Text>
                  </View>

                  {/* Rows */}
                  <ScrollView>
                  {patientUsers.map((user, index) => (
                    <View
                      key={user.id}
                      style={{
                        flexDirection: "row",
                        borderBottomWidth: 1,
                        borderColor: "#ccc",
                        paddingVertical: 20,
                        paddingHorizontal: 20,
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ flex: 1 }}>{`${user.first_name || ""} ${user.last_name || ""}`}</Text>
                      <Text style={{ flex: 1 }}>{user.gender || "N/A"}</Text>
                      <Text style={{ flex: 1 }}>{user.birthdate || "N/A"}</Text>
                      <Text style={{ flex: 1 }}>{user.mobile_number || "N/A"}</Text>
                      <Text style={{ flex: 1 }}>{user.isStriked ? "Yes" : "No"}</Text>

                      <View style={{ flex: 1, flexDirection: "row" }}>
                        {/* Warn Button */}
                        <TouchableOpacity
                          onPress={() => {
                            setModalType("warn");
                            setSelectedUser(user);
                            setUserMessage(true);
                          }}
                          style={{
                            backgroundColor: user.isWarning ? "#7f8c8d" : "#f39c12",
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 4,
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12 }}>
                            {user.isWarning ? "Unwarn" : "Warn"}
                          </Text>
                        </TouchableOpacity>

                        {/* Ban Button */}
                        <TouchableOpacity
                          onPress={() => {
                            setModalType("ban");
                            setSelectedUser(user);
                            setUserMessage(true);
                          }}
                          style={{
                            backgroundColor: user.isBan ? "#7f8c8d" : "#c0392b",
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12 }}>
                            {user.isBan ? "Unban" : "Ban"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  </ScrollView>
                </>
              )}
            </View>
          </ScrollView>
          )}

        </View>

        {userMessage && (
           <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={userMessage} onBackdropPress={() => setUserMessage(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>

              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 8,
                  width: '80%',
                  maxWidth: 400,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                  {modalType === 'warn'
                    ? selectedUser?.isWarning
                      ? `Unwarn ${selectedUser?.first_name} ${selectedUser?.last_name}`
                      : `Warn ${selectedUser?.first_name} ${selectedUser?.last_name}`
                    : selectedUser?.isBan
                    ? `Unban ${selectedUser?.first_name} ${selectedUser?.last_name}`
                    : `Ban ${selectedUser?.first_name} ${selectedUser?.last_name}`}
                </Text>

                {/* Reason input (only shown when issuing a warn or ban) */}
                {((modalType === 'warn' && !selectedUser?.isWarning) ||
                  (modalType === 'ban' && !selectedUser?.isBan)) && (
                  <>
                    <Text style={{ marginBottom: 5 }}>Reason:</Text>
                    <TextInput
                      placeholder="Enter reason"
                      value={reason}
                      onChangeText={setReason}
                      style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 5,
                        padding: 10,
                        marginBottom: 10,
                        height: 80,
                        textAlignVertical: 'top',
                      }}
                      multiline
                    />
                  </>
                )}

                {/* Confirmation text for unban/unwarn */}
                {((modalType === 'warn' && selectedUser?.isWarning) ||
                  (modalType === 'ban' && selectedUser?.isBan)) && (
                  <Text style={{ marginBottom: 10 }}>
                    Are you sure you want to {modalType === 'warn' ? 'unwarn' : 'unban'} this user?
                  </Text>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setUserMessage(false);
                      setSelectedUser(null);
                      setReason('');
                    }}
                    style={{ marginRight: 15 }}
                  >
                    <Text style={{ color: '#888' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (!selectedUser) return;

                      const needsReason =
                        (modalType === 'warn' && !selectedUser.isWarning) ||
                        (modalType === 'ban' && !selectedUser.isBan);

                      if (needsReason && reason.trim() === '') {
                        alert('Please enter a reason');
                        return;
                      }

                      if (modalType === 'warn') {
                        await warnUser(selectedUser.id, selectedUser.isWarning, reason);
                      } else if (modalType === 'ban') {
                        await banUser(selectedUser.id, selectedUser.isBan, reason);
                      }

                      setUserMessage(false);
                      setSelectedUser(null);
                      setReason('');
                    }}
                  >
                    <Text style={{ color: '#007BFF', fontWeight: 'bold' }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
      
          </Modal>
        )}


        {/* Dashboard Auth Clinics --------------------------------------------------------------------------------------- */}

        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "authclinics" ? 11 : 20000,
            },
          ]}
        >
         <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: isMobile ? "center" : "flex-start",
              color: "#00505cff",
            }}
          >
            Auth Clinics
          </Text>
        {isMobile ? (
          // 📱 Mobile Layout (Card style)
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {clinicList.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Text style={{ fontSize: 20, color: "gray" }}>- No Clinics -</Text>
              </View>
            ) : (
              clinicList.map((clinic, index) => (
                <View
                  key={clinic.id}
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: "#ccc",
                  }}
                >
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Clinic Name:</Text>
                  <Text style={{ marginBottom: 10 }}>{clinic.clinic_name || "N/A"}</Text>

                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Email:</Text>
                  <Text style={{ marginBottom: 10 }}>{clinic.email || "N/A"}</Text>

                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Mobile:</Text>
                  <Text style={{ marginBottom: 10 }}>{clinic.mobile_number || "N/A"}</Text>

                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Address:</Text>
                  <Text style={{ marginBottom: 10 }}>{clinic.address || "N/A"}</Text>

                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Striked:</Text>
                  <Text style={{ marginBottom: 10 }}>{clinic.IsStriked ? "Yes" : "No"}</Text>

                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <TouchableOpacity
                      onPress={() => {
                        setModalType("warn");
                        setSelectedClinic(clinic);
                        setClinicMessage(true);
                      }}
                      style={{
                        backgroundColor: clinic.isWarn ? "#7f8c8d" : "#f39c12",
                        padding: 8,
                        borderRadius: 5,
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", textAlign: "center" }}>
                        {clinic.isWarn ? "Unwarn" : "Warn"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setModalType("ban");
                        setSelectedClinic(clinic);
                        setClinicMessage(true);
                      }}
                      style={{
                        backgroundColor: clinic.isBan ? "#7f8c8d" : "#c0392b",
                        padding: 8,
                        borderRadius: 5,
                        flex: 1,
                      }}
                    >
                      <Text style={{ color: "#fff", textAlign: "center" }}>
                        {clinic.isBan ? "Unban" : "Ban"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          // 🖥️ Desktop / Tablet Table Layout
          <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, minWidth: 900 }}>
              {clinicList.length === 0 ? (
                <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: 20, color: "gray" }}>- No Clinics -</Text>
                </View>
              ) : (
                <>
                  {/* Table Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#00505cff",
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      minWidth: "100%",
                    }}
                  >
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Clinic Name</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Email</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Mobile</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Address</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Striked?</Text>
                    <Text style={{ flex: 1, fontWeight: "700", color: "white" }}>Actions</Text>
                  </View>

                  <ScrollView>
                    {clinicList.map((clinic, index) => (
                      <View
                        key={clinic.id}
                        style={{
                          flexDirection: "row",
                          borderBottomWidth: 1,
                          borderColor: "#ccc",
                          paddingVertical: 20,
                          paddingHorizontal: 20,
                          backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                          alignItems: "center",
                          gap: 10
                        }}
                      >
                        <Text
                          style={{ flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {clinic.clinic_name || "N/A"}
                        </Text>

                        <Text
                          style={{ flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {clinic.email || "N/A"}
                        </Text>

                        <Text
                          style={{ flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {clinic.mobile_number || "N/A"}
                        </Text>

                        <Text
                          style={{ flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {clinic.address || "N/A"}
                        </Text>

                        <Text
                          style={{ flex: 1 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {clinic.IsStriked ? "Yes" : "No"}
                        </Text>

                        <View style={{ flex: 1, flexDirection: "row" }}>
                          <TouchableOpacity
                            onPress={() => {
                              setModalType("warn");
                              setSelectedClinic(clinic);
                              setClinicMessage(true);
                            }}
                            style={{
                              backgroundColor: clinic.isWarn ? "#7f8c8d" : "#f39c12",
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              borderRadius: 4,
                              marginRight: 10,
                            }}
                          >
                            <Text style={{ color: "#fff", fontSize: 12 }}>
                              {clinic.isWarn ? "Unwarn" : "Warn"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setModalType("ban");
                              setSelectedClinic(clinic);
                              setClinicMessage(true);
                            }}
                            style={{
                              backgroundColor: clinic.isBan ? "#7f8c8d" : "#c0392b",
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ color: "#fff", fontSize: 12 }}>
                              {clinic.isBan ? "Unban" : "Ban"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                </>
              )}
            </View>
          </ScrollView>
        )}

        {/* Modal for clinics */}
        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={clinicMessage} onBackdropPress={() => setClinicMessage(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>

            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 8,
                width: "80%",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                {modalType === "warn"
                  ? selectedClinic?.isWarn
                    ? `Unwarn ${selectedClinic?.clinic_name}`
                    : `Warn ${selectedClinic?.clinic_name}`
                  : selectedClinic?.isBan
                  ? `Unban ${selectedClinic?.clinic_name}`
                  : `Ban ${selectedClinic?.clinic_name}`}
              </Text>

              {/* If warning or banning, show reason input */}
              {((modalType === "warn" && !selectedClinic?.isWarn) ||
                (modalType === "ban" && !selectedClinic?.isBan)) && (
                <>
                  <Text style={{ marginBottom: 5 }}>Reason:</Text>
                  <TextInput
                    placeholder="Enter reason"
                    value={reason}
                    onChangeText={setReason}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 5,
                      padding: 10,
                      marginBottom: 10,
                    }}
                    multiline
                  />
                </>
              )}

              {/* Confirmation for un-warn/un-ban */}
              {((modalType === "warn" && selectedClinic?.isWarn) ||
                (modalType === "ban" && selectedClinic?.isBan)) && (
                <Text style={{ marginBottom: 10 }}>
                  Are you sure you want to {modalType === "warn" ? "unwarn" : "unban"} this clinic?
                </Text>
              )}

              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => {
                    setClinicMessage(false);
                    setSelectedClinic(null);
                    setReason("");
                  }}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: "#888" }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    if (!selectedClinic) return;

                    const needsReason =
                      (modalType === "warn" && !selectedClinic.isWarn) ||
                      (modalType === "ban" && !selectedClinic.isBan);

                    if (needsReason && reason.trim() === "") {
                      alert("Please enter a reason");
                      return;
                    }

                    console.log("Updating clinic:", selectedClinic.id, modalType, reason);

                    if (modalType === "warn") {

                      const { data, error } = await supabase
                        .from("clinic_profiles")
                        .update({
                          isWarn: !selectedClinic.isWarn,
                          notif_message: !selectedClinic.isWarn ? reason : null,
                          IsStriked: true,
                        })
                        .eq("id", selectedClinic.id);
                      console.log("Warn update result:", data, error);
                    } else if (modalType === "ban") {
                      const { data, error } = await supabase
                        .from("clinic_profiles")
                        .update({
                          isBan: !selectedClinic.isBan,
                          notif_message: !selectedClinic.isBan ? reason : null,
                        })
                        .eq("id", selectedClinic.id);
                      console.log("Ban update result:", data, error);
                    }

                    // Refresh clinic list from DB
                    const { data: refreshed, error: refErr } = await supabase
                      .from("clinic_profiles")
                      .select("*");
                    if (refErr) {
                      console.error("Clinic refresh error:", refErr);
                    } else {
                      setClinicList(refreshed || []);
                    }

                    setClinicMessage(false);
                    setSelectedClinic(null);
                    setReason("");
                  }}
                >
                  <Text style={{ color: "#007BFF" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
      
        </Modal>
        </View>

    
        {/* Dashboard Chats --------------------------------------------------------------------------------------- */}
    
          <View style={[styles.dashboard, { width: !isDesktop ? '95%' : expanded ? '80%' : '95%', right: dashboardView === 'chats' ? 11 : 20000}]}>
         <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: isMobile ? "center" : "flex-start",
              color: "#00505cff",
            }}
          >
            Support
          </Text>
          </View>
    
        {/* Dashboard Team --------------------------------------------------------------------------------------- */}
    
        {dashboardView === "team" && (
        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "team" ? 11 : 20000,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: isMobile ? "center" : "flex-start",
              color: "#00505cff",
            }}
          >
            About Us
          </Text>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View
      style={{
        padding: 20,
        backgroundColor: "#f7f7f7ff",
        borderRadius: 16,
        marginTop: -10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Tagline */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center",
          color: "#00505cff",
        }}
      >
        Explore Dental Clinics Around San Jose Delmonte Bulacan!
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: "#444",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        We believe that a confident smile and healthy teeth are best achieved
        when guided by expertise.
      </Text>

      {/* Purpose */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 10,
          color: "#00505cff",
          textAlign: "center",
        }}
      >
        Our Purpose
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: "#555",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
       This platform was created to bridge the gap between patients and trusted dental clinics in City of San Jose del Monte, Bulacan
      </Text>

      <View style={{ alignSelf: "center", marginTop: 20, marginBottom: 20 }}>
        {/* Benefits */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 12,
            color: "#00505cff",
            textAlign: "left",
          }}
        >
          Platform Benefits
        </Text>
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • Streamline Dental Appointment Scheduling
          </Text>
          <Text
            style={{ fontSize: 14, color: "#555", marginBottom: 10 }}
          >
            Provide a seamless, user-friendly platform for patients to book,
            reschedule, and cancel appointments anytime, anywhere.
          </Text>

          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • Improve Patient Experience Through Accessible Services
          </Text>
          <Text
            style={{ fontSize: 14, color: "#555", marginBottom: 10 }}
          >
            Instant booking, reminders, and access to records help patients
            save time and reduce wait times.
          </Text>

          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • AR Tools for Patient Engagement
          </Text>
          <Text style={{ fontSize: 14, color: "#555" }}>
            Preview treatments and learn with Augmented Reality for better
            understanding and trust.
          </Text>
        </View>

        {/* Topics */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 12,
            color: "#00505cff",
            textAlign: "left",
          }}
        >
          Covered Topics
        </Text>
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • Finding the Right Clinic Near You
          </Text>
          <Text
            style={{ fontSize: 14, color: "#555", marginBottom: 10 }}
          >
            Browse trusted clinics in San Jose Del Monte Bulacan with full
            profiles, services, and schedules.
          </Text>

          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • Common Dental Concerns, Easy Solutions
          </Text>
          <Text
            style={{ fontSize: 14, color: "#555", marginBottom: 10 }}
          >
            From toothaches to check-ups, our hub addresses common oral
            health needs.
          </Text>

          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#00796b" }}
          >
            • Book Your Appointment Online
          </Text>
          <Text style={{ fontSize: 14, color: "#555" }}>
            Skip the calls — schedule your appointments digitally with ease.
          </Text>
        </View>
      </View>

      {/* Trusted Clinics */}
      <Text style={{ textAlign: "center", fontSize: 14, color: "#888" }}>
        Trusted by 7+ Dental Clinics around San Jose Delmonte Bulacan
      </Text>

      {/* Modal Trigger */}
      <TouchableOpacity
        onPress={() => setTermsOfUse(true)}
        style={{
          marginTop: 30,
          backgroundColor: "#00505cff",
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 10,
          alignSelf: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Terms of Use
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={termsOfUse} onBackdropPress={() => setTermsOfUse(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>

     
        <View
          style={{
            backgroundColor: "white",
            width: "90%",
            padding: 20,
            borderRadius: 16,
            maxHeight: "80%",
          }}
        >
<ScrollView>
  <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#00505cff" }}>
    SMILE STUDIO
  </Text>


  {/* Divider */}
  <View style={{ marginVertical: 20, borderBottomWidth: 1, borderBottomColor: "#ccc" }} />

  {/* TERMS OF USE Title */}
  <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#00505cff" }}>
    TERMS OF USE
  </Text>
  <Text style={{ fontSize: 14, marginBottom: 10, color: "#444" }}>
    <Text style={{ fontWeight: "bold" }}>Last Updated:</Text> October 13, 2025{"\n"}
  </Text>

  <Text style={{ fontSize: 14, color: "#444", lineHeight: 22 }}>
    By accessing or using Smile Studio: A Cross-Platform Dental Appointment System with AR Teeth and Braces Filter for Dental Patients in San Jose Del Monte, Bulacan, owned and operated by Scuba Scripter and Pixel Cowboy Team, you agree to be legally bound by these Terms of Use. If you do not agree, please stop using the platform immediately.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>1. Definitions{"\n"}</Text>
    1.1 Appointment – A scheduled dental consultation booked through Smile Studio..{"\n"}
    1.2 No-Show – Failure to attend a booked appointment without cancellation..{"\n"}
    1.3 Grace Period – The allowable late arrival time is determined by each partner dental clinic based on their internal policy.{"\n"}
    1.4 Malicious Activity – Any action that disrupts, exploits, or harms the system, users, or clinics, such as hacking, spamming, harassment, or impersonation.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>2. Eligibility & Account Registration{"\n"}</Text>
    2.1 The platform is primarily intended for academic and demonstration purposes.{"\n"}
    2.2 Users under 16 years old must have verified parental or guardian consent before registration.{"\n"}
    2.3 Users are responsible for maintaining the confidentiality of their login credentials and all activities that occur under their account.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>3. Permitted & Prohibited Use{"\n"}</Text>
    3.1 Permitted Use – Booking legitimate dental appointments, accessing clinic information, and managing appointment schedules.{"\n"}
    3.2 Prohibited Use – Creating fake or spam appointments, harassing staff or other users, attempting to hack or damage the system, uploading harmful content, impersonating others, or repeatedly violating platform rules.{"\n\n"}  

    <Text style={{ fontWeight: "bold" }}>4. Appointment Policies{"\n"}</Text>
    4.1 Appointments are handled on a “First-Appoint, First-Served” basis.{"\n"}
    4.2 No downpayment or online payment is required before appointments.{"\n"}
    4.3 Cancellations must be made at least 24 hours prior to the scheduled time.{"\n"}
    4.4 Notification reminders are automatically sent to users before appointments.{"\n"}
    4.5 The grace period for late arrivals is based on the policy of each respective dental clinic.{"\n"}
    4.6 Clinics may cancel or reschedule appointments due to emergencies or unavailability, and users will be notified promptly through email.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>5. Conduct, Violations, and Disciplinary Actions{"\n"}</Text>
    5.1 Superadmin Authority – The Superadmin reserves the right to issue warnings, temporary suspensions, or permanent bans on user accounts based on the severity of misconduct or breach of these Terms of Use.{"\n"}
    5.2 Clinic Authority – Partner dental clinics have the right to warn or ban patients who engage in disruptive or inappropriate behavior such as spamming appointments, harassing dental staff, trolling, or other unprofessional conduct.{"\n"}
    5.3 Appeals – Users may submit a written appeal to Smile Studio Email if they believe disciplinary actions were issued in error.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>Clinic Verification and DTI Validation{"\n"}</Text>
    6.1 Verification Requirement – All dental clinics registering with Smile Studio must provide valid business information, including their official Department of Trade and Industry (DTI) registration details.{"\n"}
    6.2 Superadmin DTI Verification – The Superadmin or authorized developers are permitted to verify the authenticity of a clinic’s DTI registration through the official DTI online verification platform.{"\n"}
    6.3 Legal Basis – Under Philippine law, any civilian may verify the registration status of a sole proprietorship using the Department of Trade and Industry’s public verification system without requiring special access or authority.{"\n"}
    6.4 Purpose – This verification process ensures that only legitimate and lawfully registered dental clinics operate within Smile Studio, protecting users from fraudulent or unlicensed establishments.{"\n"}
    6.5 Revocation – The Superadmin reserves the right to suspend or remove a clinic’s account if its DTI registration cannot be verified or has been found invalid.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>7. Medical Disclaimer{"\n"}</Text>
    7.1 Smile Studio is not a healthcare provider and is not to be used for emergency medical concerns.{"\n"}
    7.2 Patients must provide accurate and complete medical information to ensure proper treatment.{"\n"}
    7.3 The AR Teeth and Braces Filter is provided for visualization and educational purposes only and does not represent professional dental advice.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>8. Intellectual Property{"\n"}</Text>
    8.1 All platform elements, including the system’s design, graphics, text, and content, are the property of Smile Studio and its developers.{"\n"}
    8.2 The platform may only be used for personal, non-commercial, and educational purposes. Unauthorized reproduction or redistribution is prohibited.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>9. Privacy and Security{"\n"}</Text>
    9.1 All user and clinic data are collected, processed, and stored in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).{"\n"}
    9.2 The handling of personal and clinic information is further explained in the Smile Studio Privacy Policy.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>10. Termination{"\n"}</Text>
    10.1 Smile Studio reserves the right to warn, suspend, or delete accounts that violate these Terms of Use.{"\n"}
    10.2 Users and clinics may request account deletion or data removal by contacting Smile Studio Support.{"\n\n"}

    <Text style={{ fontWeight: "bold" }}>11. Updates to Terms{"\n"}</Text>
    11.1 Smile Studio may revise these Terms of Use at any time to reflect policy changes or system improvements.{"\n"}
    11.2 Users will be notified of updates, and continued use of the platform constitutes acceptance of the revised terms.{"\n\n"}

    Acknowledgment: By creating an account or booking an appointment through Smile Studio, you acknowledge that you have read, understood, and agreed to these Terms of Use.
    </Text>

        {/* Divider */}
        <View style={{ marginVertical: 20, borderBottomWidth: 1, borderBottomColor: "#ccc" }} />

        {/* Privacy Policy Title */}
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#00505cff" }}>
          Privacy Policy
        </Text>

        {/* Full Privacy Policy Content */}
        <Text style={{ fontSize: 14, color: "#444", lineHeight: 22 }}>
          <Text style={{ fontWeight: "bold" }}>Last Updated:</Text> October 13, 2025{"\n\n"}

          This Privacy Policy explains how Smile Studio collects, uses, and safeguards your personal and clinic information.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>1. Information We Collect</Text>{"\n"}
          1.1 Personal Information – Name, age, date of birth, contact number, email address, and address (Dental Clinic).{"\n"}
          1.2 Appointment Information – Clinic and dentist details, appointment dates and times.{"\n"}
          1.3 Health Information (only if provided) – Relevant medical or dental conditions such as allergies, pregnancy, or ongoing medication.{"\n"}
          1.4 System Data – Username, password, browser information, device type, and system notifications sent.{"\n"}
          1.5 Clinic Verification Data – Clinic’s registration info and DTI permit number provided for clinic verification.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>2. How We Use Your Information</Text>{"\n"}
          2.1 To manage dental appointments and clinic scheduling.{"\n"}
          2.2 To send automated notifications and reminders.{"\n"}
          2.3 To verify clinic legitimacy through DTI validation.{"\n"}
          2.4 To ensure compliance with applicable regulations.{"\n"}
          2.5 To improve platform performance and security.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>3. Data Sharing and Disclosure</Text>{"\n"}
          3.1 With Partner Clinics – For appointment coordination and service preparation.{"\n"}
          3.2 With DTI or Authorized Platforms – For validation of clinic verification.{"\n"}
          3.3 With User Consent – For referrals or optional features.{"\n"}
          3.4 As Required by Law – When mandated by government or regulatory authorities.{"\n"}
          3.5 For Security – To prevent fraudulent activities or misuse of the platform.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>4. Data Security</Text>{"\n"}
          4.1 Smile Studio implements strong physical, technical, and administrative measures to protect data using Supabase, including encrypted passwords, secure logins, and limited access.{"\n"}
          4.2 However, no online platform can guarantee absolute security. Use of the system is at the user’s own risk.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>5. Children’s Privacyy</Text>{"\n"}
          5.1 Smile Studio allows access to users under 16 only with verified parental or guardian consent.{"\n"}
          5.2 The system does not intentionally collect data from minors without supervision.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>6. Patient and Clinic Rights</Text>{"\n"}
          6.1 Under the Data Privacy Act of 2012 (RA 10173), users and clinics have the right to access, correct, delete, or withdraw their data.{"\n"}
          6.2 They may also file a complaint with the National Privacy Commission (NPC) if data rights are violated.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>7. AR Filter Disclaimer</Text>{"\n"}
          7.1 The AR Teeth and Braces Filter is for educational and visualization purposes only.{"\n"}
          7.2 It does not store, process, or analyze facial recognition data, and no images are permanently saved.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>8. Updates to This Privacy Policyy</Text>{"\n"}
          8.1 This Privacy Policy may be updated periodically to comply with laws or improve practices.{"\n"}
          8.2 Continued use of the system after updates signifies agreement with the latest version.

          {"\n\n"}<Text style={{ fontWeight: "bold" }}>9. Contact Informatios</Text>{"\n"}
          Smile Studio Support{"\n"}
          Scuba Scripter and Pixel Cowboy Team{"\n"}
          (+63) 921-888-1835{"\n"}
          San Jose Del Monte, Bulacan, Philippines{"\n"}{"\n"}

          Acknowledgment: By using Smile Studio, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
        </Text>

</ScrollView>

          <TouchableOpacity
            onPress={() => setTermsOfUse(false)}
            style={{
              marginTop: 20,
              backgroundColor: "#00505cff",
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
  
      </Modal>
    </View>

<View
  style={{
    padding: 20,
    backgroundColor: "#f7f7f7ff",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  }}
>
  <Text
    style={{
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: "#00505cff",
    }}
  >
    Meet the Team
  </Text>

  <View
    style={{
      flexDirection: !isMobile ? "row" : "column",
      flexWrap: !isMobile ? "wrap" : "nowrap",
      justifyContent: !isMobile ? "space-between" : "center",
    }}
  >
    {[
      {
        key: "miguel",
        image: require("../../assets/team/migueldel.png"),
        name: "Miguel Del Rosario",
        role: "Project Manager",
      },
      {
        key: "paala",
        image: require("../../assets/team/paala.png"),
        name: "Paala James",
        role: "Programmer Specialist",
      },
      {
        key: "elbert",
        image: require("../../assets/team/elbert.png"),
        name: "Elbert Rosales",
        role: "Quality Assurance",
      },
      {
        key: "rex",
        image: require("../../assets/team/rex.png"),
        name: "Rex Carlo Rosales",
        role: "System Analyst",
      },
    ].map(({ key, image, name, role }) => (
      <View
        key={key}
        style={{
          alignItems: "center",
          marginBottom: 30,
          backgroundColor: "#00505cff",
          borderRadius: 16,
          padding: 20,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          width: !isMobile ? "48%" : "100%", // 2x2 grid for web, full width on mobile
          marginBottom: 20,
        }}
      >
        <Image
          source={image}
          style={{
            width: 170,
            height: 170,
            borderRadius: 60,
            borderWidth: 2,
            borderColor: "#00bcd4",
            backgroundColor: "#eaeaea",
          }}
        />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "white",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "white",
            textAlign: "center",
          }}
        >
          {role}
        </Text>
      </View>
    ))}
  </View>
</View>

          </ScrollView>
        </View>
        )}

        {/* Dashboard Verify Clinic --------------------------------------------------------------------------------------- */}
  
        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "ar" ? 11 : 20000,
            },
          ]}
        >
          <Text
  style={{
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: isMobile ? "center" : "flex-start",
    color: "#00505cff",
  }}
>
  Verify Clinics
  {verificationRequestCount > 0 && (
    <Text style={{ color: '#ff4444', fontSize: 20 }}>
      {` (${verificationRequestCount} pending)`}
    </Text>
  )}
</Text>

          {isMobile ? (
            // 📱 Mobile Card View
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {clinicList.filter(clinic => clinic.request_verification).length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: 20, color: "gray" }}>- No Clinic Requests -</Text>
                </View>
              ) : (
                clinicList
                  .filter(clinic => clinic.request_verification === true)
                  .map((clinic, index) => (
                    <View
                      key={clinic.id}
                      style={{
                        backgroundColor: "#f9f9f9",
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Clinic Name:</Text>
                      <Text style={{ marginBottom: 10 }}>{clinic.clinic_name || "N/A"}</Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Email:</Text>
                      <Text style={{ marginBottom: 10 }}>{clinic.email || "N/A"}</Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Mobile:</Text>
                      <Text style={{ marginBottom: 10 }}>{clinic.mobile_number || "N/A"}</Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Address:</Text>
                      <Text style={{ marginBottom: 10 }}>{clinic.address || "N/A"}</Text>

                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        {/* Deny */}
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedClinicForAction(clinic);
                            setDenialReason("");
                            setDenialModalVisible(true);
                          }}
                          style={{
                            backgroundColor: "#c0392b",
                            padding: 8,
                            borderRadius: 5,
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ color: "#fff", textAlign: "center" }}>Deny</Text>
                        </TouchableOpacity>

                        {/* Verify */}
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedClinicForAction(clinic);
                            setVerificationModalVisible(true);
                          }}
                          style={{
                            backgroundColor: "#2ecc71",
                            padding: 8,
                            borderRadius: 5,
                            flex: 1,
                          }}
                        >
                          <Text style={{ color: "#fff", textAlign: "center" }}>Verify</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              )}
            </ScrollView>
          ) : (
            // 🖥️ Desktop Table View
          <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, minWidth: 1000 }}>
              {clinicList.filter(clinic => clinic.request_verification).length === 0 ? (
                <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                  <Text style={{ fontSize: 20, color: "gray" }}>- No Clinic Requests -</Text>
                </View>
              ) : (
                <>
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#00505cff",
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      minWidth: "100%",
                    }}
                  >
                    {["Clinic Name", "Email", "Mobile", "Address", "Actions"].map((label, index) => (
                      <Text
                        key={index}
                        style={{ flex: 1, fontWeight: "700", color: "white" }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {label}
                      </Text>
                    ))}
                  </View>

                  {/* Rows */}
                  <ScrollView>
                    {clinicList
                      .filter(clinic => clinic.request_verification)
                      .map((clinic, index) => (
                        <View
                          key={clinic.id}
                          style={{
                            flexDirection: "row",
                            borderBottomWidth: 1,
                            borderColor: "#ccc",
                            paddingVertical: 20,
                            paddingHorizontal: 20,
                            backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {clinic.clinic_name || "N/A"}
                          </Text>
                          <Text style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {clinic.email || "N/A"}
                          </Text>
                          <Text style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {clinic.mobile_number || "N/A"}
                          </Text>
                          <Text style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                            {clinic.address || "N/A"}
                          </Text>

                          {/* Actions */}
                          <View style={{ flex: 1, flexDirection: "row" }}>
                            {/* Deny */}
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedClinicForAction(clinic);
                                setDenialReason("");
                                setDenialModalVisible(true);
                              }}
                              style={{
                                backgroundColor: "#c0392b",
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                marginRight: 10,
                              }}
                            >
                              <Text style={{ color: "#fff", fontSize: 14 }}>Deny</Text>
                            </TouchableOpacity>

                            {/* Verify */}
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedClinicForAction(clinic);
                                setVerificationModalVisible(true);
                              }}
                              style={{
                                backgroundColor: "#2ecc71",
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ color: "#fff", fontSize: 14 }}>Verify</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </ScrollView>
                </>
                
              )}
            </View>
          </ScrollView>
          )}
        </View>


{/* Dashboard Chats/Support --------------------------------------------------------------------------------------- */}

<View style={[styles.dashboard, { 
  width: !isDesktop ? '95%' : expanded ? '80%' : '95%', 
  right: dashboardView === 'chats' ? 11 : 20000
}]}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
    <Text style={{
      fontSize: 24,
      fontWeight: "bold",
      alignSelf: isMobile ? "center" : "flex-start",
      color: "#00505cff",
    }}>
      Support Requests
    </Text>
    
    <TouchableOpacity
      onPress={() => fetchSupportMessages()}
      style={{
        backgroundColor: "#00bcd4",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>Refresh</Text>
    </TouchableOpacity>
  </View>

  {/* Filter Tabs */}
  <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8, justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
    {['all', 'pending', 'in_progress', 'resolved'].map((filter) => (
      <TouchableOpacity
        key={filter}
        onPress={() => setSupportFilter(filter as any)}
        style={{
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: supportFilter === filter ? "#00505cff" : "#e0e0e0",
        }}
      >
        <Text style={{
          color: supportFilter === filter ? "white" : "#666",
          fontWeight: supportFilter === filter ? "bold" : "normal",
          textTransform: 'capitalize',
        }}>
          {filter.replace('_', ' ')}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Support Messages List */}
  <ScrollView>
    {supportLoading ? (
      <ActivityIndicator size="large" color="#00505cff" style={{ marginTop: 50 }} />
    ) : (
      <>
        {supportMessages
          .filter((msg) => supportFilter === 'all' || msg.status === supportFilter)
          .map((message) => (
            <View
              key={message.id}
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 12,
                marginBottom: 15,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderLeftWidth: 4,
                borderLeftColor:
                  message.status === 'resolved'
                    ? '#4caf50'
                    : message.status === 'in_progress'
                    ? '#ff9800'
                    : '#f44336',
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {message.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: message.profiles.avatar_url }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#00505cff",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {message.user_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                      {message.user_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      {message.profiles?.role === 'clinic' ? 'Clinic' : 'Patient'}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor:
                        message.status === 'resolved'
                          ? '#e8f5e9'
                          : message.status === 'in_progress'
                          ? '#fff3e0'
                          : '#ffebee',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color:
                          message.status === 'resolved'
                            ? '#4caf50'
                            : message.status === 'in_progress'
                            ? '#ff9800'
                            : '#f44336',
                      }}
                    >
                      {message.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                    {new Date(message.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <Text style={{ fontSize: 14, color: "#444", marginBottom: 10, lineHeight: 20 }}>
                {message.message}
              </Text>

              {/* Admin Notes */}
              {message.admin_notes && (
                <View
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#00505cff" }}>
                    Admin Notes:
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666" }}>{message.admin_notes}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {message.status !== 'in_progress' && (
                  <TouchableOpacity
                    onPress={() => updateSupportStatus(message.id, 'in_progress')}
                    style={{
                      flex: 1,
                      backgroundColor: "#ff9800",
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 12 }}>
                      In Progress
                    </Text>
                  </TouchableOpacity>
                )}
                
                {message.status !== 'resolved' && (
                  <TouchableOpacity
                    onPress={() => updateSupportStatus(message.id, 'resolved')}
                    style={{
                      flex: 1,
                      backgroundColor: "#4caf50",
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "white", textAlign: "center", fontWeight: "bold", fontSize: 12 }}>
                      Mark Resolved
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

        {supportMessages.filter((msg) => supportFilter === 'all' || msg.status === supportFilter)
          .length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 16, color: "#999" }}>
              No {supportFilter !== 'all' ? supportFilter : ''} support requests
            </Text>
          </View>
        )}
      </>
    )}
  </ScrollView>
</View>


                  {/* ⛔ Denial Modal */}
                  <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={denialModalVisible} onBackdropPress={() => setDenialModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                 
                  
                      <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, width: isMobile ? "90%" : "40%" }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: '#00505cff' }}>
                          Reason for Denial
                        </Text>
                        <TextInput
                          placeholder="Enter reason..."
                          value={denialReason}
                          onChangeText={setDenialReason}
                          multiline
                          style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 8,
                            padding: 10,
                            height: 100,
                            marginBottom: 20,
                          }}
                        />

                        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                          <TouchableOpacity
                            onPress={() => {
                              setDenialModalVisible(false);
                              setDenialReason("");
                              setSelectedClinicForAction(null);
                            }}
                            style={{ marginRight: 20 }}
                          >
                            <Text style={{ color: "#888" }}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={async () => {
                              if (!selectedClinicForAction) return;
                              if (denialReason.trim() === "") {
                                alert("Please enter a reason");
                                return;
                              }

                              const { error } = await supabase
                                .from("clinic_profiles")
                                .update({
                                  request_verification: false,
                                  denied_verification_reason: denialReason,
                                })
                                .eq("id", selectedClinicForAction.id);
                              
                              await activityLogger.log(
                                adminId,
                                'admin',
                                `Denied verification request for clinic ${selectedClinicForAction.name}. Reason: ${denialReason}`
                              );

                              if (error) {
                                alert("Error denying clinic.");
                                console.error(error);
                              } else {
                                setClinicList(prev =>
                                  prev.map(c =>
                                    c.id === selectedClinicForAction.id
                                      ? { ...c, request_verification: false }
                                      : c
                                  )
                                );
                              }

                              setDenialModalVisible(false);
                              setSelectedClinicForAction(null);
                              setDenialReason("");
                            }}
                          >
                            <Text style={{ color: "#c0392b", fontWeight: "bold" }}>Submit & Deny</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                   
                  </Modal>

                  {/* ✅ Verification Modal */}
<Modal 
  animationIn="fadeIn" 
  animationOut="fadeOut" 
  isVisible={verificationModalVisible} 
  onBackdropPress={() => setVerificationModalVisible(false)} 
  backdropColor="#000" 
  backdropOpacity={0.1} 
  style={{alignItems: "center", justifyContent: "center"}}
>
  <View
    style={{
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 10,
      width: isMobile ? "90%" : "40%",
      maxHeight: "90%",
    }}
  >
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: '#00505cff' }}>
        Are you sure you want to verify{" "}
        <Text style={{ fontWeight: "bold" }}>
          {selectedClinicForAction?.clinic_name || "this clinic"}?
        </Text>
      </Text>

      <View
        style={{
          marginTop: 15,
          marginBottom: 20,
          minHeight: selectedClinicForAction?.license_photo_url ? 450 : undefined,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {selectedClinicForAction?.license_photo_url ? (
          <>
            {/* Check if it's a PDF */}
            {selectedClinicForAction.license_photo_url.toLowerCase().endsWith('.pdf') ? (
              <View style={{ 
                alignItems: "center", 
                padding: 30,
                backgroundColor: "#f8fafc",
                borderRadius: 12,
                width: "100%"
              }}>
                <View style={{
                  padding: 20,
                  backgroundColor: "white",
                  borderRadius: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <FontAwesome5 name="file-pdf" size={100} color="#ef4444" />
                </View>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: "bold", 
                  color: "#1e293b",
                  marginBottom: 8
                }}>
                  DTI Permit (PDF)
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: "#64748b",
                  marginBottom: 20,
                  textAlign: "center"
                }} numberOfLines={1}>
                  {selectedClinicForAction.license_photo_url.split('/').pop()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.open(selectedClinicForAction.license_photo_url, '_blank');
                    } else {
                      Alert.alert('PDF Viewer', 'Opening PDF in browser...');
                    }
                  }}
                  style={{
                    backgroundColor: "#00505cff",
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="external-link-alt" size={16} color="white" style={{ marginRight: 10 }} />
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>Open PDF</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Show image for JPEG/PNG */
              <View style={{ width: "100%", alignItems: "center" }}>
                <View style={{
                  width: "100%",
                  height: 450,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  position: "relative",
                }}>
                  <Image
                    source={{ uri: selectedClinicForAction.license_photo_url }}
                    resizeMode="contain"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </View>
                
                <View style={{ 
                  flexDirection: "row", 
                  gap: 10, 
                  marginTop: 15,
                  flexWrap: "wrap",
                  justifyContent: "center"
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.open(selectedClinicForAction.license_photo_url, '_blank');
                      }
                    }}
                    style={{
                      backgroundColor: "#00505cff",
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5 name="expand" size={14} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                      View Full Size
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={{ 
            alignItems: "center", 
            padding: 40,
            backgroundColor: "#f8fafc",
            borderRadius: 12,
            width: "100%"
          }}>
            <FontAwesome5 name="file-image" size={80} color="#cbd5e0" />
            <Text style={{ 
              color: "#64748b", 
              fontStyle: "italic", 
              marginTop: 20, 
              textAlign: "center",
              fontSize: 15
            }}>
              This clinic did not provide a Business Permit.
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={() => {
            setVerificationModalVisible(false);
            setSelectedClinicForAction(null);
          }}
          style={{ marginRight: 20 }}
        >
          <Text style={{ color: "#888" }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (!selectedClinicForAction) return;

            const { error } = await supabase
              .from("clinic_profiles")
              .update({
                request_verification: false,
                denied_verification_reason: null,
                isVerified: true,
              })
              .eq("id", selectedClinicForAction.id);

              await activityLogger.log(
                adminId,
                'admin',
                `Accepted verification request for clinic ${selectedClinicForAction.name}`
              );

            if (error) {
              alert("Error verifying clinic.");
              console.error(error);
            } else {
              setClinicList(prev =>
                prev.map(c =>
                  c.id === selectedClinicForAction.id
                    ? { ...c, request_verification: false, isVerified: true }
                    : c
                )
              );
            }

            setVerificationModalVisible(false);
            setSelectedClinicForAction(null);
          }}
        >
          <Text style={{ color: "#2ecc71", fontWeight: "bold" }}>Verify</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>
      </LinearGradient>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {},
  glider: {
    flex: 1,
    borderBottomEndRadius: 30,
    borderTopEndRadius: 30,
    borderBottomRightRadius: 30,
    borderTopRightRadius: 30,
    padding: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',          // Make it higher than dashboard
    width: 380,
    elevation: 5,    
    shadowColor: "#00000045",
    shadowRadius: 1,
    shadowOffset: { width: 6, height: 6 },
  },
  toggleButtonWrapper: {
    left: 0,
    top: 50,
    height: 20,
    marginLeft: 20,
    overflow: 'hidden'
  },
  dashboard: {
    position: 'absolute',
    right: 11,
    height: '90%',
    marginTop: 40,
    padding: 14,
    shadowColor: '#00000045',
    shadowRadius: 2,
    shadowOffset: { width: 4, height: 4 },
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignContent: 'center',
  },
  mar2: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  buttonText: {
    color: '#000000ff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonTextUpdate: {
    color: '#000000ff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  contentsmenu: {
    shadowColor: "#00000045",
    shadowRadius: 2,
    shadowOffset: { width: 2, height: 2 },
    borderRadius: 3,
    borderColor: 'rgba(0, 0, 0, 1)',
    width: '100%',
    padding: 5,
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(163, 255, 202, 1)',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 50,
    resizeMode: 'contain',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'nowrap',
    width: '100%',
    paddingHorizontal: 8,
    height: '30%',
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    height: 240,
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  infoSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3e5fc',
    marginHorizontal: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  proinfo: {
    flexDirection: 'column',         // stack children vertically
    justifyContent: 'flex-start',    // align from top to bottom
    alignItems: 'center',            // center horizontally
    marginBottom: 20,
    flexWrap: 'nowrap',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,             // add some vertical padding
    minHeight: 150,                  // ensure space for multiple items
  },
  redButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText1: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '20%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

        avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
})