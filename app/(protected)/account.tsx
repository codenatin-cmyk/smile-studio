import CalendarPicker from "@/components/CalendarPicker";
import CameraScreenFilter from '@/components/CameraScreenFilter';
import CancelAppointmentUser from "@/components/CancelAppointmentUser";
import TimePicker from "@/components/TimePicker";
import { activityLogger } from "@/hooks/useActivityLogs";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useSession } from "@/lib/SessionContext";
import { MaterialIcons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Modal from "react-native-modal";
import * as XLSX from 'xlsx';
import { supabase } from "../../lib/supabase";
import ChatView from "../view/ChatView";
import DayScheduleView from "../view/DayScheduleView";
import MapPickerView from "../view/MapPickerView";

type Appointment = {
  id: string;
  created_at: string;
  clinic_id: string;
  patient_id: string;
  date_time: string;
  message: string;
  clinic_profiles: {
    clinic_name: string;
    email: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  outcome: string;
  isAccepted: boolean | null;
  rejection_note: string;
  isAttended: boolean | null;
};

type Dentist = {
  name: string;
  specialty: string;
  weeklySchedule: Record<string, string[]>;
};

export default function Account() {
  

  const { session, isLoading, signOut } = useSession();
  const router = useRouter();
  const date = new Date();

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showInvalidTimeModal, setShowInvalidTimeModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [role, setRole] = useState<string | null>(null);
 const [moved, setMoved] = useState(() => {
    // Initialize sidebar state based on screen size
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return windowWidth < 1200; // Collapsed by default on smaller screens
  });
  const [mobilemoved, mobilesetMoved] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [clinicCount, setClinicCount] = useState<number | null>(null);
   const { width, height } = useWindowDimensions();
  const isMobile = width < 1200;
  const isTablet = width >= 480 && width < 768;
  const isDesktop = width >= 768;
  
  // ✅ NEW: Improved sidebar width calculations
  const drawerWidth = isMobile ? 370 : isTablet ? 300 : 280; // ✅ 280px for desktop

  // Reset sidebar position when screen size changes
 useEffect(() => {
    if (isDesktop) {
      setMoved(false); // Always show sidebar on desktop
    } else if (isTablet || width < 1200) {
      setMoved(true)
    }
  }, [isDesktop, isTablet, width]);


  const offset = moved ? -320 : 0;
  const moboffset = moved ? -370 : 0;
  const mobbutoffset = moved ? -305 : 0;

 

  const [fullProfile, setFullProfile] = useState(false);
  const [viewFirst, setviewFirst] = useState(false);
  const [warn, setWarn] = useState(false);
  const [ban, setBan] = useState(false);
  const [viewClinic, setviewClinic] = useState(false);
  const [aIndicator, setaIndicator] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSignout, setModalSignout] = useState(false);
  const [modalUpdate, setModalUpdate] = useState(false);
  const [modalAppoint, setModalAppoint] = useState(false);
  const [modalMap, setModalMap] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(date);
  const [dashboardView, setDashboardView] = useState("profile");

  const [selectedSunday, setSelectedSunday] = useState("");
  const [selectedMonday, setSelectedMonday] = useState("");
  const [selectedTuesday, setSelectedTuesday] = useState("");
  const [selectedWednesday, setSelectedWednesday] = useState("");
  const [selectedThursday, setSelectedThursday] = useState("");
  const [selectedFriday, setSelectedFriday] = useState("");
  const [selectedSaturday, setSelectedSaturday] = useState("");

  const [selectedClinicName, setSelectedClinicName] = useState("");
  const [selectedClinicEmail, setSelectedClinicEmail] = useState("");
  const [selectedClinicSlogan, setSelectedClinicSlogan] = useState("");
  const [selectedClinicAddress, setSelectedClinicAddress] = useState("");
  const [selectedClinicMobile, setSelectedClinicMobile] = useState("");
  const [selectedClinicCreatedAt, setSelectedClinicCreatedAt] = useState("");
  const [selectedClinicRole, setSelectedClinicRole] = useState("");
  const [selectedClinicDentist, setSelectedClinicDentist] = useState(false);
  const [selectedClinicImage, setSelectedClinicImage] = useState();
  const [clinicList, setClinicList] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>();
  const [messageToClinic, setMessageToClinic] = useState<string>("");
  const [isOthersChecked, setIsOthersChecked] = useState(false);
  const [showOthersModal, setShowOthersModal] = useState(false);
  const [tempMessage, setTempMessage] = useState(""); // For editing in modal

  const [showOutOfScheduleModal, setShowOutOfScheduleModal] = useState(false);
  const [appointmentsList, setAppointmentList] = useState<Appointment[]>();
  const [appointmentsCurrentList, setAppointmentCurrentList] =
    useState<Appointment[]>();
  const [appointmentsPast, setAppointmentPast] = useState<Appointment[]>();
  const [appointmentName, setappointmentName] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [modalMessage, setModalMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [termsOfUse, setTermsOfUse] = useState(false);
  const [selectedCI, setSelectedCI] = useState("");
  const [selectedOffers, setSelectedOffers] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [downloadModal, setDownloadModal] = useState(false);
  const [showTooCloseModal, setShowTooCloseModal] = useState(false);
  const [verified, setVerified] = useState(false);
  const [offerList, setOfferList] = useState<string>("");
  const COOLDOWN_KEY = "last_appointment_time";
  const [lastAppointmentTime, setLastAppointmentTime] = useState<Date | null>(null);
  const [cooldownModalVisible, setCooldownModalVisible] = useState(false);
  const [remainingCooldownTime, setRemainingCooldownTime] = useState(0); // In seconds
  const [showCloseTimeModal, setShowCloseTimeModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [tempSelectedReasons, setTempSelectedReasons] = useState([...selectedReasons]);
  const toggleTempReason = (reason) => {
    setTempSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDentistModal, setShowDentistModal] = useState(false);

  const [selectedDentists, setSelectedDentists] = useState([]);
  const [dentistList, setDentistList] = useState<Dentist[]>([]);
  const [tempSelectedDentists, setTempSelectedDentists] = useState<string[]>([]);

  const toggleTempDentist = (name: string) => {
    setTempSelectedDentists((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };
  const parsedDentistList = typeof dentistList === "string" ? JSON.parse(dentistList) : dentistList || [];
  const fixedRoles = ["Receptionist", "Dental Practice Owner"];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // 👇 Local state to toggle expanded dentist schedule
  const [expandedDentistIndex, setExpandedDentistIndex] = useState<number | null>(null);

  const toggleSchedule = (index) => {
    setExpandedDentistIndex(prev => (prev === index ? null : index));
  };
  const today = new Date().toLocaleString("en-US", { weekday: "long" }); // e.g. "Monday"
  const [unavailableDentists, setUnavailableDentists] = useState<string[]>([]);
  const [showDentistUnavailableModal, setShowDentistUnavailableModal] = useState(false);
  const [showDentistRequiredModal, setShowDentistRequiredModal] = useState(false);
  const [requestViewVisible, setRequestViewVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState([]);

  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [dentistError, setDentistError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [showAllClinics, setShowAllClinics] = useState(false);

  const openRequestView = (requestStr) => {
    try {
      const parsed = JSON.parse(requestStr);
      setSelectedRequest(parsed);
    } catch {
      setSelectedRequest([requestStr]); // fallback to raw string if JSON parsing fails
    }
    setRequestViewVisible(true);
  };



  console.log("Current Appointment: ", appointmentsList)

  const offersArray = typeof offerList === "string"
    ? offerList.split("?")
    : Array.isArray(offerList)
    ? offerList
    : [];

const [supportModalVisible, setSupportModalVisible] = useState(false);
const [supportInput, setSupportInput] = useState('');
const [supportMessages, setSupportMessages] = useState([]);


useEffect(() => {
  if (!session?.user?.id) return;

  // Initial fetch of user's support messages
  const fetchUserSupportMessages = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support messages:', error);
      return;
    }

    setSupportMessages(data || []);
  };

  fetchUserSupportMessages();

  // Real-time subscription
  const channel = supabase
    .channel('support-messages-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${session.user.id}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setSupportMessages((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setSupportMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
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

// STEP 3: Add the submit function
const submitSupportMessage = async () => {
  if (!supportInput.trim()) {
    Alert.alert('Empty Message', 'Please enter a message before submitting.');
    return;
  }

  if (!session?.user?.id) {
    Alert.alert('Error', 'You must be logged in to submit feedback.');
    return;
  }

  try {
    const userName = `${firstname} ${lastname}`.trim() || username || 'Anonymous User';

    const { data, error } = await supabase
      .from('support_messages')
      .insert([
        {
          user_id: session.user.id,
          user_name: userName,
          message: supportInput.trim(),
        }
      ])
      .select();

    if (error) throw error;

    console.log('Support message submitted:', data);
    
    setSupportModalVisible(false);
    setSupportInput('');
    Alert.alert(
      'Success',
      'Thank you for your feedback! Our team will review it shortly.'
    );
  } catch (error) {
    console.error('Error submitting support message:', error);
    Alert.alert(
      'Submission Failed',
      'Something went wrong. Please try again later.'
    );
  }
};
// Load cooldown from storage when modal opens
useEffect(() => {
  if (!modalAppoint) return;

  (async () => {
    const storedTime = await AsyncStorage.getItem(COOLDOWN_KEY);
    if (storedTime) {
      setLastAppointmentTime(new Date(storedTime));
    }
  })();
}, [modalAppoint]);

// Live countdown effect for cooldown modal
useEffect(() => {
  if (!cooldownModalVisible || remainingCooldownTime <= 0) return;

  const interval = setInterval(() => {
    setRemainingCooldownTime((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setCooldownModalVisible(false);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [cooldownModalVisible]);

  const [mapView, setMapView] = useState<
    [number | undefined, number | undefined]
  >([undefined, undefined]);

  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);

  const [tMap, setTMap] = useState(false);

  const { createOrFindRoom } = useChatRoom();

  const chatWithClinic = async(clinicId : string)=>{
    if(!session?.user?.id) return;

    const roomId = await createOrFindRoom(session?.user.id, clinicId);
    console.log(roomId)
  }

  const isWithinClinicSchedule = (
    appointmentDate: Date,
    schedules: (DayScheduleType | undefined)[]
  ): boolean => {
    const dayIndex = appointmentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const schedule = schedules[dayIndex];

    if (!schedule || !schedule.hasSchedule || !schedule.from || !schedule.to) {
      return false;
    }

    const to24Hour = (hour: number, atm: "AM" | "PM") => {
      if (atm === "AM") return hour === 12 ? 0 : hour;
      return hour === 12 ? 12 : hour + 12;
    };

    const fromHour24 = to24Hour(schedule.from.hour, schedule.from.atm);
    const toHour24 = to24Hour(schedule.to.hour, schedule.to.atm);

    const fromTotalMinutes = fromHour24 * 60 + (schedule.from.minute ?? 0);
    const toTotalMinutes = toHour24 * 60 + (schedule.to.minute ?? 0);

    const appointmentHour = appointmentDate.getHours();
    const appointmentMinute = appointmentDate.getMinutes();
    const appointmentTotalMinutes = appointmentHour * 60 + appointmentMinute;

    return (
      appointmentTotalMinutes >= fromTotalMinutes &&
      appointmentTotalMinutes <= toTotalMinutes
    );
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        clinic_profiles (
          clinic_name,
          email
        ),
        profiles (
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("patient_id", session?.user.id)
      .is("isAccepted", null)
      .or("rejection_note.is.null,rejection_note.eq.''")
      .order("created_at", { ascending: false }); // 👈 DESCENDING

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    console.log("Appointments with names eto:", data);
    setAppointmentList(data);

    // Refresh Current and Past list
    fetchAppointmentsCurrent();
    fetchAppointmentsPast();
    return data;
  };

  const fetchAppointmentsCurrent = async () => {
    const nowUTC = new Date();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          *,
          clinic_profiles (
            clinic_name,
            email
          ),
          profiles (
            first_name,
            last_name,
            email
          )
        `
      )
      .eq("patient_id", session?.user.id)
      .eq("isAccepted", true)
      .gt("date_time", nowUTC.toISOString())
      .order("date_time", { ascending: true }); // 👈 ASCENDING (closest first)

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    // console.log("Appointments Current with names:", data);
    setAppointmentCurrentList(data);
    return data;
  };

  const fetchAppointmentsPast = async () => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        clinic_profiles (
          clinic_name,
          email
        ),
        profiles (
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("patient_id", session?.user.id)
      .or(`isAccepted.eq.false,date_time.lt.${now}`)
      .order("created_at", { ascending: false }); // 👈 DESCENDING

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    // console.log("Appointments with names:", data);
    setAppointmentPast(data);
    return data;
  };
  // 111
  useEffect(() => { 
    async function fetchClinics() {
      try {
        const { data, error } = await supabase
        .from("clinic_profiles")
        .select(`*, clinic_schedule(*)`);

        if (error) throw error;
        setClinicList(data || []);

        // console.log(data);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      }
    }

    fetchClinics();
  }, []);
  

  useEffect(() => {
    fetchAppointments();
    getProfile();
  }, [session]);

useEffect(() => {
  if (!session?.user?.id) return;

  // Initial fetch
  fetchAppointments(); // This already triggers current + past
  getProfile();

  const channel = supabase
    .channel("appointments-changes")
    .on(
      "postgres_changes",
      {
        event: "*", // "INSERT", "UPDATE", "DELETE"
        schema: "public",
        table: "appointments",
      },
      (payload) => {
        // console.log("🔄 Realtime appointment change:", payload);

        // Re-fetch all derived data on change
        fetchAppointments();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session?.user?.id]);


  useEffect(() => {
    async function loadUserCount() {
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        setUserCount(count ?? 0);
      } catch (error) {
        console.error("Failed to fetch user count:", error);
      }
    }
    loadUserCount();
  }, []);

  useEffect(() => {
    async function loadClinicCount() {
      try {
        const { count, error } = await supabase
          .from("clinic_profiles")
          .select("*", { count: "exact", head: true });

        if (error) throw error;
        setClinicCount(count ?? 0);
      } catch (error) {
        console.error("Failed to fetch clinic count:", error);
      }
    }

    loadClinicCount();
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMoved(true);
    }
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(
          `id, username, website, avatar_url, role, last_name, first_name, isFirst, isWarning, isBan, notif_message`
        ) // Include role here
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
        setRole(data.role || null);
        setLastname(data.last_name);
        setFirstname(data.first_name);
        setNotifMessage(data.notif_message || "");

        if (data.isFirst !== viewFirst) {
          setviewFirst(true);
        }
        if (data.isWarning !== warn) {
          setWarn(true);
        }
        if (data.isBan !== ban) {
          setBan(true);
        }

        console.log(warn);

        // Redirect based on role
        if (data.role === "admin") {
          router.push("/accAdmin");
        } else if (data.role === "clinic") {
          router.push("/accClinic");
          console.log('TRANSFERRED');
        }
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string | null;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return <Text>Loading...</Text>;
  }


const createAppointment = async (
  client_id: string,
  datetime: Date,
  message: string,
  request: any
) => {
  console.log("🟢 createAppointment called");
  
  if (!session?.user?.id) {
    console.error("❌ No session user ID found");
    return null;
  }

  console.log("🟢 Session user ID:", session.user.id);

  const result = await supabase
    .from("appointments")
    .insert([
      {
        clinic_id: client_id,
        patient_id: session.user.id,
        date_time: datetime.toISOString(),
        message: 'HELLO',
        request: tempSelectedDentists,
        notification_sent: false
      },
    ])
    .select();

  if (result.error) {
    console.error("❌ Error inserting appointment:", result.error.message);
    return null;
  }

  console.log("✅ Appointment created successfully");
  console.log("🟡 About to call activityLogger.log...");
  
  // Try to log activity
  try {
    await activityLogger.log(
      session.user.id, 
      'user', 
      'Created appointment'
    );
  } catch (error) {
    console.error("❌ Error calling activity logger:", error);
  }

  await fetchAppointments();
  return result.data;
};


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

        // Try to log activity
      try {
        await activityLogger.log(
          session.user.id, 
          'user', 
          'Changed profile picture'
        );
      } catch (error) {
        console.error("❌ Error calling activity logger:", error);
      }

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
      await supabase
        .from("clinic_profiles")
        .update({ clinic_photo_url: publicUrl })
        .eq("id", session!.user.id);

      setAvatarUrl(publicUrl);
    }
  };

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

  const wrapText = (text: string, limit = 40) => {
    if (!text) return "No message available";

    const words = text.split(" ");

    // ✅ special case: only one word and it's too long
    if (words.length === 1 && words[0].length > 30) {
      return words[0].substring(0, 40) + "...";
    }

    let lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= limit) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word; // start new line
      }
    });

    if (currentLine) lines.push(currentLine);

    return lines.join("\n"); // insert line breaks
  };

type OptionKey =
  | 'teethCheckUp'
  | 'cavitiesRemoval'
  | 'chippedOrCracked'
  | 'braces'
  | 'others';

const optionsList: { label: string; key: OptionKey }[] = [
  { label: 'Teeth Check Up', key: 'teethCheckUp' },
  { label: 'Cavities Removal', key: 'cavitiesRemoval' },
  { label: 'Chipped or Cracked Teeth', key: 'chippedOrCracked' },
  { label: 'Braces', key: 'braces' },
  { label: 'Others', key: 'others' },
];


const toggleReason = (reason: string) => {
  setSelectedReasons((prev) => {
    const updated = prev.includes(reason)
      ? prev.filter((r) => r !== reason)
      : [...prev, reason];

    // Rebuild full messageToClinic
    const combined = [...updated];
    if (isOthersChecked && tempMessage.trim()) {
      combined.push(tempMessage.trim());
    }
    setMessageToClinic(combined.join(", "));

    return updated;
  });
};


type Appointment = {
  id: string;
  created_at: string;
  clinic_id: string;
  patient_id: string;
  date_time: string;
  message: string;
  clinic_profiles: {
    clinic_name: string;
    email: string;
    dentists?: { first_name: string; last_name: string }[];
  };
  profiles: { first_name: string; last_name: string, email: string; };
  outcome: string;
  isAccepted: boolean | null;
  rejection_note: string;
  request: string;
};

const base64ArrayBuffer = (arrayBuffer: ArrayBuffer) => {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;

    const triplet = (a << 16) | (b << 8) | c;

    base64 += base64Chars[(triplet >> 18) & 0x3f];
    base64 += base64Chars[(triplet >> 12) & 0x3f];
    base64 += i + 1 < len ? base64Chars[(triplet >> 6) & 0x3f] : '=';
    base64 += i + 2 < len ? base64Chars[triplet & 0x3f] : '=';
  }
  return base64;
};

const handleDownloadExcel = async (appointmentsPast: Appointment[]) => {
  if (!appointmentsPast || appointmentsPast.length === 0) {
    Alert.alert('No data to export');
    return;
  }

  const dataToExport = appointmentsPast.map(item => ({
    'Clinic Name': item.clinic_profiles?.clinic_name || '',
    Patient: item.profiles?.last_name || '',
    Dentist: item.clinic_profiles?.dentists?.length
      ? item.clinic_profiles.dentists
          .map(d => `${d.first_name} ${d.last_name}`)
          .join(', ')
      : 'No dentists listed',
    Request: (() => {
      try {
        return JSON.parse(item.request).join(', ');
      } catch {
        return item.request || 'No request data';
      }
    })(),
    'Request Date & Time': new Date(item.date_time).toLocaleString(),
    Message: item.message,
    Status:
      item.isAccepted === true
        ? 'Accepted'
        : item.isAccepted === false
        ? 'Rejected'
        : 'Pending',
    'Rejection Note':
      item.isAccepted === false
        ? item.rejection_note || 'No rejection note'
        : '-',
    'Created At': new Date(item.created_at || 0).toLocaleString(),
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'History');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  if (Platform.OS === 'web') {
    const { saveAs } = await import('file-saver');
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'history.xlsx');
  } else {
    try {
      const base64 = base64ArrayBuffer(wbout.buffer || wbout);
      const fileUri = FileSystem.documentDirectory + 'history.xlsx';

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error exporting file');
    }
  }
};

const availableDays: number[] = [];

if (selectedSunday?.from && selectedSunday?.to) availableDays.push(0);
if (selectedMonday?.from && selectedMonday?.to) availableDays.push(1);
if (selectedTuesday?.from && selectedTuesday?.to) availableDays.push(2);
if (selectedWednesday?.from && selectedWednesday?.to) availableDays.push(3);
if (selectedThursday?.from && selectedThursday?.to) availableDays.push(4);
if (selectedFriday?.from && selectedFriday?.to) availableDays.push(5);
if (selectedSaturday?.from && selectedSaturday?.to) availableDays.push(6);

function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function getScheduleMinutes(schedule: ClockScheduleType): number {
  const hour = schedule.hour % 12 + (schedule.atm === "PM" ? 12 : 0);
  return hour * 60 + schedule.minute;
}

function isAtLeast30MinsBeforeClosing(appointment: Date, closing: ClockScheduleType): boolean {
  const appointmentMins = getMinutesSinceMidnight(appointment);
  const closingMins = getScheduleMinutes(closing);
  return appointmentMins <= closingMins - 30;
}



  return ( 
    <LinearGradient
      colors={["#ffffffff", "#6ce2ffff"]}
      style={{
        flex: 1,
        justifyContent: "center",
        flexDirection: isMobile ? "column" : "row",
        width: "100%",
        position: "relative",
      }}
    >
     <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={viewFirst} onBackdropPress={() => setviewFirst(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>            
        <View
          style={{
            width: isMobile ? '90%' : '40%',
            backgroundColor: '#f1f5f9',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: "center",
              color: "#00505cff",
            }}
          >
            Hello! Welcome to Smile Studio!
          </Text>
          <FontAwesome5 name="user-edit" size={isMobile ? 75 : 150} color="#59819aff" />
          <Text
            style={{
              fontSize: 16,
              marginBottom: 20,
              alignSelf: "center",
              color: "#1f5474ff",
              textAlign: 'center',
            }}
          >
            wanna edit/setup your information? let me guide you!
          </Text>
        <View
          style={{
            flexDirection: 'row',
            width: '48%',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 5,
              marginVertical: 5,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={async () => {
              try {
                // Update `isFirst` to false in Supabase
                const { error } = await supabase
                  .from('profiles')
                  .update({ isFirst: false })
                  .eq('id', session?.user.id); // Use the current user's ID

                if (error) {
                  console.error('Failed to update isFirst:', error.message);
                  Alert.alert('Error', 'Failed to update your profile.');
                  return;
                }

                // Close the modal locally
                setviewFirst(false);
              } catch (err) {
                console.error('Unexpected error:', err);
                Alert.alert('Error', 'Something went wrong.');
              }
            }}
          >
            <Text style={{ color: '#00505cff', fontWeight: 'bold' }}>I'll pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#00505cff',
              padding: 10,
              borderRadius: 5,
              marginVertical: 5,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={async () => {
              try {
                // Update `isFirst` to false in Supabase
                const { error } = await supabase
                  .from('profiles')
                  .update({ isFirst: false })
                  .eq('id', session?.user.id); // Use the current user's ID

                if (error) {
                  console.error('Failed to update isFirst:', error.message);
                  Alert.alert('Error', 'Failed to update your profile.');
                  return;
                }

                // Close the modal locally
                setviewFirst(false);
                setModalUpdate(true);
              } catch (err) {
                console.error('Unexpected error:', err);
                Alert.alert('Error', 'Something went wrong.');
              }
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Sure!</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={warn} onBackdropPress={() => setWarn(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>            
        <View
          style={{
            width: isMobile ? '90%' : '40%',
            backgroundColor: '#f1f5f9',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: "center",
              color: "#00505cff",
            }}
          >
            WARNING!
          </Text>
          <Entypo name="warning" size={isMobile? 75 : 150} color="#d7c41aff" />
          <Text
            style={{
              fontSize: 16,
              alignSelf: "center",
              color: "#00505cff",
              fontWeight: "bold",
              textAlign: 'center',
            }}
          >
            The reason why you are seeing this is that you have violated our community guidelines.
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 30,
              alignSelf: "center",
              color: "#1f5474ff",
              textAlign: 'center',
            }}
          >
            Admin: {notifMessage}
          </Text>
          <Text
            style={{
              fontSize: 16,
              alignSelf: "center",
              color: "#1f5474ff",
              textAlign: 'center',
            }}
          >
            Please read our term of use and privacy policy to avoid getting banned.
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 20,
              alignSelf: "center",
              color: "#2a46ffff",
            }}
            onPress={() => setTermsOfUse(true)}
          >
            Terms of Use and Privacy Policy
          </Text>
        <View
          style={{
            flexDirection: 'row',
            width: '48%',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >

          <TouchableOpacity
            style={{
              backgroundColor: '#00505cff',
              padding: 10,
              borderRadius: 5,
              marginVertical: 5,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={async () => {
                const { error } = await supabase
                  .from('profiles')
                  .update({ isWarning: false })
                  .eq('id', session?.user.id); // Use the current user's ID

                setWarn(false);
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', }}>Understood and Close</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={ban} onBackdropPress={() => setWarn(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>            
        <View
          style={{
            width: isMobile ? '90%' : '40%',
            backgroundColor: '#f1f5f9',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              alignSelf: "center",
              color: "#00505cff",
              textAlign: 'center',
            }}
          >
            Your account has been banned!
          </Text>
          <FontAwesome name="ban" size={isMobile ? 75 : 150} color="#a31b0cff" />
          <Text
            style={{
              fontSize: 16,
              alignSelf: "center",
              color: "#00505cff",
              fontWeight: "bold",
              textAlign: 'center',
            }}
          >
            The reason why you are seeing this is that you have violated our community guidelines.
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 30,
              alignSelf: "center",
              color: "#1f5474ff",
              textAlign: 'center',
            }}
          >
            Admin: {notifMessage}
          </Text>


        <View
          style={{
            flexDirection: 'row',
            width: '48%',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >

          <TouchableOpacity
            style={{
              backgroundColor: '#00505cff',
              padding: 10,
              borderRadius: 5,
              marginVertical: 5,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={async () => {
              setModalSignout(true)
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalMessage} onBackdropPress={() => setModalMessage(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>            
        <View
          style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#f1f5f9",
            width: "80%",
            maxWidth: 500,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: "#00505cff",
            }}
          >
            Message
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 20,
              color: "#333",
            }}
          >
            {selectedMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setModalMessage(false)}
            style={{
              alignSelf: "flex-end",
              backgroundColor: "#00505cff",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Glider Panel */}
      <View
        style={{
          width: isMobile ? drawerWidth : "18%",
          left: 0,
          top: 0,
          flexDirection: "row",
          height: "100%",
          position: "absolute",
          zIndex: 1,
          transform: [{ translateX: isMobile ? mobbutoffset : offset }],
        }}
      >
        <LinearGradient
          style={{
            ...styles.glider,
            bottom: 0,
            left: 0,
            top: 0,
          }}
          colors={['#80c4c4ff', '#009b84ff']}
        >
          <View style={{ flex: 1, width: "100%" }}>
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
                    <Text style={{ fontSize: 18, marginBottom: 20, textAlign: "center", color: 'black'}} > Do you wanna signout? </Text>

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
                source={require("../../assets/favicon.ico.png")}
                style={{...styles.logo, marginTop: isMobile ? -50  : null}}
              />

            <Text style={{fontWeight: 'bold', fontSize: 20, marginTop: -40, color: '#00505cff', textAlign: 'center', }}>SMILE STUDIO</Text>
            <Text style={{fontSize: 12, color: '#00505cff', textAlign: 'center', marginBottom: 7, }}>GRIN CREATORS</Text>
            <View style={{padding: 7, marginLeft: 40, marginRight: 40, backgroundColor: 'white', marginBottom: 30, borderRadius: 10}}>
              <Text style={{fontSize: 12, color: '#00505cff', textAlign: 'center'}}>PATIENT</Text>
            </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#00505cff',
                    borderRadius: 12,
                    marginTop:0,
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
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        textAlign: "center",
                      }}
                    >
                      Change Photo
                    </Text>
                  )}
                </TouchableOpacity>

               <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalUpdate} onBackdropPress={() => setModalUpdate(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>                        
                  <View
                    style={{
                      backgroundColor: '#f1f5f9',
                      borderRadius: 12,
                      padding: 20,
                      alignItems: "center",
                      width: !isMobile ? "25%" : "85%",
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
                        style={styles.avatarContainer}
                      >
                        {avatarUrl ? (
                          <Image
                            source={{
                              uri: avatarUrl
                                ? `${avatarUrl}?t=${Date.now()}`
                                : require("../../assets/default.png"),
                            }} // ✅ Type-safe (fallback empty string)
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <MaterialIcons
                              name="person"
                              size={50}
                              color="#ccc"
                            />
                          </View>
                        )}
                        <View style={styles.cameraIcon}>
                          <MaterialIcons
                            name="camera-alt"
                            size={20}
                            color="#007AFF"
                          />
                        </View>
                      </TouchableOpacity>

                      <Text style={styles.avatarText}>
                        Tap to change profile picture
                      </Text>
                    </View>

                    {/* Rest of your profile content */}
                    <View>
                      <Text style={{fontWeight: "bold", fontStyle: "italic", fontSize: 16, textAlign: "center", color: '#00505cff', marginBottom: 20}}>
                        {firstname} {lastname}
                      </Text>
                    </View>

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
                          backgroundColor: '#00505cff',
                          paddingVertical: 12,
                          borderRadius: 8,
                          marginRight: 8,
                        }}
                        onPress={() => setModalUpdate(false)}
                      >
                        <Text
                          style={{
                            color: '#ffffffff',
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: "center",
                marginTop: 12,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ ...styles.container, width: "100%" }}>

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
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color="black" />
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
    <ActivityIndicator animating color="black" />
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
    setDashboardView("appointments");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "appointments" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="calendar" size={24} color={dashboardView === "appointments" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "appointments" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Appointments
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("pending");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "pending" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="clock-o" size={24} color={dashboardView === "pending" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "pending" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Requests
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("history");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "history" ? '#ffffff' : 'transparent',
    borderRadius: 15,
    padding: 10,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="history" size={24} color={dashboardView === "history" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "history" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        History
      </Text>
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
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="comments" size={24} color={dashboardView === "chats" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "chats" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Chats
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
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="users" size={24} color={dashboardView === "team" ? '#00505cff' : '#ffffff'} />
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
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color="black" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="cube" size={24} color={dashboardView === "ar" ? '#00505cff' : '#ffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "ar" ? '#00505cff' : '#ffffff',
        marginLeft: 8,
      }}>
        Virtual Braces
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

      {/* Dashboard Profile */}
      <LinearGradient
        style={{ flex: 1, position: "relative" }}
        colors={['#b9d7d3ff', '#00505cff']}
      >
        {/* Dashboard Profile --------------------------------------------------------------------------------------- */}

        {dashboardView === "profile" && (
        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "profile" ? 11 : 20000,
              backgroundColor: '#f1f5f9',
            },
          ]}
        >
          <ScrollView>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 20,
                alignSelf: isMobile ? "center" : "flex-start",
                color: '#00505cff',
              }}
            >
              Profile
            </Text>
            <View style={styles.proinfo}>
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
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
                {firstname} {lastname}
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
            </View>
            {/* mymap */}
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 50,
                    textAlign: "center",
                    color: '#00505cff',
                  }}
                >
                  {clinicCount !== null ? clinicCount : "..."}
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 6,
                    fontSize: isMobile ? 15 : 25,
                    color: '#00505cff',
                  }}
                >
                  SJDM Clinics
                </Text>
              </View>
              <View style={styles.card}>
                <View style={{ flexDirection: "column" }}>
                  <View>
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 6,
                        fontSize: isMobile ? 15 : 25,
                        color: '#00505cff',
                      }}
                    >
                      Running Appointments
                    </Text>
                  </View>
                  <View style={{ marginTop: 20, alignItems: "center" }}>
                    <TouchableOpacity
                      style={{...styles.redButton, backgroundColor: '#00505cff'}}
                      onPress={() => setModalVisible(true)}
                    >
                      <Text
                        style={{
                          ...styles.buttonText1,
                          fontSize: isMobile ? 10 : 25,
                          color: "#fff"
                        }}
                      >
                        Overview
                      </Text>
                    </TouchableOpacity>
                  </View>

 <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View
      style={{
        ...styles.modalContent,
        width: isMobile ? "90%" : "20%",
        maxHeight: "70%",
        backgroundColor: '#f1f5f9',
        paddingHorizontal: isMobile ? null : 200,
      }}
    >

      <TouchableOpacity
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          backgroundColor: "#00505cff",
          padding: 8,
          borderRadius: 50,
        }}
        onPress={() => setModalVisible(false)}
      >
        <Text style={{ fontWeight: "bold", color: "white" }}>X</Text>
      </TouchableOpacity> 

        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            alignSelf: "center",
            color: "#00505cff",
          }}
        >
          Appointments
        </Text>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          width: '100%',
        }}
      >
        <View style={{ padding: 20 }}>
          {/* Appointment Section */}
          <FlatList
            data={appointmentsCurrentList}
            keyExtractor={(e) => e.id}
            renderItem={(e) => (
              <View
                style={{
                  width: isMobile ? null : 300,
                  borderRadius: 10,
                  padding: 15,
                  backgroundColor: "#ffffffff",
                  marginBottom: 5,
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {`Clinic Name : ${wrapText(
                    e.item.clinic_profiles.clinic_name
                  )}`}
                </Text>
                {e.item.message.length > 20 ? (
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSelectedMessage(e.item.message);
                      setModalMessage(true);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: "blue", textDecorationLine: "underline", marginBottom: 8 }}>
                      {e.item.message.slice(0, 20) + "..."}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ flex: 1 }}>
                    {e.item.message}
                  </Text>
                )}
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                  Requested Dentists/Staff :
                </Text>
                <Text>
                  {(() => {
                    try {
                      return JSON.parse(e.item.request).join("\n");
                    } catch {
                      return e.item.request;
                    }
                  })()}
                </Text>
                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    marginBottom: 10,
                    marginTop: 15
                  }}
                >
                  <Text style={{ color: "#000000ff" }}>
                    {`Date/Time Request :\n${new Date(e.item.date_time).toLocaleString(undefined, {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`}
                  </Text>
                </View>
                <Text style={{ color: "#767676ff", fontSize: 9, alignSelf: "flex-end" }}>
                  {`Created at : ${new Date(
                    e.item.created_at || 0
                  ).toLocaleString()}`}
                </Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  padding: 15,
                  backgroundColor: "#f1f1f1",
                  marginBottom: 5,
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  - NO APPOINTMENTS -
                </Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

    </View>
</Modal>

                </View>
              </View>
            </View>
          <View
            style={{
              width: "100%",
              paddingHorizontal: 8,
              flexDirection: isMobile ? "column" : "row",
              flexWrap: "wrap",
              gap: 15,
              paddingBottom: 25,
              alignItems: "center",
              justifyContent: "center",
            
            }}
          >
            {/* Your Requests Section */}
            <View style={{ 
              flex: 1, 
              padding: 16, 
              backgroundColor: "#ffffffff", 
              borderRadius: 8, 
              width: isMobile ? "100%" : "90%",
              height: isMobile ? null : 400, 
            }}>
              <Text style={{ alignSelf: "center", fontWeight: "bold", fontSize: 24, color: '#00505cff', marginBottom: 10, }}> 
                Your Requests 
              </Text>

              <FlatList
                data={
                  isMobile
                    ? (appointmentsList ?? []).slice(0, 3)
                    : appointmentsList ?? []
                }
                keyExtractor={(e) => e.id}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                contentContainerStyle={{
                  gap: 10,
                  paddingBottom: 20,
                  alignItems:
                    (appointmentsList?.length ?? 0) === 0
                      ? "center"
                      : "stretch",
                }}
                renderItem={(e) => (
                  <View
                    style={{
                      width: "100%",
                      gap: 5,
                      paddingHorizontal: 20,
                      paddingVertical: 15,
                      backgroundColor: "#ffffd7ff",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Clinic Name :</Text>
                    <Text>{`${e.item.clinic_profiles.clinic_name}`}</Text>

                    <Text style={{ fontWeight: "bold" }}>
                      Date & Time of Appointment :
                    </Text>
                    <Text>
                      {`${new Date(e.item.date_time).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}`}
                    </Text>

                    <Text style={{ fontWeight: "bold" }}>
                      Requested Dentists/Staff :
                    </Text>
                    <Text>
                      {(() => {
                        try {
                          return JSON.parse(e.item.request).join("\n");
                        } catch {
                          return e.item.request;
                        }
                      })()}
                    </Text>

                    <View
                      style={{
                        marginTop: 10,
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: "#fffce9ff",
                        borderWidth: 1,
                        borderColor: "#ffe680",
                      }}
                    >
                      <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                        Patient's Message :
                      </Text>
                      {e.item.message.length > 20 ? (
                        <Text style={{ textAlign: "left", flex: 1 }}>
                          <Text style={{ color: "#000" }}>
                            {e.item.message.slice(0, 20) + "..."}
                          </Text>
                          <Text
                            onPress={() => {
                              setSelectedMessage(e.item.message);
                              setModalMessage(true);
                            }} 
                            style={{ color: "blue", textDecorationLine: "underline" }}
                          >
                            See More
                          </Text>
                        </Text>
                      ) : (
                        <Text style={{ flex: 1 }}>
                          {e.item.message}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={{
                        textAlign: "right",
                        color: "#2c2c2cff",
                        fontSize: 10,
                      }}
                    >
                      {`Created at : ${new Date(
                        e.item.created_at || 0
                      ).toLocaleString()}`}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text
                    style={{ fontSize: 20, color: "gray", marginTop: 40 }}
                  >
                    - No Requests -
                  </Text>
                }
              />
              {isMobile && (appointmentsList?.length ?? 0) > 3 && (
                <Text
                  onPress={() => {
                    setDashboardView("pending");
                  }}
                  style={{
                    fontSize: 14,
                    color: "blue",
                    marginTop: 10,
                    textAlign: "center",
                  }}
                >
                  ...navigate to requests to view all
                </Text>
              )}
            </View>

            {/* History Section */}
            <View
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: "#ffffffff",
                borderRadius: 8,
                width: isMobile ? "100%" : "90%",
                height: isMobile ? null : 400,
              }}
            >
              <Text style={{ alignSelf: "center", fontWeight: "bold", fontSize: 24, color: '#00505cff', marginBottom: 10, }}> 
                History 
              </Text>

              <FlatList
                data={
                  isMobile
                    ? (appointmentsPast ?? []).slice(0, 3)
                    : appointmentsPast ?? []
                }
                keyExtractor={(e) => e.id}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                contentContainerStyle={{
                  gap: 10,
                  paddingBottom: 20,
                  alignItems:
                    (appointmentsPast?.length ?? 0) === 0
                      ? "center"
                      : "stretch",
                }}
                renderItem={(e) => (
                  <View
                    style={{
                      width: "100%",
                      gap: 5,
                      padding: 5,
                      backgroundColor: e.item.isAccepted
                        ? "#e4ffe0ff"
                        : "#ffe0e0ff",
                      borderRadius: 8,
                      paddingHorizontal: 20,
                      paddingVertical: 15,
                    }}
                  >
                    <Text style={{ fontWeight: "bold", color: '#555' }}>Clinic Name :</Text>
                    <Text style={{ color: '#555'}}>{`${e.item.clinic_profiles.clinic_name} ${e.item.profiles.last_name}`}</Text>

                    <Text style={{ fontWeight: "bold",  color: '#555' }}>Date & Time :</Text>
                    <Text style={{ color: '#555'}}>
                      {`${new Date(e.item.date_time).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}`}
                    </Text>

                    <Text style={{ fontWeight: "bold",  color: '#555' }}>
                      Requested Dentists/Staff :
                    </Text>
                    <Text style={{ color: '#555'}}>
                      {(() => {
                        try {
                          return JSON.parse(e.item.request).join("\n");
                        } catch {
                          return e.item.request;
                        }
                      })()}
                    </Text>

                    <View
                      style={{
                        marginTop: 10,
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: !e.item.isAccepted
                          ? "#fff3f3"
                          : "#e9fdecff",
                        borderWidth: 1,
                        borderColor: !e.item.isAccepted
                          ? "#ffcccc"
                          : "#b6e4beff",
                      }}
                    >
                      <Text style={{ fontWeight: "bold", marginBottom: 4,  color: '#555' }}>
                        Patient's Message :
                      </Text>
                      {e.item.message.length > 20 ? (
                        <Text style={{ textAlign: "left", flex: 1,  color: '#555' }}>
                          <Text style={{ color: "#000" }}>
                            {e.item.message.slice(0, 20) + "..."}
                          </Text>
                          <Text
                            onPress={() => {
                              setSelectedMessage(e.item.message);
                              setModalMessage(true);
                            }} 
                            style={{ color: "blue", textDecorationLine: "underline" }}
                          >
                            See More
                          </Text>
                        </Text>
                      ) : (
                        <Text style={{ flex: 1,  color: '#555'}}>
                          {e.item.message}
                        </Text>
                      )}
                    </View>

                    <Text style={{ fontWeight: "bold", marginTop: 7,  color: '#555' }}> 
                      Status : 
                    </Text>
                    <Text style={{ color: '#555'}}>
                      {e.item.isAccepted
                        ? "Accepted"
                        : e.item.isAccepted === false
                        ? "Rejected"
                        : "Rejected : past due"}
                    </Text>

                    {e.item.isAccepted == false && (
                      <View
                        style={{
                          marginTop: 10,
                          padding: 8,
                          borderRadius: 6,
                          backgroundColor: "#fff3f3",
                          borderWidth: 1,
                          borderColor: "#ffcccc",
                        }}
                      >
                        <Text style={{ fontWeight: "bold", marginBottom: 4,  color: '#555' }}>
                          Clinic's Rejection Message :
                        </Text>
                        <Text style={{ color: '#555'}}>
                          {e.item.rejection_note || "No rejection note"}
                        </Text>
                      </View>
                    )}

                    <Text style={{ fontWeight: "bold",  color: '#555' }}>Attendance :</Text>
                    <Text style={{ flex: 1,  color: '#555' }}>
                      {e.item.isAttended === true
                        ? "Attended"
                        : e.item.isAttended === false
                        ? "Not Attended"
                        : "Not Attended"}
                    </Text>

                    <Text
                      style={{
                        textAlign: "right",
                        color: "#2c2c2cff",
                        fontSize: 10,
                      }}
                    >
                      {`Created at : ${new Date(
                        e.item.created_at || 0
                      ).toLocaleString()}`}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text
                    style={{
                      fontSize: 20,
                      color: "gray",
                      marginTop: 40,
                      marginBottom: 40,
                    }}
                  >
                    - No History -
                  </Text>
                }
              />

              {isMobile && (appointmentsPast?.length ?? 0) > 3 && (
                <Text
                  onPress={() => {
                    setDashboardView("history");
                  }}
                  style={{
                    fontSize: 14,
                    color: "blue",
                    marginTop: 10,
                    textAlign: "center",
                  }}
                >
                  ...navigate to history to view all
                </Text>
              )}
            </View>
          </View>
          </ScrollView>
        </View>
        )}

        {/* Dashboard Clinics --------------------------------------------------------------------------------------- */}

        {dashboardView === "clinics" && (
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
            {/*Clinic Map View*/}
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
                <View
                  style={{
                    flexDirection: isMobile ? "column" : "row",
                    flexWrap: isMobile ? "nowrap" : "wrap",
                    justifyContent: isMobile ? "flex-start" : "center",
                  }}
                >
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
                          width: isMobile ? "95%" : "45%",
                        }}
                      >
                      {/* Left side: Image + Info */}
                      <View
                        style={{
                          flex: 7,
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: 4,
                        }}
                      >
                        {/* 222 */}
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
        setappointmentName(clinic.clinic_name);
        setMapView([clinic.longitude, clinic.latitude]);
        chatWithClinic(clinic.id);
        setSelectedCI(clinic.introduction);
        setSelectedOffers(clinic.offers);
        setOfferList(clinic.offers || []);
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
          width: isMobile ? "90%" : "35%",
          borderWidth: 2,
          borderColor: "rgba(214, 214, 214, 1)",
          elevation: 8,
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
            <Text style={{ fontSize: isMobile ? 16 : 22, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 }}>
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

        {/* Buttons Row */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          {/* Message Button */}
          <TouchableOpacity
            onPress={() => {
              chatWithClinic(clinic.id);
              setviewClinic(false);
              setDashboardView("chats");
            }}
            style={{
              flex: 1,
              backgroundColor: "#3498db",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              elevation: 4,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Message
            </Text>
          </TouchableOpacity>

          {/* View Full Button */}
          <TouchableOpacity
            onPress={() => {
              setFullProfile(true);
            }}
            style={{
              flex: 1,
              backgroundColor: "#2ecc71",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              elevation: 4,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              View Full
            </Text>
          </TouchableOpacity>
        </View>
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
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginTop: 16,
                  gap: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setFullProfile(false);
                    setviewClinic(false);
                    setDashboardView("chats");
                  }}
                  style={{
                    backgroundColor: "#3498db",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flex: 1,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    shadowColor: "#3498db",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <FontAwesome5 name="comments" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setModalAppoint(true);
                  }}
                  style={{
                    backgroundColor: "#34db6cff",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flex: 1,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    shadowColor: "#34db6cff",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <FontAwesome5 name="calendar-check" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Appoint</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalMap(true)}
                  style={{
                    backgroundColor: "#f39c12",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flex: 1,
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
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setFullProfile(false);
                setviewClinic(false);
                setDashboardView("chats");
              }}
              style={{
                backgroundColor: "#3498db",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                flex: 1,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: "#3498db",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <FontAwesome5 name="comments" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setModalAppoint(true);
              }}
              style={{
                backgroundColor: "#34db6cff",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                flex: 1,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: "#34db6cff",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <FontAwesome5 name="calendar-check" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Appoint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalMap(true)}
              style={{
                backgroundColor: "#f39c12",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                flex: 1,
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
                          <Text style={{ color: 'black', marginBottom: 2, fontSize: isMobile ? 13 : 16 }}>
                            {clinic.address || "No address provided"}
                          </Text>

                        </View>
                      </View>

                      {/* Right side: Buttons */}
                      <View style={{ flex: 3, justifyContent: "space-around" }}>
                        {/* Create Appointment */}
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedSunday(clinic.clinic_schedule[0]?.sunday || {});
                            setSelectedMonday(clinic.clinic_schedule[0]?.monday || {});
                            setSelectedTuesday(clinic.clinic_schedule[0]?.tuesday || {});
                            setSelectedWednesday(clinic.clinic_schedule[0]?.wednesday || {});
                            setSelectedThursday(clinic.clinic_schedule[0]?.thursday || {});
                            setSelectedFriday(clinic.clinic_schedule[0]?.friday || {});
                            setSelectedSaturday(clinic.clinic_schedule[0]?.saturday || {});
                            setSelectedClinicId(clinic.id);
                            setappointmentName(clinic.clinic_name);
                            setOfferList(clinic.offers || []);
                            setModalAppoint(true);
                            setDentistList(clinic.dentists)
                          }}
                          style={{
                            backgroundColor: "#00aa55",
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            alignItems: "center",
                            marginBottom: 2,
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
                            Create an Appointment
                          </Text>
                        </TouchableOpacity>

                        {/* Appointment Modal */}
                        <Modal animationIn="fadeIn" animationOut="fadeOut" isVisible={modalAppoint} backdropColor="#000" backdropOpacity={0.1}  onBackdropPress={() => setModalAppoint(false)} style={{alignItems: "center", justifyContent: "center"}}>
                        
                            <View
                              style={{
                                backgroundColor: "white",
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                width: !isMobile ? "30%" : "90%",
                                maxHeight: "90%",
                              }}
                            >
                              <ScrollView
                                contentContainerStyle={{
                                  padding: 20,
                                  flexGrow: 1,
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    marginBottom: 20,
                                    alignSelf: "center",
                                    color: "#00505cff",
                                  }}
                                >
                                  APPOINTMENT
                                </Text>

                                <Text
                                  style={{
                                    fontSize: 18,
                                    marginBottom: 20,
                                    textAlign: "center",
                                  }}
                                >
                                  {appointmentName}
                                </Text>
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingHorizontal: 10, }} >
                                  {[
                                    { label: "Sunday", time: selectedSunday },
                                    { label: "Monday", time: selectedMonday },
                                    { label: "Tuesday", time: selectedTuesday },
                                    { label: "Wednesday", time: selectedWednesday },
                                    { label: "Thursday", time: selectedThursday },
                                    { label: "Friday", time: selectedFriday },
                                    { label: "Saturday", time: selectedSaturday },
                                  ]
                                    .filter((day) => day.time && day.time.from && day.time.to)
                                    .map((day) => (
                                      <View
                                        key={day.label}
                                        style={{
                                          backgroundColor: "#fff",
                                          borderRadius: 10,
                                          paddingVertical: 6,
                                          paddingHorizontal: 12,
                                          shadowColor: "#000",
                                          shadowOpacity: 0.05,
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowRadius: 2,
                                          elevation: 1,
                                          alignItems: "center",
                                          justifyContent: "center",
                                          minWidth: 90,
                                        }}
                                      >
                                        <Text style={{ fontWeight: "600", fontSize: 13, color: "#1f2937" }}>
                                          {day.label}
                                        </Text>
                                        <Text style={{ color: "#2563eb", fontWeight: "500", fontSize: 12 }}>
                                          {`${day.time.from.hour}:${day.time.from.minute
                                            ?.toString()
                                            .padStart(2, "0")} - ${day.time.to.hour}:${day.time.to.minute
                                            ?.toString()
                                            .padStart(2, "0")}`}
                                        </Text>
                                      </View>
                                    ))}

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
                                        fontSize: 13,
                                        textAlign: "center",
                                        marginTop: 8,
                                      }}
                                    >
                                      No schedule available
                                    </Text>
                                  )}
                              </View>

                              {[
                                  selectedSunday,
                                  selectedMonday,
                                  selectedTuesday,
                                  selectedWednesday,
                                  selectedThursday,
                                  selectedFriday,
                                  selectedSaturday,
                                ].every((day) => !day || day.from == null || day.to == null) ? (
                                  // Show only message if no schedule available
                                  <View style={{ marginTop: 20, marginBottom: 20, width: '100%' }}>
                                    <TouchableOpacity
                                      style={{
                                        backgroundColor: "#b32020",
                                        paddingVertical: 12,
                                        borderRadius: 8,
                                        width: "100%",
                                      }}
                                      onPress={() => {
                                        setModalAppoint(false);
                                        setMessageToClinic("");
                                        setIsOthersChecked(false);
                                        setTempMessage("");
                                        setSelectedReasons([]);
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: "white",
                                          fontWeight: "bold",
                                          textAlign: "center",
                                        }}
                                      >
                                        Close
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <>
                                  <CalendarPicker
                                    day={date.getDate()}
                                    month={date.getMonth() + 1}
                                    year={date.getFullYear()}
                                    availableDays={availableDays}
                                    onDaySelect={(day, month, year) => {
                                      setAppointmentDate((prev) => {
                                        const time = new Date(prev);
                                        time.setDate(day);
                                        time.setMonth(month - 1);
                                        time.setFullYear(year);
                                        return time;
                                      });
                                    }}
                                  />

                                  {/* Time */}
                                  <Text style={{ alignSelf: "flex-start", marginBottom: 5 }}>*Time</Text>
                                  <TimePicker
                                    minuteSkipBy={1}
                                    onTimeSelected={(hh, mm, atm) => {
                                      setAppointmentDate((prev) => {
                                        const time = new Date(prev);
                                        const hourNum = Number(hh);
                                        const formatHour =
                                          atm === "AM"
                                            ? hourNum === 12 ? 0 : hourNum
                                            : hourNum === 12 ? 12 : hourNum + 12;

                                        time.setHours(formatHour);
                                        time.setMinutes(Number(mm));
                                        return time;
                                      });
                                    }}
                                    trigger={undefined}
                                  />


                                {/* Choose Dentist */}
                                <Text style={{ alignSelf: "flex-start", marginBottom: 5, marginTop: 10 }}>
                                  *Choose Dentist/Staff
                                </Text>                  

                                {/* Trigger Button to open Dentist Modal */}
                                <TouchableOpacity
                                  style={{
                                    width: "100%",
                                    padding: 12,
                                    backgroundColor: "#e2e8f0",
                                    borderRadius: 6,
                                    marginBottom: 10,
                                  }}
                                  onPress={() => {
                                    setTempSelectedDentists([...selectedDentists]);
                                    setShowDentistModal(true);
                                  }}
                                >
                                  <Text style={{ textAlign: "center", color: "#333", fontWeight: "bold" }}>
                                    Select Dentist/s, Staff...
                                  </Text>
                                </TouchableOpacity>

                                {/* Modal to select Dentists */}
                                <Modal
                                  visible={showDentistModal}
                                  transparent
                                  animationType="fade"
                                  onRequestClose={() => setShowDentistModal(false)}
                                >
                                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                                    <View
                                      style={{
                                        backgroundColor: "white",
                                        borderRadius: 12,
                                        padding: 20,
                                        width: isMobile ? "90%" : "40%",
                                        maxHeight: "80%",
                                        borderWidth: 1,
                                        borderColor: "#ccc",
                                      }}
                                    >
                                      <ScrollView>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, color: '#00505cff' }}>
                                          Select Available Dentists and Staff
                                        </Text>

                                {(() => {

                                  return (
                                    <View>
                                      {/* Fixed Roles */}
                                      {fixedRoles.map((role, index) => {
                                        const selected = tempSelectedDentists.includes(role);
                                        return (
                                          <View key={`fixed-${index}`} style={{ marginBottom: 15 }}>
                                            <TouchableOpacity
                                              onPress={() => toggleTempDentist(role)}
                                              style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
                                            >
                                              <View style={{
                                                height: 20,
                                                width: 20,
                                                borderRadius: 4,
                                                borderWidth: 1,
                                                borderColor: "#888",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                marginRight: 10,
                                                backgroundColor: selected ? "#007bff" : "#fff",
                                              }}>
                                                {selected && <View style={{ width: 10, height: 10, backgroundColor: "#fff" }} />}
                                              </View>
                                              <Text style={{ fontWeight: "bold", color: 'black' }}>{role}</Text>
                                            </TouchableOpacity>
                                          </View>
                                        );
                                      })}

                                      {/* Dentists List */}
                                      {parsedDentistList.map((dentist, index) => {
                                        const name = `Dr. ${dentist.name} (${dentist.specialty})`;
                                        const selected = tempSelectedDentists.includes(name);
                                        const todaySchedule = dentist?.weeklySchedule?.[today] ?? [];
                                        const hasTodaySchedule = todaySchedule.length > 0;

                                        return (
                                          <View key={`dentist-${index}`} style={{ marginBottom: 15 }}>
                                            {/* Dentist Row */}
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                              <TouchableOpacity
                                                onPress={() => toggleTempDentist(name)}
                                                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                                              >
                                                <View style={{
                                                  height: 20,
                                                  width: 20,
                                                  borderRadius: 4,
                                                  borderWidth: 1,
                                                  borderColor: "#888",
                                                  justifyContent: "center",
                                                  alignItems: "center",
                                                  marginRight: 10,
                                                  backgroundColor: selected ? "#007bff" : "#fff",
                                                }}>
                                                  {selected && <View style={{ width: 10, height: 10, backgroundColor: "#fff" }} />}
                                                </View>
                                                <Text style={{ fontWeight: "bold", color: 'black' }}>{name}</Text>
                                              </TouchableOpacity>

                                              <TouchableOpacity onPress={() => toggleSchedule(index)}>
                                                <Text style={{ fontSize: 12, color: "#007bff" }}>
                                                  {expandedDentistIndex === index ? "Hide" : "View"} Schedule
                                                </Text>
                                              </TouchableOpacity>
                                            </View>

                                            {/* Today’s Schedule or Warning */}
                                            {hasTodaySchedule ? (
                                              todaySchedule.map((time, i) => (
                                                <Text key={i} style={{ marginLeft: 30, fontSize: 12, color: "#444" }}>
                                                  🕒 {time}
                                                </Text>
                                              ))
                                            ) : (
                                              <Text style={{ marginLeft: 30, fontSize: 12, color: "#e67300" }}>
                                                ⚠️ No schedule today
                                              </Text>
                                            )}

                                            {/* Full Weekly Schedule */}
                                            {expandedDentistIndex === index && (
                                              <View style={{ marginTop: 6 }}>
                                                {daysOfWeek.map((day, i) => {
                                                  const schedule = dentist.weeklySchedule?.[day] || [];
                                                  return (
                                                    <Text key={i} style={{ marginLeft: 30, fontSize: 12, color: schedule.length ? "#444" : "#999" }}>
                                                      {day}: {schedule.length ? schedule.join(", ") : "No schedule"}
                                                    </Text>
                                                  );
                                                })}
                                              </View>
                                            )}
                                          </View>
                                        );
                                      })}
                                    </View>
                                  );
                                })()}



                                      </ScrollView>

                                      {/* Buttons */}
                                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                                        <TouchableOpacity
                                          style={{
                                            flex: 1,
                                            backgroundColor: "#b32020",
                                            paddingVertical: 12,
                                            borderRadius: 6,
                                            marginRight: 8,
                                          }}
                                          onPress={() => setShowDentistModal(false)}
                                        >
                                          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                            Cancel
                                          </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={{
                                            flex: 1,
                                            backgroundColor: "#2e7dccff",
                                            paddingVertical: 12,
                                            borderRadius: 6,
                                            marginLeft: 8,
                                          }}
                                          onPress={() => {
                                            setSelectedDentists(tempSelectedDentists);
                                            setShowDentistModal(false);
                                          }}
                                        >
                                          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                            Save
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                </Modal>

                                {/* Message */}
                                <Text style={{ alignSelf: "flex-start", marginBottom: 5, marginTop: 10 }}>
                                  *Message to clinic: Reason of Appointment
                                </Text>

                                {/* Trigger Button to open Offer Modal */}
                                <TouchableOpacity
                                  style={{
                                    width: "100%",
                                    padding: 12,
                                    backgroundColor: "#e2e8f0",
                                    borderRadius: 6,
                                    marginBottom: 10,
                                  }}
                                  onPress={() => {
                                    setTempSelectedReasons([...selectedReasons]);
                                    setShowOfferModal(true);
                                  }}
                                >
                                  <Text style={{ textAlign: "center", color: "#333", fontWeight: "bold" }}>
                                    Select Appointment Offer/s
                                  </Text>
                                </TouchableOpacity>

                                <Modal
                                  visible={showOfferModal}
                                  transparent
                                  animationType="fade"
                                  onRequestClose={() => setShowOfferModal(false)}
                                >
                                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                                    <View
                                      style={{
                                        backgroundColor: "white",
                                        borderRadius: 12,
                                        padding: 20,
                                        width: isMobile ? "90%" : "40%",
                                        maxHeight: "80%",
                                        borderWidth: 1,
                                        borderColor: "#ccc",
                                      }}
                                    >
                                      <ScrollView>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, color: '#00505cff'}}>
                                          Select Offer/s
                                        </Text>

                                        {(Array.isArray(offerList) ? offerList : offerList ? offerList.split("?") : []).map((offer) => {
                                          const trimmedOffer = offer.trim();
                                          if (!trimmedOffer) return null;

                                          return (
                                            <TouchableOpacity
                                              key={trimmedOffer}
                                              onPress={() => toggleTempReason(trimmedOffer)}
                                              style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                                            >
                                              <View
                                                style={{
                                                  height: 20,
                                                  width: 20,
                                                  borderRadius: 4,
                                                  borderWidth: 1,
                                                  borderColor: "#888",
                                                  justifyContent: "center",
                                                  alignItems: "center",
                                                  marginRight: 10,
                                                  backgroundColor: tempSelectedReasons.includes(trimmedOffer) ? "#007bff" : "#fff",
                                                }}
                                              >
                                                {tempSelectedReasons.includes(trimmedOffer) && (
                                                  <View style={{ width: 10, height: 10, backgroundColor: "#fff" }} />
                                                )}
                                              </View>
                                              <Text style={{color: 'black'}}>{trimmedOffer}</Text>
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </ScrollView>

                                      {/* Buttons */}
                                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                                        <TouchableOpacity
                                          style={{
                                            flex: 1,
                                            backgroundColor: "#b32020",
                                            paddingVertical: 12,
                                            borderRadius: 6,
                                            marginRight: 8,
                                          }}
                                          onPress={() => {
                                            setShowOfferModal(false);
                                          }}
                                        >
                                          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                            Cancel
                                          </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={{
                                            flex: 1,
                                            backgroundColor: "#2e7dccff",
                                            paddingVertical: 12,
                                            borderRadius: 6,
                                            marginLeft: 8,
                                          }}
                                          onPress={() => {
                                            setSelectedReasons(tempSelectedReasons);
                                            setMessageToClinic(tempSelectedReasons.join(", "));
                                            setShowOfferModal(false);
                                          }}
                                        >
                                          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                            Save
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                </Modal>

                                {/* "Others" checkbox */}
                                <View style={{ width: "100%" }}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setIsOthersChecked(true);
                                      setTempMessage(tempMessage || "");
                                      setShowOthersModal(true);
                                    }}
                                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                                  >
                                    <View
                                      style={{
                                        height: 20,
                                        width: 20,
                                        borderRadius: 4,
                                        borderWidth: 1,
                                        borderColor: "#888",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginRight: 10,
                                        backgroundColor: isOthersChecked ? "#007bff" : "#fff",
                                      }}
                                    >
                                      {isOthersChecked && (
                                        <View style={{ width: 10, height: 10, backgroundColor: "#fff" }} />
                                      )}
                                    </View>
                                    <Text>Others</Text>
                                  </TouchableOpacity>

                                  {/* ✅ Combined Message Preview (selected checkboxes + others) */}
                                  {messageToClinic.trim() !== "" && (
                                    <View
                                      style={{
                                        padding: 10,
                                        backgroundColor: "#f1f1f1",
                                        borderRadius: 6,
                                        marginBottom: 10,
                                        width: "100%",
                                      }}
                                    >
                                      <Text style={{ color: "#000" }}>{messageToClinic}</Text>
                                    </View>
                                  )}

                                  {/* Modal for "Others" input */}
                                  <Modal
                                    transparent
                                    visible={showOthersModal}
                                    onRequestClose={() => setShowOthersModal(false)}
                                  >
                                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                      <View
                                        style={{
                                          width: isMobile ? "80%" : "30%",
                                          backgroundColor: "white",
                                          borderRadius: 10,
                                          padding: 20,
                                          borderWidth: 1,
                                          borderColor: "#ccc",
                                          alignItems: "center",
                                        }}
                                      >
                                        <Text style={{ fontSize: 18, marginBottom: 10 }}>
                                          Message to Clinic
                                        </Text>
                                        <TextInput
                                          value={tempMessage}
                                          onChangeText={setTempMessage}
                                          multiline
                                          style={{
                                            height: 100,
                                            width: "100%",
                                            borderColor: "#ccc",
                                            borderWidth: 1,
                                            borderRadius: 6,
                                            padding: 10,
                                            marginBottom: 20,
                                            textAlignVertical: "top",
                                          }}
                                          maxLength={350}
                                          autoFocus
                                        />

                                        <View
                                          style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            width: "100%",
                                          }}
                                        >
                                          <TouchableOpacity
                                            style={{
                                              flex: 1,
                                              marginRight: 8,
                                              backgroundColor: "#b32020",
                                              paddingVertical: 12,
                                              borderRadius: 6,
                                            }}
                                            onPress={() => {
                                              setShowOthersModal(false);
                                              setIsOthersChecked(false);
                                              setTempMessage("");

                                              // Update message with only selected reasons
                                              setMessageToClinic(selectedReasons.join(", "));
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: "white",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              Cancel
                                            </Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            style={{
                                              flex: 1,
                                              marginLeft: 8,
                                              backgroundColor: "#2e7dccff",
                                              paddingVertical: 12,
                                              borderRadius: 6,
                                            }}
                                            onPress={() => {
                                              const newMsg = tempMessage.trim();
                                              setTempMessage(newMsg);
                                              setIsOthersChecked(!!newMsg);
                                              setShowOthersModal(false);

                                              // Combine selected reasons with "others"
                                              const combined = [...selectedReasons];
                                              if (newMsg) {
                                                combined.push(newMsg);
                                              }
                                              setMessageToClinic(combined.join(", "));
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: "white",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              Save
                                            </Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </View>
                                  </Modal>
                                </View>

                                {/* Buttons */}
                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    marginTop: 20,
                                  }}
                                >
                                  <TouchableOpacity
                                    style={{
                                      flex: 1,
                                      backgroundColor: "#b32020",
                                      paddingVertical: 12,
                                      borderRadius: 8,
                                      marginRight: 8,
                                    }}
                                    onPress={() => {
                                      setMessageToClinic("");
                                      setModalAppoint(false);
                                      setIsOthersChecked(false);
                                      setTempMessage("");
                                      setSelectedReasons([]);
                                    }}
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

                                 <TouchableOpacity
                                    style={{
                                      flex: 1,
                                      backgroundColor: "#2e7dccff",
                                      paddingVertical: 12,
                                      borderRadius: 8,
                                      marginLeft: 8,
                                    }}
                                    onPress={async () => {
                                      if (!selectedClinicId) return;

                                      if (!messageToClinic || !messageToClinic.trim()) {
                                        setShowMessageModal(true);
                                        return;
                                      }

                                      const now = new Date();

                                      // ... all your validation code ...

                                      // ✅ Create the appointment (logging is done inside this function)
                                      const appointmentResult = await createAppointment(
                                        selectedClinicId, 
                                        appointmentDate, 
                                        messageToClinic, 
                                        parsedDentistList
                                      );

                                      // Check if appointment was created successfully
                                      if (!appointmentResult) {
                                        // Handle error (show error modal, etc.)
                                        return;
                                      }

                                      // ✅ Save cooldown time
                                      await AsyncStorage.setItem(COOLDOWN_KEY, now.toISOString());
                                      setLastAppointmentTime(now);

                                      // ✅ Reset UI
                                      setModalAppoint(false);
                                      setaIndicator(true);
                                      setMessageToClinic("");
                                      setIsOthersChecked(false);
                                      setTempMessage("");
                                      setSelectedReasons([]);
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "white",
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Appoint
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                  
                                  </>
                                )}



                              </ScrollView>
                            </View>
                          
                    
                        </Modal>

                        <Modal
                          visible={showDentistRequiredModal}
                          transparent
                          animationType="fade"
                          onRequestClose={() => setShowDentistRequiredModal(false)}
                        >
                          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: isMobile ? "90%" : "40%", maxWidth: 400 }}>
                              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10,  color: "#555" }}>
                                Select Dentist Required
                              </Text>
                              <Text style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
                                Please select at least one dentist before proceeding with the appointment.
                              </Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: "#2e7dccff",
                                  paddingVertical: 10,
                                  borderRadius: 6,
                                }}
                                onPress={() => setShowDentistRequiredModal(false)}
                              >
                                <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                                  OK
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Modal>


                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showDentistUnavailableModal} onBackdropPress={() => setShowDentistUnavailableModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                        
                          <View
                            style={{
                              backgroundColor: "white",
                              padding: 20,
                              borderRadius: 12,
                              width: isMobile ? "90%" : "40%",
                              maxWidth: 400,
                              borderColor: "#ccc",
                              borderWidth: 1,
                            }}
                          >
                            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#b32020" }}>
                              Dentist Not Available
                            </Text>

                            <Text style={{ marginBottom: 10,  color: "#555" }}>
                              The following dentist(s) are not available on the selected date and time:
                            </Text>

                            {unavailableDentists.map((name, idx) => (
                              <Text key={idx} style={{ color: "#444", marginLeft: 10 }}>
                                • {name}
                              </Text>
                            ))}

                            <TouchableOpacity
                              onPress={() => setShowDentistUnavailableModal(false)}
                              style={{
                                marginTop: 20,
                                backgroundColor: "#2e7dccff",
                                paddingVertical: 10,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ textAlign: "center", color: "white", fontWeight: "bold" }}>OK</Text>
                            </TouchableOpacity>
                          </View>
                
                        </Modal>



                        {/* too Close Appointment */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showCloseTimeModal} onBackdropPress={() => setShowCloseTimeModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                        
                          <View style={{
                            backgroundColor: "white",
                            padding: 20,
                            borderRadius: 10,
                            width:  isMobile ? "90%" : "40%",
                            maxWidth: 400,
                            alignItems: "center",
                          }}>
                            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" }}>
                              Appointment Too Soon
                            </Text>
                            <Text style={{ fontSize: 16, marginBottom: 20, textAlign: "center" }}>
                              Appointment must be booked at least 30 minutes before the scheduled time.
                            </Text>

                            <TouchableOpacity
                              style={{
                                backgroundColor: "#2e7dccff",
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 6,
                              }}
                              onPress={() => setShowCloseTimeModal(false)}
                            >
                              <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                                OK
                              </Text>
                            </TouchableOpacity>
                          </View>
                    
                        </Modal>

                        {/* cooldown modal */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={cooldownModalVisible} onBackdropPress={() => setCooldownModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                      
                            <View
                              style={{
                                backgroundColor: "white",
                                padding: 20,
                                borderRadius: 10,
                                alignItems: "center",
                                width:  isMobile ? "90%" : "40%",
                                borderWidth: 1,
                                borderColor: "#ccc",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 18,
                                  fontWeight: "bold",
                                  marginBottom: 10,
                                  color: "#b32020",
                                  textAlign: "center",
                                }}
                              >
                                Please wait
                              </Text>

                              <Text
                                style={{
                                  fontSize: 16,
                                  textAlign: "center",
                                  marginBottom: 20,
                                  color: "#555"
                                }}
                              >
                                You can't make another appointment right now. Please wait{" "}
                                <Text style={{ fontWeight: "bold",  color: "#555" }}>{remainingCooldownTime}</Text> seconds.
                              </Text>

                              <TouchableOpacity
                                onPress={() => setCooldownModalVisible(false)}
                                style={{
                                  backgroundColor: "#2e7dccff",
                                  paddingVertical: 10,
                                  paddingHorizontal: 20,
                                  borderRadius: 6,
                                }}
                              >
                                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
                              </TouchableOpacity>
                            </View>
                    
                        </Modal>


                        {/* Closing Time Modal */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showTooCloseModal} onBackdropPress={() => setShowTooCloseModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                            <View
                              style={{
                                backgroundColor: "white",
                                padding: 20,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                width: isMobile ? "90%" : "40%",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#b32020" }}>
                                Appointment too close to closing time!
                              </Text>
                              <Text style={{ textAlign: "center", fontSize: 16 }}>
                                Please choose a time at least 30 minutes before the clinic closes.
                              </Text>
                              <TouchableOpacity
                                onPress={() => setShowTooCloseModal(false)}
                                style={{
                                  marginTop: 20,
                                  backgroundColor: "#2e7dcc",
                                  paddingVertical: 10,
                                  paddingHorizontal: 20,
                                  borderRadius: 6,
                                }}
                              >
                                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
                              </TouchableOpacity>
                            </View>
                    
                        </Modal>

                        {/* Message Required Modal */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showMessageModal} onBackdropPress={() => setShowMessageModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                    
                            <View
                              style={{
                                backgroundColor: "white",
                                padding: 24,
                                borderRadius: 12,
                                width: isMobile ? "90%" : "40%",
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: "#ccc"
                              }}
                            >
                              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Message Required</Text>
                              <Text style={{ textAlign: "center", marginBottom: 20,  color: "#555" }}>
                                Please write a message to the clinic before creating the appointment.
                              </Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: "#2e7dccff",
                                  paddingVertical: 10,
                                  paddingHorizontal: 20,
                                  borderRadius: 8,
                                }}
                                onPress={() => setShowMessageModal(false)}
                              >
                                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
                              </TouchableOpacity>
                            </View>
                    
                        </Modal>

                        {/* Invalid Time Modal */}
                        <Modal
                          transparent
                          animationType="fade"
                          visible={showInvalidTimeModal}
                          onRequestClose={() => setShowInvalidTimeModal(false)}
                        >
                          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <View
                              style={{
                                backgroundColor: "white",
                                padding: 24,
                                borderRadius: 12,
                                width: isMobile ? "90%" : "40%",
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: "#ccc"
                                
                              }}
                            >
                              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10,  color: "#555" }}>Invalid Appointment Time</Text>
                              <Text style={{ textAlign: "center", marginBottom: 20,  color: "#555" }}>
                                You cannot create an appointment in the past. Please select a future date and time.
                              </Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: "#2e7dccff",
                                  paddingVertical: 10,
                                  paddingHorizontal: 20,
                                  borderRadius: 8,
                                }}
                                onPress={() => setShowInvalidTimeModal(false)}
                              >
                                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Modal>

                        {/* Out of Schedule Modal */}
                      <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showOutOfScheduleModal} onBackdropPress={() => setShowOutOfScheduleModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                          <View
                            style={{
                              backgroundColor: "white",
                              padding: 24,
                              borderRadius: 12,
                              width: isMobile ? "90%" : "40%",
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: "#ccc"
                            }}
                          >
                            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#555" }}>Outside Clinic Schedule</Text>
                            <Text style={{ textAlign: "center", marginBottom: 20,  color: "#555" }}>
                              The clinic is closed at the selected time. Please choose a time within the clinic's working hours. You can view the Clinic's Schedule.
                            </Text>
                            <TouchableOpacity
                              style={{
                                backgroundColor: "#2e7dccff",
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 8,
                              }}
                              onPress={() => setShowOutOfScheduleModal(false)}
                            >
                              <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
                            </TouchableOpacity>
                          </View>
                    
                        </Modal>

                        {/* Success Indicator */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={aIndicator} onBackdropPress={() => setaIndicator(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                          <View
                            style={{
                              width: isMobile ? "90%" : "40%",
                              backgroundColor: "white",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#ccc",
                              padding: 20,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                marginBottom: 20,
                                textAlign: "center",
                                  color: "#555"
                              }}
                            >
                              Appointment Request Successful
                            </Text>
                            <TouchableOpacity
                              style={{
                                backgroundColor: "#007bff",
                                paddingVertical: 10,
                                paddingHorizontal: 30,
                                borderRadius: 8,
                              }}
                              onPress={() => setaIndicator(false)}
                            >
                              <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
                                OK
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </Modal>

                        {/* Map Button */}
                        <TouchableOpacity
                          onPress={() => {
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

                        {/* Map Modal */}
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalMap} onBackdropPress={() => setModalMap(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
                      
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                              padding: 20,
                            }}
                          >
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
                          </View>
                        </Modal>

                      </View>
                    </LinearGradient>
                  ))}
                </View>

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
        )}

        {/* Dashboard Appointments --------------------------------------------------------------------------------------- */}

        {dashboardView === "appointments" && (
          <View
            style={[
              styles.dashboard,
              {
                width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
                right: dashboardView === "appointments" ? 11 : 20000,
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
              Appointments
            </Text>
        

            {isMobile ? (
              // Mobile card layout
              <ScrollView contentContainerStyle={{ paddingHorizontal: 12 }}>
                {appointmentsCurrentList.length === 0 ? (
                  <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                    <Text style={{ fontSize: 20, color: "gray" }}>- No Appointments -</Text>
                  </View>
                ) : (
                  appointmentsCurrentList.map((item) => (
                    <View
                      key={item.id}
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
                      
                      <Text style={{ fontWeight: "700", marginBottom: 6, color: "#555"}}>Clinic Name:</Text>
                      <Text style={{ marginBottom: 10, color: 'black' }}>{item.clinic_profiles.clinic_name}</Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6,  color: "#555" }}>Message:</Text>
                      <Text style={{ marginBottom: 10,  color: "#555" }}>
                        {item.message.length > 20 ? (
                          <>
                            {item.message.slice(0, 20) + "... "}
                            <Text
                              onPress={() => {
                                setSelectedMessage(item.message);
                                setModalMessage(true);
                              }}
                              style={{ color: "blue", textDecorationLine: "underline" }}
                            >
                              See More
                            </Text>
                          </>
                        ) : (
                          item.message
                        )}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6,  color: "#555" }}>Request:</Text>
                      <TouchableOpacity onPress={() => openRequestView(item.request)} style={{ marginBottom: 10 }}>
                        <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>View Request</Text>
                      </TouchableOpacity>

                      <Text style={{ fontWeight: "700", marginBottom: 6,  color: "#555" }}>Request Date & Time:</Text>
                      <Text style={{ marginBottom: 10, color: 'black' }}>
                        {new Date(item.date_time).toLocaleString(undefined, {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6,  color: "#555" }}>Created At:</Text>
                      <Text style={{color: 'black', marginBottom: 20}}>{new Date(item.created_at || 0).toLocaleString()}</Text>
                        {/* <Text style={{color: 'black'}}>{item.clinic_profiles.email}</Text>
              <Text style={{color: 'black'}}>{item.profiles.email}</Text>
              <Text style={{color: 'black'}}>{item.id}</Text> */}

                      <CancelAppointmentUser data={item} sender_email={item.profiles.email} receiver_email={item.clinic_profiles.email}/>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : (
              // Desktop/table layout
           <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, minWidth: 900 }}>
              <FlatList
                data={appointmentsCurrentList}
                keyExtractor={(e) => e.id.toString()}
                contentContainerStyle={{
                  alignItems: "stretch",
                  paddingHorizontal: 12,
                }}
                ListHeaderComponent={() => (
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
                    <Text style={{ width: 180, fontWeight: "700", color: "white" }}>Clinic Name</Text>
                    <Text style={{ width: 180, fontWeight: "700", color: "white" }}>Message</Text>
                    <Text style={{ width: 150, fontWeight: "700", color: "white" }}>Request</Text>
                    <Text style={{ width: 200, fontWeight: "700", color: "white" }}>Request Date & Time</Text>
                    <Text style={{ width: 200, fontWeight: "700", color: "white" }}>Created At</Text>
                    <Text style={{ width: 180, fontWeight: "700", color: "white" }}></Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <View
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
                    <Text style={{ width: 180 }}>{item.clinic_profiles.clinic_name}</Text>

                    <Text style={{ width: 180 }}>
                      {item.message.length > 20 ? (
                        <>
                          {item.message.slice(0, 20) + "... "}
                          <Text
                            onPress={() => {
                              setSelectedMessage(item.message);
                              setModalMessage(true);
                            }}
                            style={{ color: "#0056b3", textDecorationLine: "underline" }}
                          >
                            See More
                          </Text>
                        </>
                      ) : (
                        item.message
                      )}
                    </Text>

                    <TouchableOpacity style={{ width: 150 }} onPress={() => openRequestView(item.request)}>
                      <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>View Request</Text>
                    </TouchableOpacity>

                    <Text style={{ width: 200 }}>
                      {new Date(item.date_time).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>

                    <Text style={{ width: 200 }}>{new Date(item.created_at || 0).toLocaleString()}</Text>

                    <View style={{ width: 180 }}>
                      <CancelAppointmentUser
                        data={item}
                        sender_email={item.profiles.email}
                        receiver_email={item.clinic_profiles.email}
                      />
                    </View>
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                    <Text style={{ fontSize: 20, color: "gray" }}>- No Appointments -</Text>
                  </View>
                )}
              />
            </View>
          </ScrollView>

            )}
          </View>
        )}


        {/* Dashboard Pending --------------------------------------------------------------------------------------- */}

        {dashboardView === "pending" && (
          <View
            style={[
              styles.dashboard,
              {
                width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
                right: dashboardView === "pending" ? 11 : 20000,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 20,
                alignSelf: isMobile ? "center" : "flex-start",
                color: "#003f30ff",
              }}
            >
              Requests
            </Text>

            {isMobile ? (
              // Mobile card layout
              <ScrollView contentContainerStyle={{ paddingHorizontal: 12 }}>
                {appointmentsList.length === 0 ? (
                  <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                    <Text style={{ fontSize: 20, color: "gray" }}>- No Pending -</Text>
                  </View>
                ) : (
                  appointmentsList.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: "#fffce9ff",
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: "#ddd",
                      }}
                    >
                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Clinic Name:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {wrapText(item.clinic_profiles.clinic_name, 40)}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Patient:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {wrapText(`${item.profiles.first_name} ${item.profiles.last_name}`, 40)}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Request Date & Time:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {new Date(item.date_time).toLocaleString(undefined, {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Message:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {item.message.length > 20 ? (
                          <>
                            {item.message.slice(0, 20) + "... "}
                            <Text
                              onPress={() => {
                                setSelectedMessage(item.message);
                                setModalMessage(true);
                              }}
                              style={{ color: "#0056b3", textDecorationLine: "underline" }}
                            >
                              See More
                            </Text>
                          </>
                        ) : (
                          item.message
                        )}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Request:</Text>
                      <TouchableOpacity
                        onPress={() => openRequestView(item.request)}
                        style={{ marginBottom: 10 }}
                      >
                        <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>
                          View Request
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Created At:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {new Date(item.created_at || 0).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : (
              // Desktop/table layout
              <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, minWidth: 900 }}>
                  <FlatList
                    data={appointmentsList}
                    keyExtractor={(e) => e.id.toString()}
                    contentContainerStyle={{
                      alignItems: "stretch",
                      paddingHorizontal: 12,
                    }}
                    ListHeaderComponent={() => (
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: "#ffe680",
                          paddingVertical: 16,
                          paddingHorizontal: 20,
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                          minWidth: "100%",
                        }}
                      >
                        <Text style={{ flex: 1, fontWeight: "700" }}>Clinic Name</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Patient</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Request Date & Time</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Message</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Request</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Created At</Text>
                      </View>
                    )}
                    renderItem={({ item, index }) => (
                      <View
                        style={{
                          flexDirection: "row",
                          borderBottomWidth: 1,
                          borderColor: "#ccc",
                          paddingVertical: 20,
                          paddingHorizontal: 20,
                          backgroundColor: index % 2 === 0 ? "#fffce9ff" : "#fff",
                        }}
                      >
                        <Text style={{ flex: 1 }}>{wrapText(item.clinic_profiles.clinic_name, 40)}</Text>
                        <Text style={{ flex: 1 }}>
                          {wrapText(`${item.profiles.first_name} ${item.profiles.last_name}`, 40)}
                        </Text>
                        <Text style={{ flex: 1 }}>
                          {new Date(item.date_time).toLocaleString(undefined, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Text>
                        <Text style={{ flex: 1 }}>
                          {item.message.length > 20 ? (
                            <>
                              {item.message.slice(0, 20) + "... "}
                              <Text
                                onPress={() => {
                                  setSelectedMessage(item.message);
                                  setModalMessage(true);
                                }}
                                style={{ color: "#0056b3", textDecorationLine: "underline" }}
                              >
                                See More
                              </Text>
                            </>
                          ) : (
                            item.message
                          )}
                        </Text>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => openRequestView(item.request)}
                        >
                          <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>
                            View Request
                          </Text>
                        </TouchableOpacity>
                        <Text style={{ flex: 1 }}>
                          {new Date(item.created_at || 0).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={() => (
                      <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                        <Text style={{ fontSize: 20, color: "gray" }}>- No Pending -</Text>
                      </View>
                    )}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        )}


        {/* Dashboard history --------------------------------------------------------------------------------------- */}

        {dashboardView === "history" && (
          <View
            style={[
              styles.dashboard,
              {
                width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
                right: dashboardView === "history" ? 11 : 20000,
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
              History
            </Text>

            <TouchableOpacity
              onPress={() => setDownloadModal(true)}
              style={{
                backgroundColor: "#00505cff",
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Download History Excel
              </Text>
            </TouchableOpacity>

            {/* Download Confirmation Modal */}
           <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={downloadModal} onBackdropPress={() => setDownloadModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  padding: 24,
                  width: "100%",
                  maxWidth: 400,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
                  Confirm Download
                </Text>
                <Text style={{ fontSize: 16, marginBottom: 24, textAlign: "center" }}>
                  Are you sure you want to download the history?
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setDownloadModal(false)}
                    style={{
                      backgroundColor: "#ccc",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      flex: 1,
                      marginRight: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setDownloadModal(false);
                      handleDownloadExcel(appointmentsPast ?? []);
                    }}
                    style={{
                      backgroundColor: "#007AFF",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      flex: 1,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 16 }}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {isMobile ? (
              // 📱 Mobile: card-style vertical list
              <ScrollView contentContainerStyle={{ paddingHorizontal: 12 }}>
                {appointmentsPast.length === 0 ? (
                  <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                    <Text style={{ fontSize: 20, color: "gray" }}>- No History -</Text>
                  </View>
                ) : (
                  appointmentsPast.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: item.isAccepted ? "#e4ffe0" : "#ffe0e0",
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: "#ddd",
                      }}
                    >
                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Clinic Name:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {wrapText(item.clinic_profiles.clinic_name, 40)}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Patient:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {wrapText(item.profiles.last_name, 40)}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                        Request Date & Time:
                      </Text>
                      <Text style={{ marginBottom: 10 }}>
                        {new Date(item.date_time).toLocaleString(undefined, {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Message:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {item.message.length > 20 ? (
                          <>
                            {item.message.slice(0, 20) + "... "}
                            <Text
                              onPress={() => {
                                setSelectedMessage(item.message);
                                setModalMessage(true);
                              }}
                              style={{ color: "#0056b3", textDecorationLine: "underline" }}
                            >
                              See More
                            </Text>
                          </>
                        ) : (
                          item.message
                        )}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Request:</Text>
                      <TouchableOpacity
                        onPress={() => openRequestView(item.request)}
                        style={{ marginBottom: 10 }}
                      >
                        <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>
                          View Request
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Status:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {item.isAccepted ? "Accepted" : "Rejected"}
                      </Text>

                      {item.outcome && 
                        <>
                          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Outcome:</Text>
                          <Text style={{ marginBottom: 10, color: 'green'}}>
                            {item.outcome}
                          </Text>
                        
                        </>
                      }
                      
                      {item.rejection_note && 
                        <>
                          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Rejection Note:</Text>
                          <Text style={{ marginBottom: 10 }}>
                            {item.isAccepted === false
                              ? item.rejection_note || "No rejection note"
                              : "-"}
                          </Text>
                        
                        </>
                      }

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Created At:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {new Date(item.created_at || 0).toLocaleString()}
                      </Text>

                      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Attendance:</Text>
                      <Text style={{ marginBottom: 10 }}>
                        {item.isAttended === true
                          ? "Attended"
                          : item.isAttended === false
                          ? "Not Attended"
                          : "Not Attended"}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : (
              // 🖥 Desktop: table view
              <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, minWidth: 1000 }}>
                  <FlatList
                    data={appointmentsPast}
                    keyExtractor={(e) => e.id}
                    contentContainerStyle={{
                      alignItems: "stretch",
                      paddingHorizontal: 12,
                    }}
                    ListHeaderComponent={() => (
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: "#ffffffff",
                          paddingVertical: 16,
                          paddingHorizontal: 20,
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                          minWidth: "100%",
                          gap: 16,
                        }}
                      >
                        <Text style={{ flex: 1, fontWeight: "700" }}>Clinic Name</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Patient</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Request Date & Time</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Message</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Request</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Status</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Rejection Note</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Created At</Text>
                        <Text style={{ flex: 1, fontWeight: "700" }}>Outcome</Text>
                        <Text style={{ flex: 1, fontWeight: "700", textAlign: "center" }}>
                          Attendance
                        </Text>
                      </View>
                    )}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          flexDirection: "row",
                          borderBottomWidth: 1,
                          borderColor: "#ccc",
                          paddingVertical: 18,
                          paddingHorizontal: 20,
                          backgroundColor: item.isAccepted ? "#e4ffe0ff" : "#ffe0e0ff",
                          gap: 16,
                          alignItems: "center",
                          minWidth: "100%",
                        }}
                      >
                        {/* Clinic Name */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {wrapText(item.clinic_profiles.clinic_name, 40)}
                        </Text>

                        {/* Patient */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {wrapText(item.profiles.last_name, 40)}
                        </Text>

                        {/* Request Date & Time */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {new Date(item.date_time).toLocaleString(undefined, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Text>

                        {/* Message */}
                        {item.message.length > 20 ? (
                          <Text style={{ flex: 1, color: "#000" }}>
                            {item.message.slice(0, 20) + "... "}
                            <Text
                              onPress={() => {
                                setSelectedMessage(item.message);
                                setModalMessage(true);
                              }}
                              style={{ color: "#0056b3", textDecorationLine: "underline" }}
                            >
                              See More
                            </Text>
                          </Text>
                        ) : (
                          <Text style={{ flex: 1, color: "#333" }}>{item.message}</Text>
                        )}

                        {/* Request */}
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => openRequestView(item.request)}
                        >
                          <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>
                            View Request
                          </Text>
                        </TouchableOpacity>

                        {/* Status */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {item.isAccepted ? "Accepted" : "Rejected"}
                        </Text>

                        {/* Rejection Note */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {item.isAccepted === false
                            ? wrapText(item.rejection_note || "No rejection note", 40)
                            : "-"}
                        </Text>

                        {/* Created At */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {new Date(item.created_at || 0).toLocaleString()}
                        </Text>

                         {/* Outcome */}
                        <Text style={{ flex: 1, color: "#333" }}>
                          {item.outcome}
                        </Text>

                        {/* Attendance */}
                        <Text style={{ flex: 1, color: "#333", textAlign: "center" }}>
                          {item.isAttended === true
                            ? "Attended"
                            : item.isAttended === false
                            ? "Not Attended"
                            : "Not Attended"}
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={
                      <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                        <Text style={{ fontSize: 20, color: "gray" }}>- No History -</Text>
                      </View>
                    }
                  />
                </View>
              </ScrollView>
            )}
          </View>
        )}

          {/* Request View Modal */}
          <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={requestViewVisible} onBackdropPress={() => setRequestViewVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>      
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#f1f5f9",
                width: "80%",
                maxWidth: 500,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 12, color: "#00505cff" }}>
                Requested Dentists/Staff
              </Text>

              <ScrollView style={{ marginBottom: 20 }}>
                {!selectedRequest || selectedRequest.length === 0 || selectedRequest === "" ? (
                  <Text style={{ fontSize: 16, textAlign: "center", color: "#888" }}>
                    No dentists/staff were requested.
                  </Text>
                ) : (
                  selectedRequest.map((line, i) => (
                    <Text key={i} style={{ fontSize: 16, textAlign: "left" }}>
                      {line}
                      {"\n"}
                    </Text>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#00505cff",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 5,
                }}
                onPress={() => setRequestViewVisible(false)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
              </TouchableOpacity>
            </View>        
          </Modal>

        {/* Dashboard Chats --------------------------------------------------------------------------------------- */}

        {dashboardView === "chats" && (
        <View
          style={[
            styles.dashboard,
            {
              width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
              right: dashboardView === "chats" ? 11 : 20000,
            },
          ]}
        >
            <ChatView key={`chat-${Date.now()}`} role="patient" />
        </View>
        )}

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
    </View>


{/* Support/Feedback Section - ADD THIS BEFORE MEET THE TEAM */}
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
      marginBottom: 10,
      textAlign: "center",
      color: "#00505cff",
    }}
  >
    We Value Your Feedback
  </Text>

  <Text
    style={{
      fontSize: 16,
      color: "#555",
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 24,
    }}
  >
    Have a suggestion, found a bug, or experiencing an issue? We'd love to hear from you! Your feedback helps us improve Smile Studio.
  </Text>

  <TouchableOpacity
    onPress={() => setSupportModalVisible(true)}
    style={{
      backgroundColor: "#00bcd4",
      paddingVertical: 14,
      paddingHorizontal: 30,
      borderRadius: 12,
      alignSelf: "center",
      shadowColor: "#00bcd4",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <FontAwesome5 name="hand-holding-heart" size={18} color="white" style={{ marginRight: 8 }} />
      <Text
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        Send Feedback
      </Text>
    </View>
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 13,
      color: "#777",
      textAlign: "center",
      marginTop: 15,
      fontStyle: "italic",
    }}
  >
    Or contact us directly at: (+63) 921-888-1835
  </Text>
</View>

{/* Support Modal - ADD THIS IN YOUR MODALS SECTION (with other modals) */}
 <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={supportModalVisible} onBackdropPress={() => setSupportModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>      

    <View
      style={{
        backgroundColor: "white",
        width: isMobile ? "95%" : "40%",
        padding: 20,
        borderWidth: 2,
        borderColor: '#00bcd4',
        borderRadius: 16,
        maxHeight: "90%",
      }}
    >
      <TouchableOpacity
        onPress={() => setSupportModalVisible(false)}
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          backgroundColor: "#00505cff",
          width: 30,
          height: 30,
          borderRadius: 15,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>×</Text>
      </TouchableOpacity>

      <Text 
        style={{ 
          fontSize: 20, 
          fontWeight: "bold", 
          color: "#00505cff", 
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        Send Us Your Feedback
      </Text>

      <Text 
        style={{ 
          fontSize: 14, 
          color: "#555", 
          marginBottom: 15,
          lineHeight: 20,
        }}
      >
        Tell us about bugs, suggestions, or any issues you've encountered. Your input helps us make Smile Studio better.
      </Text>

      <TextInput
        placeholder="Type your message here..."
        placeholderTextColor={'#bbb'}
        value={supportInput}
        onChangeText={setSupportInput}
        maxLength={500}
        multiline
        style={{
          borderColor: "#00bcd4",
          borderWidth: 1.5,
          borderRadius: 8,
          padding: 12,
          height: 130,
          textAlignVertical: "top",
          marginBottom: 8,
          fontSize: 14,
          color: "#333",
        }}
      />

      <Text 
        style={{ 
          fontSize: 12, 
          color: "#888", 
          marginBottom: 15,
          textAlign: "right",
        }}
      >
        {supportInput.length}/500 characters
      </Text>

      <TouchableOpacity
        onPress={submitSupportMessage}
        disabled={!supportInput.trim()}
        style={{
          backgroundColor: supportInput.trim() ? "#00bcd4" : "#ccc",
          paddingVertical: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <Text 
          style={{ 
            color: "white", 
            textAlign: "center", 
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          Submit Feedback
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setSupportModalVisible(false);
          setSupportInput('');
        }}
        style={{
          paddingVertical: 10,
        }}
      >
        <Text 
          style={{ 
            textAlign: "center", 
            color: "#00505cff", 
            fontWeight: "600",
            fontSize: 15,
          }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
</Modal>





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

        {/* Dashboard Augmented Reality --------------------------------------------------------------------------------------- */}

        {dashboardView === "ar" && (
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
            Virtual Braces
          </Text>
          <View style={{backgroundColor: 'gray', flex: 1}}>
            <CameraScreenFilter />
            {/* <Banuba /> */}
          </View>
          {Platform.OS !== "android" && Platform.OS !== "ios" && (
            <View style={{ paddingVertical: "20%" }}>
              <Text
                style={{
                  fontSize: 24,
                  justifyContent: "center",
                  alignSelf: "center",
                  color: "#484848ff",
                }}
              >
                Augmented Reality in Web is not supported by the system :C
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  justifyContent: "center",
                  alignSelf: "center",
                  color: "#484848ff",
                }}
              >
                Download our app!
              </Text>
            </View>
          )}
        </View>
        )}

      </LinearGradient>
    </LinearGradient>
  );
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
    justifyContent: "flex-start",
    alignItems: "center",
    width: 4000,
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
    overflow: "hidden",
  },
  dashboard: {
    position: "absolute",
    right: 11,
    height: "90%",
    marginTop: 40,
    padding: 14,
    shadowColor: "#00000045",
    shadowRadius: 2,
    shadowOffset: { width: 4, height: 4 },
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignContent: "center",
  },
  mar2: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 0,
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  
  buttonText: {
    color: "#000000ff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonTextUpdate: {
    color: "#000000ff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  contentsmenu: {
    shadowColor: "#00000045",
    shadowRadius: 2,
    shadowOffset: { width: 2, height: 2 },
    borderRadius: 3,
    borderColor: "rgba(0, 0, 0, 1)",
    width: "100%",
    padding: 5,
    textAlign: "center",
    marginBottom: 15,
    backgroundColor: "rgba(163, 255, 202, 1)",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 50,
    resizeMode: "contain",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "nowrap",
    width: "100%",
    paddingHorizontal: 8,
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    height: 240,
    backgroundColor: "#ffffffff",
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
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b3e5fc",
    marginHorizontal: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
  },
  proinfo: {
    flexDirection: "column", // stack children vertically
    justifyContent: "flex-start", // align from top to bottom
    alignItems: "center", // center horizontally
    marginBottom: 20,
    flexWrap: "nowrap",
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 5, // add some vertical padding
    minHeight: 150, // ensure space for multiple items
  },
  redButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText1: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "20%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  containerCL: {
    padding: 10,
  },
  cardCL: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageCL: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  nameCL: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 3,
  },
  textCL: {
    fontSize: 13,
    color: "#555",
  },
  loadingContainerCL: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  avatarText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
});