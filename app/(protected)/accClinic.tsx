import CancelAppointment from "@/components/CancelAppointment";
import RescheduleAppointment from "@/components/RescheduleAppointment";
import { activityLogger } from "@/hooks/useActivityLogs";
import { useSession } from "@/lib/SessionContext";
import { MaterialIcons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Modal from 'react-native-modal';
import * as XLSX from 'xlsx';
import { supabase } from "../../lib/supabase";
import ChatView from "../view/ChatView";
import DentistScheduleEditor from '../view/DentistScheduleEditor';
import MapPickerView from "../view/MapPickerView";
import WeekScheduleEditor from "../view/WeekScheduleEditor";


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
  isAccepted: boolean | null;
  rejection_note: string;
  request: string;
};

type Dentist = {
  id: string;
  name: string;
  weeklySchedule?: {
    [day: string]: string[];
  };
};

export default function Account() {
  const { session, isLoading, signOut } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [clinicName, setClinicName] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [adress, setAdress] = useState("");
  const [clinicPho, setClinicPho] = useState("");
  const [licensePho, setLicensePho] = useState("");
  const [clinicId, setClinicId] = useState<string>();

  const [viewFirst, setviewFirst] = useState(true);
  const [viewFirstShow, setviewFirstShow] = useState(true);
  const [viewClinic, setviewClinic] = useState(false);

  const [termsOfUse, setTermsOfUse] = useState(false);
  const [selectedCI, setSelectedCI] = useState("");
  const [selectedOffers, setSelectedOffers] = useState("");
  const [appointmentsToday, setAppointmentsToday] = useState<Appointment[]>([]);

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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSignout, setModalSignout] = useState(false);
  const [modalUpdate, setModalUpdate] = useState(false);
  const [modalMap, setModalMap] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);

  const [profileInfoVisible, setProfileInfoVisible] = useState(false);

  // State for profileInfo modal
  const [dentistAvailability, setDentistAvailability] = useState(false);
  const [clinicIntroduction, setClinicIntroduction] = useState("");
  const [offers, setOffers] = useState("");

  const [dashboardView, setDashboardView] = useState("profile");
  // State for the verification photo
 // State for the verification photo
  const [verifyPhoto, setVerifyPhoto] = useState<string | { uri: string; file: File } | null>(null);
  // New state for submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to track if uploaded file is PDF
  const [isVerifyPhotoPDF, setIsVerifyPhotoPDF] = useState(false);

  const [clinicList, setClinicList] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>();
  const [messageToClinic, setMessageToClinic] = useState<string>();
  const [modalMessage, setModalMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [denialReason, setDenialReason] = useState<string>();

  const [appointmentsList, setAppointmentList] = useState<Appointment[]>();
  const [appointmentsCurrentList, setAppointmentCurrentList] =
    useState<Appointment[]>();
  const [appointmentsPast, setAppointmentPast] = useState<Appointment[]>();

  const [mapView, setMapView] = useState<[number | undefined, number| undefined]>([undefined,undefined]);

  const [showMapPickerModal, setShowMapPicketModal] = useState(false);

  const [rejectAppointmentId, setRejectAppointmentID] = useState<string>();
  const [rejectMsg, setRejectMsg] = useState<string>();

  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [requestVerification, setRequestVerification] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [tMap, setTMap] = useState(false);
  const [warn, setWarn] = useState(false);
  const [ban, setBan] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string>();
  const [offerList, setOfferList] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [isAttended, setIsAttended] = useState(false);
  const [emptyOfferWarningVisible, setEmptyOfferWarningVisible] = useState(false);
  const [needDTIModal, setNeedDTIModal] = useState(false);
  const [newOfferText, setNewOfferText] = useState('');
  const [limitReachedModalVisible, setLimitReachedModalVisible] = useState(false);
  const [offerToRemoveIndex, setOfferToRemoveIndex] = useState<number | null>(null);
  const [removeConfirmModalVisible, setRemoveConfirmModalVisible] = useState(false);
  const [resetConfirmModalVisible, setResetConfirmModalVisible] = useState(false);
const [dentists, setDentists] = useState<string>(''); // for the stored dentists string from DB
const [dentistList, setDentistList] = useState<Dentist[]>([]);
const [newDentistName, setNewDentistName] = useState('');
const [newSpecialization, setNewSpecialization] = useState('');
const [dentistToRemoveIndex, setDentistToRemoveIndex] = useState<number | null>(null);

// Add these state variables at the top with your other states
const [selectedPatient, setSelectedPatient] = useState(null);
const [patientHistoryModal, setPatientHistoryModal] = useState(false);
const [patientAppointmentHistory, setPatientAppointmentHistory] = useState([]);

const [rejectError, setRejectError] = useState(false);

// Modal visibility states
const [limitReachedDentistModalVisible, setLimitReachedDentistModalVisible] = useState(false);
const [removeDentistConfirmModalVisible, setRemoveDentistConfirmModalVisible] = useState(false);
const [resetDentistConfirmModalVisible, setResetDentistConfirmModalVisible] = useState(false);
const [emptyDentistWarningModalVisible, setEmptyDentistWarningModalVisible] = useState(false);
const [duplicateDentistModalVisible, setDuplicateDentistModalVisible] = useState(false);

const [scheduleEditorVisible, setScheduleEditorVisible] = useState(false);
const [editingDentistIndex, setEditingDentistIndex] = useState<number | null>(null);
const [editingSchedule, setEditingSchedule] = useState<any>(null);
const defaultWeeklySchedule = {
  // depends on your actual schedule structure
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};


// Add this state variable with your other states (around line 50-60)
const [appointmentRequestCount, setAppointmentRequestCount] = useState(0);

// Add this useEffect to fetch and listen for appointment requests
useEffect(() => {
  if (!session?.user?.id) return;

  const fetchRequestCount = async () => {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', session.user.id)
        .is('isAccepted', null)
        .or('rejection_note.is.null,rejection_note.eq.\'\'');
      
      if (error) throw error;
      setAppointmentRequestCount(count ?? 0);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  // Initial fetch
  fetchRequestCount();

  // Set up real-time subscription
  const channel = supabase
    .channel('appointment-requests-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `clinic_id=eq.${session.user.id}`,
      },
      (payload) => {
        console.log('Appointment change detected:', payload);
        // Refetch count whenever any appointment changes
        fetchRequestCount();
      }
    )
    .subscribe();

  // Also refresh count when dashboard view changes to 'pending'
  if (dashboardView === 'pending') {
    fetchRequestCount();
  }

  return () => {
    supabase.removeChannel(channel);
  };
}, [session?.user?.id, dashboardView]);
  // State to open schedule editor immediately after add:
  const [openScheduleForIndex, setOpenScheduleForIndex] = useState<number | null>(null);
  const [requestViewVisible, setRequestViewVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState([]);

    const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);
const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
const [outcomeMessage, setOutcomeMessage] = useState("");

  const openRequestView = (requestStr : any) => {
    try {
      const parsed = JSON.parse(requestStr);
      setSelectedRequest(parsed);
    } catch {
      setSelectedRequest([requestStr]); // fallback to raw string if JSON parsing fails
    }
    setRequestViewVisible(true);
  };



 const [supportModalVisible, setSupportModalVisible] = useState(false);
const [supportInput, setSupportInput] = useState('');
const [supportMessages, setSupportMessages] = useState([]);

// STEP 2: Add the useEffect hook for fetching and real-time support messages
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
    // Use clinicName instead of firstname/lastname since this is a clinic account
    const userName = clinicName || username || session.user.email || 'Anonymous User';

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

function openScheduleEditor(dentist, index) {
  setEditingDentistIndex(index);
  // If dentist.weeklySchedule exists, use it; else initialize empty schedule
  setEditingSchedule(dentist.weeklySchedule || {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  setScheduleEditorVisible(true);
}

function closeScheduleEditor() {
  setScheduleEditorVisible(false);
  setEditingDentistIndex(null);
  setEditingSchedule(null);
}

function saveSchedule() {
  if (editingDentistIndex === null) return;

  // Update the schedule of the selected dentist
  const updatedList = [...dentistList];
  updatedList[editingDentistIndex] = {
    ...updatedList[editingDentistIndex],
    weeklySchedule: editingSchedule,
  };
  saveDentists(updatedList);
  closeScheduleEditor();
}

  // Load dentists from DB on mount or session change
  useEffect(() => {
    async function fetchDentists() {
      if (!session?.user) return;
      try {
        const { data, error } = await supabase
          .from('clinic_profiles')
          .select('dentists')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data?.dentists) {
          const parsed = JSON.parse(data.dentists);
          setDentists(data.dentists);
          const fixedDentists = parsed.map((d: any) => ({
            ...d,
            weeklySchedule: d.weeklySchedule || {
              Monday: [],
              Tuesday: [],
              Wednesday: [],
              Thursday: [],
              Friday: [],
              Saturday: [],
              Sunday: [],
            },
          }));
          setDentistList(fixedDentists);
        }else {
          setDentists('');
          setDentistList([]);
        }
      } catch (err) {
        console.error('Failed to fetch dentists:', err.message);
      }
    }
    fetchDentists();
  }, [session, supabase]);

  // Save dentists to DB helper
async function saveDentists(updatedList) {
  try {
    if (!session?.user) throw new Error('User not authenticated');

    const combined = JSON.stringify(updatedList);

    // Save JSON string to DB
    const { error } = await supabase
      .from('clinic_profiles')
      .update({ dentists: combined })
      .eq('id', session.user.id);

    if (error) throw error;

    // Update local state with parsed list (not JSON string)
    setDentistList(updatedList);
    setDentists(updatedList); // or just one of these, depending on your state management

    Alert.alert('Success', 'Dentists saved successfully.');
  } catch (err) {
    console.error('Failed to save dentists:', err.message);
    Alert.alert('Error', err.message || 'Could not save dentists.');
  }
}



  // Remove dentist handler (confirmed)
  const confirmRemoveDentist = () => {
    if (dentistToRemoveIndex === null) return;
    const updatedList = dentistList.filter((_, i) => i !== dentistToRemoveIndex);
    saveDentists(updatedList);
    setDentistToRemoveIndex(null);
    setRemoveDentistConfirmModalVisible(false);
  };

  // Reset dentists handler (confirmed)
  const confirmResetDentists = () => {
    saveDentists([]);
    setResetDentistConfirmModalVisible(false);
  };

  
const addDentist = () => {
  if (!newDentistName.trim()) {
    alert("Please enter dentist name");
    return;
  }
  const newDentist = {
    name: newDentistName.trim(),
    specialty: newSpecialization.trim() || "General Dentist",
    weeklySchedule: defaultWeeklySchedule,
  };

  setDentistList((prev) => {
    const updatedList = [...prev, newDentist];
    setOpenScheduleForIndex(updatedList.length - 1);  // open scheduler for the new dentist index
    return updatedList;
  });

  setNewDentistName("");
  setNewSpecialization("");
};

console.log("Account render: openScheduleForIndex =", openScheduleForIndex, "dentistList length =", dentistList.length);




useEffect(() => {
  async function fetchOffers() {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('clinic_profiles')
        .select('offers')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      const offersString = data?.offers || '';
      setOffers(offersString);
      // Parse offers string into array for easier manipulation
      const offerArray = offersString
        ? offersString.split('?').filter(o => o.trim() !== '')
        : [];
      setOfferList(offerArray);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    }
  }
  
  fetchOffers();
}, [session]);

const handleResetOffers = async () => {
  try {
    if (!session?.user) throw new Error("User not authenticated");

    // Clear offers locally
    setOfferList([]);
    setOffers("");
    setResetConfirmModalVisible(false);

    // Update database
    const { error } = await supabase
      .from("clinic_profiles")
      .update({ offers: "" })
      .eq("id", session.user.id);

    if (error) throw error;

    Alert.alert("Success", "All offers have been reset.");
  } catch (err: any) {
    console.error(err);
    Alert.alert("Error", err.message || "Failed to reset offers.");
  }
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
      .eq("clinic_id", session?.user.id)
      .is("isAccepted", null)
      .or("rejection_note.is.null,rejection_note.eq.''")
      .order("created_at", { ascending: false }); // 👈 DESCENDING

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    console.log("Appointments with names:", data);
    setAppointmentList(data);

    // Refresh Current and Past list
    fetchAppointmentsCurrent();
    fetchAppointmentsPast();
    fetchAppointmentsToday();
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
      .eq("clinic_id", session?.user.id)
      .eq("isAccepted", true)
      .gt("date_time", nowUTC.toISOString())
      .order("date_time", { ascending: true }); // 👈 DESCENDING

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    console.log("Appointments with names:", data);
    setAppointmentCurrentList(data);
    return data;
  };

const fetchAppointmentsToday = async () => {
  const startOfDayUTC = new Date();
  startOfDayUTC.setUTCHours(0, 0, 0, 0);

  const endOfDayUTC = new Date();
  endOfDayUTC.setUTCHours(23, 59, 59, 999);

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
    .eq("clinic_id", session?.user.id)
    .eq("isAccepted", true)
    .gte("date_time", startOfDayUTC.toISOString())
    .lte("date_time", endOfDayUTC.toISOString())
    .order("date_time", { ascending: true });

  if (error) {
    console.error("Error fetching today's appointments:", error.message);
    return [];
  }

  console.log("Today's appointments:", data);
  return data;
};

useEffect(() => {
  const loadAppointments = async () => {
    const todayAppointments = await fetchAppointmentsToday();
    setAppointmentsToday(todayAppointments);
  };

  loadAppointments();

  // Calculate time until next midnight (in ms)
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0); // Set to next midnight
  const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

  const midnightTimeout = setTimeout(() => {
    setAppointmentsToday([]); // Reset state at midnight

    // Optional: Fetch new day's appointments immediately after midnight
    loadAppointments();

    // Optional: setInterval to repeat daily if component stays mounted
    // Or re-run this useEffect if date context changes
  }, timeUntilMidnight);

  return () => clearTimeout(midnightTimeout); // Cleanup on unmount
}, []);




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
      .eq("clinic_id", session?.user.id)
      .or(`isAccepted.eq.false,date_time.lt.${now}`)
      .order("created_at", { ascending: false }); // 👈 DESCENDING

    if (error) {
      console.error("Error fetching appointments:", error.message);
      return [];
    }

    console.log("Appointments with names:", data);
    setAppointmentPast(data);
    return data;
  };

const acceptAppointment = async (appointmentId: string, item: any) => {
  const { error } = await supabase
    .from("appointments")
    .update({ isAccepted: true })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error accepting appointment:", error.message); // See error
    Alert.alert("Error", error.message);
  }
  
  const response = await fetch("https://xnzoxtidzexqeymiisis.supabase.co/functions/v1/cancellation-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuem94dGlkemV4cWV5bWlpc2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk0MDYsImV4cCI6MjA2OTM1NTQwNn0.27zW_CmxYp1npvWlzArMGkn-j0PI8OvCk7Q-t8N7JTs`,
    },
    body: JSON.stringify({
      to: item.profiles.email,
      subject: "Appointment Request Accepted",
      message: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#10B981;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb}.details{background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10B981}.detail-row{margin:10px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}.success{background:#DCFCE7;padding:15px;border-radius:8px;margin:15px 0;border:1px solid #BBF7D0}</style></head><body><div class="container"><div class="header"><h1 style="margin:0">✅ Appointment Request Accepted</h1></div><div class="content"><p>Hello ${item.profiles.first_name},</p><p>Great news! Your appointment request has been <strong>accepted</strong> by the clinic.</p><div class="success"><strong>✓ Confirmed:</strong> Your appointment request is approved and scheduled.</div><div class="details"><h2 style="margin-top:0;color:#10B981">📋 Appointment Details</h2><div class="detail-row">🏥 <strong>Clinic:</strong> ${item.clinic_profiles.clinic_name}</div><div class="detail-row">📅 <strong>Date & Time:</strong> ${new Date(item.date_time).toLocaleString()}</div><div class="detail-row">📝 <strong>Request:</strong> ${item.request}</div><div class="detail-row">💬 <strong>Message:</strong> ${item.message}</div></div><p><strong>Please make sure to arrive on time. If you need to reschedule or have any questions, please contact the clinic.</strong></p></div><div class="footer"><p>Thank you,<br><strong>${item.clinic_profiles.clinic_name}</strong></p></div></div></body></html>`,
    }),
  });

  try {
    await activityLogger.log(
      item.clinic_profiles.clinic_id, 
      'user', 
      `Accepted an appointment`
    );
  } catch (error) {
    console.error("❌ Error calling activity logger:", error);
  }

   console.log('Fetch completed. Status:', response.status, 'StatusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    console.log(item)

};

const rejectAppointment = async (
  appointmentId: string,
  rejectionMsg: string
) => {
  const { error } = await supabase
    .from("appointments")
    .update({
      isAccepted: false,
      rejection_note: rejectionMsg,
    })
    .eq("id", appointmentId);

  try {
    await activityLogger.log(
      '', 
      'user', 
      `Accepted an appointment`
    );
  } catch (error) {
    console.error("❌ Error calling activity logger:", error);
  }

  if (error) {
    console.error("Error rejecting appointment:", error.message); // See error
    Alert.alert("Error", error.message);
  }
};

const openOutcomeModal = (appointmentId: string) => {
  setSelectedAppointmentId(appointmentId);
  setOutcomeModalVisible(true);
};

const attendedAppointment = async (appointmentId: string, outcome: string) => {
  const { error } = await supabase
    .from("appointments")
    .update({ 
      isAttended: true,
      outcome: outcome 
    }) 
    .eq("id", appointmentId);

  if (error) {
    console.error("Error marking as attended:", error.message);
    Alert.alert("Error", error.message);
  } else {
    // Close modal and reset
    setOutcomeModalVisible(false);
    setOutcomeMessage("");
    setSelectedAppointmentId(null);
    
    // OPTIONAL: Refresh the appointments list if needed
    // await fetchAppointments();
  }
};

const notAttendedAppointment = async (appointmentId: string) => {
  const { error } = await supabase
    .from("appointments")
    .update({ isAttended: false })
    .eq("id", appointmentId);

  if (error) {
    console.error("Error marking as not attended:", error.message);
    Alert.alert("Error", error.message);
  } else {
    // OPTIONAL: Refresh the appointments list if needed
    // await fetchAppointments();
  }
};

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

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
      getProfile();
      getClinic();
    }, [])
  );

  useEffect(() => {
  if (!session?.user?.id) return;

  // Subscribe to all changes on appointments for this clinic
  const subscription = supabase
    .channel('public:appointments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `clinic_id=eq.${session.user.id}`,
      },
      (payload) => {
        console.log('Realtime appointment change:', payload);

        // Re-fetch all appointment lists on any change
        fetchAppointments();
        fetchAppointmentsCurrent();
        fetchAppointmentsPast();
        fetchAppointmentsToday().then(setAppointmentsToday);;
      }
    )
    .subscribe();

  // Clean up subscription on unmount
  return () => {
    supabase.removeChannel(subscription);
  };
}, [session?.user?.id]);


  useEffect(() => {
    async function loadUserCount() {
      try {
        const { count, error } = await supabase
          .from("profiles") // or 'auth.users' if you have access
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

async function getProfile() {
  try {
    setLoading(true);
    if (!session?.user) throw new Error("No user on the session!");

    // Check if profile exists
    const { data, error, status } = await supabase
      .from("profiles")
      .select("id, username, website, avatar_url, isFirst")
      .eq("id", session.user.id)
      .single();

    if (error && status !== 406) throw error;

    // Insert if profile does not exist
    if (!data) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([{ id: session.user.id }]);
      if (insertError) throw insertError;
    }

    // Update clinic_profiles email as before
    const { error: updateError } = await supabase
      .from("clinic_profiles")
      .update({ email: session.user.email })
      .eq("id", session.user.id);

    if (updateError) throw updateError;

    if (data) {
      setUsername(data.username);
      setWebsite(data.website);
      setAvatarUrl(data.avatar_url);

    }
  } catch (error) {
    if (error instanceof Error) Alert.alert(error.message);
  } finally {
    setLoading(false);
  }
}


  async function getClinic() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("clinic_profiles")
        .select(
          `clinic_name, mobile_number, address, clinic_photo_url, license_photo_url, isDentistAvailable, introduction, offers, request_verification, isVerified, denied_verification_reason, isWarn, isBan, notif_message, isFirst`
        )
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setClinicName(data.clinic_name);
        setMobileNum(data.mobile_number);
        setAdress(data.address);
        setClinicPho(data.clinic_photo_url);
        setLicensePho(data.license_photo_url);
        setDentistAvailability(data.isDentistAvailable ?? false);
        setClinicIntroduction(data.introduction ?? "");
        setOffers(data.offers ?? "");
        setRequestVerification(data.request_verification ?? false);
        setVerified(data.isVerified ?? false);
        setDenialReason(data.denied_verification_reason ?? "");
        setNotifMessage(data.notif_message ?? "");
        setviewFirstShow(data.isFirst);
        if (data.isWarn !== warn) {
          setWarn(true);
        }
        if (data.isBan !== ban) {
          setBan(true);
        }
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need access to your photos to set a profile picture."
      );
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

  const saveClinicLocation = async (long: number, lat: number) => {
    try {
      const { error: updateError } = await supabase
        .from("clinic_profiles")
        .update({ longitude: long, latitude: lat }) // 👈 changed here
        .eq("id", session?.user.id);

      if (!updateError) {
        Alert.alert("Clinic Location has been saved");
      }
    } catch (err) {
      console.log(`ERR Save Clinic Location : ${err}`);
    }
  };

  async function updateProfile({
    website,
    avatar_url,
  }: {
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error: updateError } = await supabase
        .from("clinic_profiles")
        .update({ bio: website }) // 👈 changed here
        .eq("id", session.user.id); 

      const { error } = await supabase.from("profiles").upsert(updates);

      try {
        await activityLogger.log(
          session?.user.id, 
          'clinic', 
          'Updated clinic profile'
        );
      } catch (error) {
        console.error("❌ Error calling activity logger:", error);
      }

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

  const handleUploadAvatar = async (file: File | Blob | string) => {
    try {
      if (!session) throw new Error("No session available");

      // 1️⃣ Detect file extension
      let fileExt = "png";
      if (typeof file === "string") {
        const match = file.match(/^data:(image\/\w+);/);
        fileExt = match ? match[1].split("/")[1] : "png";
      } else if (file instanceof File) {
        fileExt = file.name.split(".").pop() ?? "png";
      } else if (file instanceof Blob && file.type) {
        fileExt = file.type.split("/")[1] ?? "png";
      }

      // 2️⃣ Normalize to Blob
      let fileData: Blob;
      if (typeof file === "string") {
        const base64 = file.split(",")[1];
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileData = new Blob([byteArray], { type: `image/${fileExt}` });
      } else {
        fileData = file;
      }

      // 3️⃣ Create unique path
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // 4️⃣ Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, fileData, { upsert: true });

      if (uploadError) throw uploadError;

      // 5️⃣ Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Failed to get public URL");

      // 6️⃣ Update clinic_profiles.clinic_photo_url
      const { error: clinicUpdateError } = await supabase
        .from("clinic_profiles")
        .update({ clinic_photo_url: publicUrl })
        .eq("id", session.user.id);

      if (clinicUpdateError) throw clinicUpdateError;

      // 6️⃣ Update profiles.avatar_url
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", session.user.id);

      if (profileUpdateError) throw profileUpdateError;

      // 7️⃣ Update state
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
  
  const toggleDentistAvailability = () => {
    setDentistAvailability((prev) => !prev);
  };

  const updateProfileInfoModal = async () => {
    try {
      if (!session?.user) throw new Error("No user on the session!");

      const { error } = await supabase
        .from("clinic_profiles")
        .update({
          isDentistAvailable: dentistAvailability,
          introduction: clinicIntroduction,
          offers: offers,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      Alert.alert("Success", "Profile info updated.");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    }
  };

    const uploadVerificationImage = async (file: File | Blob | string): Promise<string | undefined> => {
        if (!session) throw new Error("No session available");
        // We are using the user's provided code structure but ensuring 
        // it handles a base64 string or a File/Blob, and returns the URL.
        try {
            // 1️⃣ Detect file extension (Simplified for clarity)
            let fileExt = "png";
            if (typeof file === "string") {
                const match = file.match(/^data:(image\/\w+);/);
                fileExt = match ? match[1].split("/")[1] : "png";
            } else if (file instanceof File) {
                fileExt = file.name.split(".").pop() ?? "png";
            } else if (file instanceof Blob && file.type) {
                fileExt = file.type.split("/")[1] ?? "png";
            }

            // 2️⃣ Normalize to Blob if base64 string
            let fileData: Blob;
            if (typeof file === "string") {
                const base64 = file.split(",")[1];
                const byteChars = atob(base64);
                const byteNumbers = new Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                    byteNumbers[i] = byteChars.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                fileData = new Blob([byteArray], { type: `image/${fileExt}` });
            } else {
                fileData = file;
            }

            // 3️⃣ Create unique path in user's folder
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${session.user.id}/verification/${fileName}`; // Changed path to a 'verification' sub-folder
            
            // 4️⃣ Upload to Supabase Storage (using 'avatars' bucket as per your code)
            const { error: uploadError } = await supabase.storage
                .from("avatars") 
                .upload(filePath, fileData, { upsert: true });

            if (uploadError) throw uploadError;

            // 5️⃣ Get public URL
            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
            const publicUrl = data?.publicUrl;
            if (!publicUrl) throw new Error("Failed to get public URL");

              try {
                await activityLogger.log(
                  session?.user.id, 
                  'clinic', 
                  'Upload verification details'
                );
              } catch (error) {
                console.error("❌ Error calling activity logger:", error);
              }

            return publicUrl;
        } catch (err) {
            console.error("Upload failed:", err);
            throw err; // Re-throw to be caught by the calling function
        }
    };

    // MODIFIED pickVerifyPhotoMobile: ONLY updates state, does NOT upload
   // MODIFIED pickVerifyPhotoMobile: ONLY updates state, does NOT upload
    const pickVerifyPhotoMobile = async () => {
        // ... permission checks ...
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission denied",
                "We need access to your photos to upload a verification photo."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            // Set the URI to state. The button text will change now.
            setVerifyPhoto(result.assets[0].uri);
            setIsVerifyPhotoPDF(false);
        }
    };

    // MODIFIED pickVerifyPhotoWeb: ONLY updates state, does NOT upload
    const pickVerifyPhotoWeb = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,application/pdf"; // Accept both images and PDFs
        input.onchange = async (event: any) => {
            const file = event.target.files?.[0];
            if (file) {
                const isPDF = file.type === "application/pdf";
                // Store the file object and a temporary URL for preview/tracking
                const uri = URL.createObjectURL(file);
                setVerifyPhoto({ uri, file });
                setIsVerifyPhotoPDF(isPDF);
            }
        };
        input.click();
    };

    // The generic handler remains the same
    const handlePickVerifyPhoto = () => {
        if (Platform.OS === "web") {
            pickVerifyPhotoWeb();
        } else {
            pickVerifyPhotoMobile();
        }
    };


    // 🎯 NEW FUNCTION: Handles the final verification submission and optional upload
    const handleVerificationSubmit = async () => {
        setIsSubmitting(true);
        let publicUrl: string | undefined = undefined;

        try {
            if (verifyPhoto) {
                // 1. Image selected: Prepare data based on platform and upload
                if (Platform.OS === 'web' && typeof verifyPhoto === 'object' && verifyPhoto.file) {
                    // Web: upload the File/Blob object
                    publicUrl = await uploadVerificationImage(verifyPhoto.file);
                } else if (typeof verifyPhoto === 'string') {
                    // Mobile/Other: upload the URI (need to convert to base64/blob)
                    const base64 = await FileSystem.readAsStringAsync(verifyPhoto, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const fileExt = verifyPhoto.split(".").pop() || "jpg";
                    const dataUrl = `data:image/${fileExt};base64,${base64}`;
                    publicUrl = await uploadVerificationImage(dataUrl);
                }
            }

            // 2. Update clinic_profiles with the new photo URL (if uploaded) and submission status
            const updates = { 
                license_photo_url: publicUrl, // Update to the column you want to use for verification
                // Add a column to track the submission state, e.g., 'verification_submitted: true'
            };

            // Only update the URL if an image was uploaded
            const { error: dbUpdateError } = await supabase
                .from("clinic_profiles")
                .update(updates)
                .eq("id", session!.user.id);

                    try {
                await activityLogger.log(
                  session?.user.id as any, 
                  'clinic', 
                  'Upload verification details'
                );
              } catch (error) {
                console.error("❌ Error calling activity logger:", error);
              }

            
            if (dbUpdateError) throw dbUpdateError;

            Alert.alert("Success", publicUrl ? "Verification photo uploaded and submission sent!" : "Verification request sent!");

          
            // Clear the local photo state after successful submission
            setVerifyPhoto(null);

        } catch (error) {
            console.error("Verification Submission Failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            Alert.alert("Error", `Failed to complete verification submission: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

  const handleConfirmVerify = async () => {
    handleVerificationSubmit();
    setRequestVerification(true);
    setShowVerifyModal(false); // close modal

    const { error } = await supabase
      .from("clinic_profiles")
      .update({ request_verification: true })
      .eq("id", session?.user.id);

    if (error) {
      console.error("Failed to request verification:", error.message);
    }
  };


type Appointment = {
  id: string;
  created_at: string;
  clinic_id: string;
  patient_id: string;
  date_time: string;
  message: string;
  clinic_profiles: { clinic_name: string, email: string };
  profiles: { first_name: string; last_name: string, email: string };
  isAccepted: boolean | null;
  outcome: string;
  rejection_note: string;
  isAttended: boolean | null;
  request: string; // 👈 Added this back in
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
    Request: ( async () => {
      try {
          await activityLogger.log(
          item.clinic_id, 
          'clinic', 
          'Upload verification details'
        );

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
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error exporting file');
    }
  }
};

// ==========================================
// ADD THESE FUNCTIONS BEFORE YOUR RETURN STATEMENT
// ==========================================

// 1. DESCRIPTIVE ANALYTICS - Historical appointment data
const getAppointmentStats = () => {
  const allAppointments = [
    ...(appointmentsList || []),
    ...(appointmentsCurrentList || []),
    ...(appointmentsPast || [])
  ];

  const total = allAppointments.length;
  const accepted = allAppointments.filter(a => a.isAccepted === true).length;
  const rejected = allAppointments.filter(a => a.isAccepted === false).length;
  const pending = allAppointments.filter(a => a.isAccepted === null).length;
  const attended = allAppointments.filter(a => a.isAttended === true).length;
  const notAttended = allAppointments.filter(a => a.isAttended === false).length;

  return { total, accepted, rejected, pending, attended, notAttended };
};

// 2. DIAGNOSTIC ANALYTICS - Why appointments were rejected
const getRejectionReasons = () => {
  const rejectedAppointments = (appointmentsPast || []).filter(a => a.isAccepted === false);
  const reasons = {};
  
  rejectedAppointments.forEach(apt => {
    const reason = apt.rejection_note || "No reason provided";
    reasons[reason] = (reasons[reason] || 0) + 1;
  });

  return Object.entries(reasons).map(([reason, count]) => ({ reason, count }));
};

// 3. PREDICTIVE ANALYTICS - Appointment trends by month
const getMonthlyTrends = () => {
  const allAppointments = [
    ...(appointmentsList || []),
    ...(appointmentsCurrentList || []),
    ...(appointmentsPast || [])
  ];

  const monthlyData = {};
  
  allAppointments.forEach(apt => {
    const date = new Date(apt.created_at);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-6) // Last 6 months
    .map(([month, count]) => ({ month, count }));
};

// 4. PRESCRIPTIVE ANALYTICS - Peak hours and recommendations
const getPeakHours = () => {
  const acceptedAppointments = (appointmentsCurrentList || []).concat(
    (appointmentsPast || []).filter(a => a.isAccepted === true)
  );

  const hourCounts = {};
  
  acceptedAppointments.forEach(apt => {
    const hour = new Date(apt.date_time).getHours();
    const timeSlot = `${hour}:00 - ${hour + 1}:00`;
    hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
  });

  return Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([time, count]) => ({ time, count }));
};

// 5. Most requested services
const getPopularServices = () => {
  const allAppointments = [
    ...(appointmentsList || []),
    ...(appointmentsCurrentList || []),
    ...(appointmentsPast || [])
  ];

  const services = {};
  
  allAppointments.forEach(apt => {
    const message = apt.message || "";
    // Extract service keywords (you can customize this)
    const keywords = ["cleaning", "checkup", "extraction", "filling", "whitening", "braces", "root canal"];
    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        services[keyword] = (services[keyword] || 0) + 1;
      }
    });
  });

  return Object.entries(services)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, count]) => ({ service, count }));
};

// 6. No-show rate calculation
const getNoShowRate = () => {
  const acceptedAppointments = (appointmentsPast || []).filter(a => a.isAccepted === true);
  const total = acceptedAppointments.length;
  const noShows = acceptedAppointments.filter(a => a.isAttended === false).length;
  
  return {
    rate: total > 0 ? ((noShows / total) * 100).toFixed(1) : 0,
    total,
    noShows
  };
};

// Function to fetch patient's appointment history
const fetchPatientHistory = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        clinic_profiles (
          clinic_name,
          address
        ),
        profiles (
          first_name,
          last_name,
          mobile_number,  
          email,
          birthdate,     
          gender       
        )
      `)
      .eq("patient_id", patientId)
      // ❌ REMOVE THIS LINE - it limits to only current clinic's appointments
      // .eq("clinic_id", session?.user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching patient history:", err.message);
    return [];
  }
};

const openPatientHistory = async (patientId, patientInfo) => {
  const history = await fetchPatientHistory(patientId);
  setPatientAppointmentHistory(history);
  
  // Use the complete profile data from the first history item if available
  if (history && history.length > 0 && history[0].profiles) {
    setSelectedPatient(history[0].profiles);
  } else {
    setSelectedPatient(patientInfo);
  }
  
  setPatientHistoryModal(true);
};

// Function to close patient history modal
const closePatientHistory = () => {
  setPatientHistoryModal(false);
  setSelectedPatient(null);
  setPatientAppointmentHistory([]);
};

// Patient History Modal Component
const PatientHistoryModalComponent = () => (
  <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={patientHistoryModal} onBackdropPress={() => closePatientHistory(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        width: isMobile ? "90%" : "70%",
        maxWidth: 800,
        borderWidth: 2,
        borderColor: '#ccc',
        maxHeight: "85%",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottomWidth: 2,
          borderBottomColor: "#00505cff",
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#00505cff",
          }}
        >
          Patient Information
        </Text>
        <TouchableOpacity onPress={closePatientHistory}>
          <FontAwesome5 name="times" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Patient Details */}
        {selectedPatient && (
          <View
            style={{
              backgroundColor: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#00505cff",
                marginBottom: 12,
              }}
            >
              Personal Details
            </Text>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontWeight: "600", width: 120 }}>Name:</Text>
                <Text style={{ flex: 1 }}>
                  {`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                </Text>
              </View>

              {selectedPatient.email && (
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontWeight: "600", width: 120 }}>Email:</Text>
                  <Text style={{ flex: 1 }}>{selectedPatient.email}</Text>
                </View>
              )}

              {selectedPatient.mobile_number && (
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontWeight: "600", width: 120 }}>Phone:</Text>
                  <Text style={{ flex: 1 }}>{selectedPatient.mobile_number}</Text>
                </View>
              )}

              {selectedPatient.address && (
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontWeight: "600", width: 120 }}>Address:</Text>
                  <Text style={{ flex: 1 }}>{selectedPatient.address}</Text>
                </View>
              )}

              {selectedPatient.birthdate && (
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontWeight: "600", width: 120 }}>Birth Date:</Text>
                  <Text style={{ flex: 1 }}>
                    {new Date(selectedPatient.birthdate).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {selectedPatient.gender && (
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontWeight: "600", width: 120 }}>Gender:</Text>
                  <Text style={{ flex: 1 }}>{selectedPatient.gender}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Appointment History */}
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#00505cff",
              marginBottom: 12,
            }}
          >
            Recent Appointment History (Last 3)
          </Text>

          {patientAppointmentHistory.length === 0 ? (
            <View
              style={{
                backgroundColor: "#fff3cd",
                padding: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#ffc107",
                alignItems: "center",
              }}
            >
              <FontAwesome5
                name="user-plus"
                size={40}
                color="#ffc107"
                style={{ marginBottom: 10 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#856404",
                }}
              >
                New Patient
              </Text>
              <Text style={{ color: "#856404", marginTop: 4 }}>
                No previous appointments found
              </Text>
            </View>
          ) : (
            patientAppointmentHistory.map((apt, index) => (
              <View
                key={apt.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "#00505cff" }}>
                    Appointment #{patientAppointmentHistory.length - index}
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        apt.isAccepted === true
                          ? "#4caf50"
                          : apt.isAccepted === false
                          ? "#f44336"
                          : "#ff9800",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                      {apt.isAccepted === true
                        ? "Accepted"
                        : apt.isAccepted === false
                        ? "Rejected"
                        : "Pending"}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "600", width: 140 }}>Date & Time:</Text>
                    <Text style={{ flex: 1 }}>
                      {new Date(apt.date_time).toLocaleString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "600", width: 140 }}>Request:</Text>
                    <Text style={{ flex: 1 }}>
                      {(() => {
                        try {
                          return JSON.parse(apt.request).join(", ");
                        } catch {
                          return apt.request || "N/A";
                        }
                      })()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "600", width: 140 }}>Clinic:</Text>
                    <Text style={{ flex: 1 }}>
                      {apt.clinic_profiles?.clinic_name || "N/A"}
                    </Text>
                  </View>

                  {apt.clinic_profiles?.address && (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "600", width: 140 }}>Location:</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: "#666" }}>
                        {apt.clinic_profiles.address}
                      </Text>
                    </View>
                  )}

                  {apt.message && (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "600", width: 140 }}>Message:</Text>
                      <Text style={{ flex: 1 }}>{apt.message}</Text>
                    </View>
                  )}

                  {apt.isAttended !== null && (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "600", width: 140 }}>Attendance:</Text>
                      <Text
                        style={{
                          flex: 1,
                          color: apt.isAttended ? "#4caf50" : "#f44336",
                          fontWeight: "600",
                        }}
                      >
                        {apt.isAttended ? "Attended" : "Not Attended"}
                      </Text>
                    </View>
                  )}
                  {apt.outcome && (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "600", width: 140 }}>Outcome:</Text>
                      <Text
                        style={{
                          flex: 1,
                          color: apt.outcome ? "#4caf50" : "#f44336",
                          fontWeight: "600",
                        }}
                      >
                        {apt.outcome}
                      </Text>
                    </View>
                  )}

                  {apt.rejection_note && (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ fontWeight: "600", width: 140 }}>Rejection Note:</Text>
                      <Text style={{ flex: 1, color: "#f44336" }}>
                        {apt.rejection_note}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  </Modal>
);

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
       <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={viewFirstShow} onBackdropPress={() => setviewFirstShow(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
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
                alignSelf: "center",
                color: "#1f5474ff",
                textAlign: 'center',
              }}
            >
              Wanna edit/setup your information? let me guide you!
            </Text>
            <Text
              style={{
                fontSize: 16,
                alignSelf: "center",
                color: "#1f5474ff",
                textAlign: 'center',
              }}
            >
              You can pin your location in our map!
            </Text>
            <Text
              style={{
                fontSize: 16,
                marginBottom: 20,
                alignSelf: "center",
                color:"#1f5474ff",
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Verify your clinic to access schedule and pin map.
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
                    // Update `isFirst` in `profiles`
                    const { error: profileError } = await supabase
                      .from('profiles')
                      .update({ isFirst: false })
                      .eq('id', session?.user.id);

                    // Update `isFirst` in `clinic_profiles`
                    const { error: clinicProfileError } = await supabase
                      .from('clinic_profiles')
                      .update({ isFirst: false })
                      .eq('id', session?.user.id);

                    if (profileError || clinicProfileError) {
                      console.error('Update error:', profileError || clinicProfileError);
                      Alert.alert('Error', 'Failed to update your profile.');
                      return;
                    }

                    // Close modal
                    setviewFirstShow(false);
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
                    // Update `isFirst` in `profiles`
                    const { error: profileError } = await supabase
                      .from('profiles')
                      .update({ isFirst: false })
                      .eq('id', session?.user.id);

                    // Update `isFirst` in `clinic_profiles`
                    const { error: clinicProfileError } = await supabase
                      .from('clinic_profiles')
                      .update({ isFirst: false })
                      .eq('id', session?.user.id);

                    if (profileError || clinicProfileError) {
                      console.error('Update error:', profileError || clinicProfileError);
                      Alert.alert('Error', 'Failed to update your profile.');
                      return;
                    }

                    // Close the modal locally
                    setviewFirstShow(false);
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
                    .from('clinic_profiles')
                    .update({ isWarn: false })
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
    • CLINIC •
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
                      Edit Information
                    </Text>
                  )}
                </TouchableOpacity>
                {/*Modal : Edit Info */}
                <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={modalUpdate} onBackdropPress={() => setModalUpdate(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
                  <View
                    style={{
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: 20,
                      alignItems: "center",
                      width: !isMobile ? "25%" : "95%",
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
                      <Text style={{fontWeight: "bold", fontStyle: "italic", fontSize: 16, textAlign: "center", color: "#003f30ff"}}>
                        {clinicName}
                      </Text>
                      <Text style={{fontStyle: "italic", fontSize: 16, textAlign: "center", marginBottom: 10, color: "#003f30ff"}}>
                        {website}
                      </Text>
                    </View>
                    <Modal
                      transparent
                      animationType="fade"
                      visible={profileInfoVisible}
                      onRequestClose={() => setProfileInfoVisible(false)}
                    >
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(0,0,0,0.4)",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: 50,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "white",
                            borderRadius: 12,
                            padding: 20,
                            width: Platform.OS === "web" ? "300px" : "95%",
                          }}
                        >
                          <TouchableOpacity
                            onPress={toggleDentistAvailability}
                            style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
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
                                backgroundColor: dentistAvailability ? "#007bff" : "#fff",
                              }}
                            >
                              {dentistAvailability && (
                                <View style={{ width: 10, height: 10, backgroundColor: "#fff" }} />
                              )}
                            </View>
                            <Text>Dentist Availability</Text>
                          </TouchableOpacity>

                          {/* Clinic's Introduction TextInput */}
                          <Text style={{ marginBottom: 6, fontWeight: "bold" }}>
                            Clinic's Slogan
                          </Text>
                          <TextInput
                            style={{
                              height: 100,
                              borderColor: "#ccc",
                              borderWidth: 1,
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 15,
                              textAlignVertical: "top",
                            }}
                            multiline
                            placeholder="Write introduction..."
                            maxLength={100}
                            value={website}
                            onChangeText={setWebsite}
                          />

                          {/* Clinic's Introduction TextInput */}
                          <Text style={{ marginBottom: 6, fontWeight: "bold" }}>
                            Clinic's Introduction
                          </Text>
                          <TextInput
                            style={{
                              height: 100,
                              borderColor: "#ccc",
                              borderWidth: 1,
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 15,
                              textAlignVertical: "top",
                            }}
                            multiline
                            placeholder="Write introduction..."
                            maxLength={500}
                            value={clinicIntroduction}
                            onChangeText={setClinicIntroduction}
                          />

                          {/* Buttons at the bottom */}
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: "#b32020",
                                paddingVertical: 12,
                                borderRadius: 8,
                                marginRight: 10,
                              }}
                              onPress={() => setProfileInfoVisible(false)}
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

                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: "#2e7dccff",
                                paddingVertical: 12,
                                borderRadius: 8,
                              }}
                              onPress={() => {
                                updateProfileInfoModal(); // always updates with current toggle state

                                console.log("Clinic Introduction:", clinicIntroduction);
                                console.log("Offers:", offers);
                                setProfileInfoVisible(false);
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
                      </View>
                    </Modal>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 8,
                      }}
                    >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#4CAF50",
                        paddingVertical: 5,
                        borderRadius: 8,
                        marginTop: 10,
                      }}
                      onPress={() => setProfileInfoVisible(true)}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        Open Profile Info
                      </Text>
                    </TouchableOpacity>
                    </View>
                      {!verified && (
                        <Text style={{ 
                          color: "#000000ff", 
                          marginBottom: 10, 
                          textAlign: "center",
                        }}>
                          {"To access these features, please "}
                          <Text style={{ textDecorationLine: "underline", color: "blue" }} onPress={() => {
                            setDashboardView("verify");
                            setModalUpdate(false);
                            if (isMobile) {
                              setMoved((prev) => !prev);
                              setExpanded((prev) => !prev);
                            }
                          }}>
                            verify
                          </Text>
                          {" here."}
                        </Text>
                      )}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        gap: 5,
                      }}
                    >
                      <TouchableOpacity
                        disabled={!verified}
                        style={{
                          flex: 1,
                          backgroundColor: verified ? "#4CAF50" : "#A5D6A7", // lighter green or gray when disabled
                          paddingVertical: 5,
                          borderRadius: 8,
                          marginBottom: 8,
                          height: isMobile ? 28 : 30,
                          opacity: verified ? 1 : 0.6, // visually indicate disabled state
                        }}
                        onPress={() => {
                          if (verified) setShowMapPicketModal(true);
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          {"Edit Map"}
                        </Text>
                      </TouchableOpacity>
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
                          backgroundColor: "#b32020",
                          paddingVertical: 12,
                          borderRadius: 8,
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
                          Back
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

                <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showMapPickerModal} onBackdropPress={() => setShowMapPicketModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>                           
                  <View
                    style={{
                      backgroundColor: "white",
                      borderRadius: 10,
                      padding: 16,
                      width: isMobile ? 350 : "80%",
                      position: "relative", // important for absolute positioning inside
                    }}
                  >
                    {/* Close button in upper right corner */}
                    <TouchableOpacity
                      onPress={() => setShowMapPicketModal(false)}
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
                        marginBottom: 8,
                        fontWeight: "bold",
                        fontSize: 16,
                        color: "#00505cff",
                      }}
                    >
                      Locate your clinic location
                    </Text>
                    <Text style={{ marginBottom: 12 }}>
                      Tip: click/tap in the map to pin your clinic location
                    </Text>

                    <MapPickerView
                      allowEdit
                      onSave={(long, lat) => {
                        setShowMapPicketModal(false);
                        saveClinicLocation(long, lat);
                      }}
                    />
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
    backgroundColor: dashboardView === "profile" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="user" size={22} color={dashboardView === "profile" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "profile" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Dashboard
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("schedule");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "schedule" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="calendar-check-o" size={22} color={dashboardView === "schedule" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "schedule" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Schedule
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("offers");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "offers" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="tag" size={22} color={dashboardView === "offers" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "offers" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Offers
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
    backgroundColor: dashboardView === "clinics" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <MaterialIcons name="trending-up" size={22} color={dashboardView === "clinics" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "clinics" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Analytics
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
    backgroundColor: dashboardView === "appointments" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="calendar" size={22} color={dashboardView === "appointments" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "appointments" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Running Appointments
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
    backgroundColor: dashboardView === 'pending' ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
    position: 'relative', // Important for badge positioning
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="clock-o" size={22} color={dashboardView === "pending" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "pending" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Appointment Requests
      </Text>
      
      {/* Notification Badge */}
      {appointmentRequestCount > 0 && (
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
            borderColor: dashboardView === "pending" ? '#ffffff' : '#00505cff',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {appointmentRequestCount > 99 ? '99+' : appointmentRequestCount}
          </Text>
        </View>
      )}
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
    backgroundColor: dashboardView === "history" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="history" size={22} color={dashboardView === "history" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "history" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Appointment History
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
    backgroundColor: dashboardView === "chats" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="comments" size={22} color={dashboardView === "chats" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "chats" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Chats
      </Text>
    </View>
  )}
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setDashboardView("verify");
    if (isMobile) {
      setMoved((prev) => !prev);
      setExpanded((prev) => !prev);
    }
  }}
  style={{
    ...styles.mar2,
    backgroundColor: dashboardView === "verify" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="check-circle" size={22} color={dashboardView === "verify" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "verify" ? '#00505cff' : '#ffffffff',
        marginLeft: 8,
      }}>
        Verification
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
    backgroundColor: dashboardView === "team" ? '#ffffffff' : 'transparent',
    borderRadius: 15,
    padding: 5,
  }}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator animating color={"black"} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
      <FontAwesome name="users" size={22} color={dashboardView === "team" ? '#00505cff' : '#ffffffff'} />
      <Text style={{
        ...styles.buttonText,
        color: dashboardView === "team" ? '#00505cff' : '#ffffffff',
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
      <LinearGradient
        style={{ flex: 1, position: "relative" }}
        colors={['#b9d7d3ff', '#00505cff']}
      >
        {/* Dashboard Profile --------------------------------------------------------------------------------------- */}
         <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={!!rejectAppointmentId} onBackdropPress={() => setModalUpdate(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>                           
        
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 18,
              width: isDesktop ? 320 : "100%",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Reject appointment request
            </Text>
            <Text style={{ fontSize: 14, color: "black", }} > Rejection Note </Text>
            <TextInput
              value={rejectMsg}
              maxLength={3000}
              inputMode="text"
              multiline
              onChangeText={(text) => {
                setRejectMsg(text);
                if (text.trim() !== "") setRejectError(false); // remove error once user types
              }}
              style={{borderWidth: 1, borderRadius: 10, borderColor: '#d2d2d2', paddingHorizontal: 4}}
            />
            {rejectError && (
              <Text style={{ color: "red", fontSize: 13, marginTop: 4 }}>
                Rejection note is required.
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                if (!rejectMsg || rejectMsg.trim() === "") {
                  setRejectError(true);
                  return;
                }

                rejectAppointment(rejectAppointmentId || "", rejectMsg );
                setRejectAppointmentID(undefined);
                setRejectMsg(undefined);
              }}
              style={{
                marginTop: 25,
                width: "100%",
                backgroundColor: "green",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: "300",
                }}
              >
                Confirm Rejection
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setRejectAppointmentID(undefined);
                setRejectMsg(undefined);
              }}
              style={{
                width: "100%",
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "black",
                  fontSize: 14,
                  fontWeight: "300",
                }}
              >
                Cancel Reject
              </Text>
            </TouchableOpacity>
          </View>
       
        </Modal>

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
             Dashboard
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
                  borderWidth: 4,
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
                  marginTop: 10
                }}
              >
                {clinicName}
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
                  color: "#8a8a8aff",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {mobileNum}
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
            
            <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showWeeklySchedule} onBackdropPress={() => setShowWeeklySchedule(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}>                           
              <WeekScheduleEditor
                clinicId={session?.user.id}
                onSave={() => {
                  setShowWeeklySchedule(false);
                }}
              />

              <TouchableOpacity
                onPress={() => setShowWeeklySchedule(false)}
                style={{
                  marginTop: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  backgroundColor: "#f44336", // red button
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
              </TouchableOpacity>               
            </Modal>
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
                  {
                    // You might want to store the length in state for reactivity
                    appointmentsToday.length // Assuming you've fetched and stored it
                  }
                </Text>
                <Text style={{ textAlign: "center", marginTop: 6, fontSize: isMobile ? 15 : 25, color: '#00505cff', }} > Appointments </Text>
                <Text style={{ textAlign: "center", fontSize: isMobile ? 15 : 25, color: '#00505cff', }} > Today </Text>
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
                      style={{...styles.redButton, backgroundColor: '#00505cff',}}
                      onPress={() => setModalVisible(true)}
                    >
                      <Text
                        style={{
                          ...styles.buttonText1,
                          fontSize: isMobile ? 10 : 25,
                          color: '#ffffffff',
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
      {/* Top-right "X" Close Button */}
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

        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, alignSelf: "center", color: "#00505cff", }} > Appointments </Text>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          width: "100%",
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
                <Text style={{ fontWeight: "600", marginBottom: 8, color: '#555' }}>
                  {`${e.item.profiles.first_name} ${e.item.profiles.last_name}`}
                </Text>

                <Text style={{ fontWeight: "600", color: '#555' }}>
                  Requested Dentists/Staff :
                </Text>
                <Text style={{color: '#000'}}>
                  {(() => {
                    try {
                      return JSON.parse(e.item.request).join("\n");
                    } catch {
                      return e.item.request;
                    }
                  })()}
                </Text>

                {e.item.message.length > 20 ? (
                  <Text style={{ textAlign: "left", flex: 1 }}>
                    <Text style={{ color: "#000" }}>
                      {e.item.message.slice(0, 20) + "..."}
                    </Text>
                    <Text onPress={() => { setSelectedMessage(e.item.message); setModalMessage(true); setModalVisible(false); }} style={{ color: "blue", textDecorationLine: "underline", }} > See More </Text>
                  </Text>
                ) : (
                  <Text style={{ flex: 1, color: '#555' }}>{e.item.message}</Text>
                )}

                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    marginBottom: 10,
                    marginTop: 15,
                  }}
                >
                  <Text style={{ color: "#000000ff" }}>
                    {`Date/Time Request : \n${new Date(e.item.date_time).toLocaleString(undefined, {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#767676ff",
                    fontSize: 9,
                    alignSelf: "flex-end",
                  }}
                >
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
                <Text style={{ fontWeight: "600", color: '#555' }}>
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
  {/* Appointment Requests Section */}
  <View
    style={{
      flex: 1,
      padding: 16,
      backgroundColor: "#fff",
      borderRadius: 8,
      minWidth: isMobile ? "100%" : 330,
      height: isMobile ? null : 400,
    }}
  >
    <Text
      style={{
        alignSelf: "center",
        fontWeight: "bold",
        fontSize: 24,
        color: '#00505cff',
        marginBottom: 10,
      }}
    >
      Appointment Requests
    </Text>

    <FlatList
      data={isMobile ? (appointmentsList ?? []).slice(0, 3) : (appointmentsList ?? [])}
      keyExtractor={(e) => e.id}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      contentContainerStyle={{
        gap: 10,
        paddingBottom: 20,
        alignItems: (appointmentsList?.length ?? 0) === 0 ? "center" : "stretch",
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
          <Text style={{ fontWeight: "bold", color: '#555'}}>Patient's Name :</Text>
          <Text style={{color: '#000'}}>{`${e.item.profiles.first_name} ${e.item.profiles.last_name}`}</Text>

          <Text style={{ fontWeight: "bold", color: '#555' }}>Date & Time of Appointment :</Text>
          <Text style={{color: '#555'}}>{`Date : ${new Date(e.item.date_time).toLocaleString(undefined, {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}`}</Text>

          <Text style={{ fontWeight: "bold", color: '#555' }}> Requested Dentists/Staff : </Text>
          <Text style={{color: '#555'}}>
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
            <Text style={{ fontWeight: "bold", color: '#555' }}>Message :</Text>
            {e.item.message.length > 20 ? (
              <Text style={{ textAlign: "left", flex: 1, color: '#555' }}>
                <Text style={{ color: "#000" }}>
                  {e.item.message.slice(0, 20) + "..."}
                </Text>
                <Text onPress={() => { setSelectedMessage(e.item.message); setModalMessage(true); }} style={{ color: "blue", textDecorationLine: "underline" }}> See More </Text>
              </Text>
            ) : (
              <Text style={{ flex: 1, color: '#555' }}> {e.item.message} </Text>
            )}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 10, }} >
            <TouchableOpacity
              onPress={() => acceptAppointment(e.item.id)}
              style={{
                backgroundColor: "#4CAF50",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }} > Accept </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRejectAppointmentID(e.item.id); }} style={{ backgroundColor: "#F44336", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, }} >
              <Text style={{ color: "white", fontWeight: "600" }} > Reject </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ textAlign: "right", color: "#2c2c2cff", fontSize: 10, }} >
            {`Created at : ${new Date(e.item.created_at || 0).toLocaleString()}`}
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
      minWidth: isMobile ? "100%" : 200,
      padding: 16,
      backgroundColor: "#ffffffff",
      borderRadius: 8,
      height: isMobile ? null : 400,
    }}
  >
    <Text
      style={{
        alignSelf: "center",
        fontWeight: "bold",
        fontSize: 24,
        color: '#00505cff',
        marginBottom: 10,
      }}
    >
     Appointment History
    </Text>

    <FlatList
      data={isMobile ? (appointmentsPast ?? []).slice(0, 3) : (appointmentsPast ?? [])}
      keyExtractor={(e) => e.id}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      contentContainerStyle={{
        gap: 10,
        flexGrow: 1,
        paddingBottom: 20,
        alignItems: (appointmentsPast?.length ?? 0) === 0 ? "center" : "stretch",
      }}
      renderItem={(e) => (
        <View
          style={{
            width: "100%",
            gap: 5,
            paddingHorizontal: 20,
            paddingVertical: 15,
            backgroundColor: e.item.isAccepted ? "#e4ffe0ff" : "#ffe0e0ff",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>Patient's Name :</Text>
          <Text>{`${e.item.profiles.first_name} ${e.item.profiles.last_name}`}</Text>

          <Text style={{ fontWeight: "bold" }}>Date & Time:</Text>
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
              backgroundColor: !e.item.isAccepted ? "#fff3f3" : "#e9fdecff",
              borderWidth: 1,
              borderColor: !e.item.isAccepted ? "#ffcccc" : "#b6e4beff",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>Message :</Text>
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

          <Text style={{ fontWeight: "bold" }}>Status :</Text>
          <Text>
            {e.item.isAccepted
              ? "Accepted"
              : e.item.isAccepted === false
              ? "Rejected"
              : "Rejected : - past due -"}
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
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Rejection Message :
              </Text>
              <Text>{e.item.rejection_note || "No rejection note"}</Text>
            </View>
          )}

          <Text style={{ fontWeight: "bold" }}>Attendance :</Text>
          <Text style={{ flex: 1 }}>
            {e.item.isAttended === true
              ? "Attended"
              : e.item.isAttended === false
              ? "Not Attended"
              : "Not Attended"}
          </Text>

          {e.item.isAccepted === true && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 10,
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => openOutcomeModal(e.item.id)}
                style={{
                  backgroundColor: "#4CAF50",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Attended</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => notAttendedAppointment(e.item.id)}
                style={{
                  backgroundColor: "#F44336",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Not Attended
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text
            style={{
              textAlign: "right",
              color: "#2c2c2cff",
              fontSize: 10,
            }}
          >
            {`Created at : ${new Date(e.item.created_at || 0).toLocaleString()}`}
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

        {/* Dashboard Schedule --------------------------------------------------------------------------------------- */}

{dashboardView === "schedule" && (
  <View
    style={[
      styles.dashboard,
      {
        flex: 1,
        width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
        right: dashboardView === "schedule" ? 11 : 20000,
      },
    ]}
  >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          alignSelf: isMobile ? "center" : "flex-start",
          color: '#00505cff',
          textAlign: isMobile ? "center" : "left",
        }}
      >
        Clinic's Schedule &
      </Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          alignSelf: isMobile ? "center" : "flex-start",
          color: '#00505cff',
          textAlign: isMobile ? "center" : "left",
        }}
      >
        Dentist's Schedule
      </Text>

      <View
        style={{
          flex: 1,
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {/* Schedule Section */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 12,
            // optional shadow/elevation for card look
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {!!verified ? (
            <WeekScheduleEditor
              clinicId={session?.user.id}
              onSave={() => setShowWeeklySchedule(false)}
              style={{ flex: 1 }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 10,
                backgroundColor: "#f7f7f7",
                borderRadius: 16,
                marginTop: -10,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "bold",
                  marginBottom: 20,
                  color: "#003f30ff",
                  textAlign: "center",
                }}
              >
                VERIFY YOUR CLINIC TO CREATE A SCHEDULE
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#444",
                  marginBottom: 20,
                  lineHeight: 22,
                  textAlign: "center",
                }}
              >
                Verified clinics build more trust with patients. When your clinic is
                verified:
                {"\n"}• Patients are able to create an appointment.
                {"\n"}• You can set your clinic's operating hours and location.
                {"\n"}• Your clinic is highlighted as trustworthy and authentic.
              </Text>

              <TouchableOpacity
                onPress={() => setDashboardView("verify")}
                style={{
                  backgroundColor: "#00796b",
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 8,
                  alignSelf: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  Go to Verification
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dentists Section (only if verified) */}
{verified && (
  <View
    style={{
      flex: 1,
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      // Important: add height or flex for ScrollView to work properly
      height: "100%", // or any fixed height you want
    }}
  >
    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15, color: '#00505cff', }} > Dentists & Schedule </Text>
    <Text
      style={{
        fontSize: 16,
        marginBottom: 15,
        color: "black",
      }}
    >
      Dentists may extend their working hours beyond the clinic’s standard schedule based on patient needs or personal availability.
    </Text>

    {/* Schedule Editor */}
    {openScheduleForIndex !== null && (
      <DentistScheduleEditor
        dentists={dentistList}
        setDentists={setDentistList}
        saveDentists={saveDentists}
        initialSelectedDentistIndex={openScheduleForIndex}
        onBack={() => setOpenScheduleForIndex(null)}
      />
    )}

    {/* Only show below if schedule editor is not open */}
    {openScheduleForIndex === null && (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }} // Space for fixed button
        nestedScrollEnabled={true}
      >
        {/* Input Fields and Add Button */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 20,
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <TextInput
            placeholder="Dentist's Firstname Lastname"
            placeholderTextColor={"#ccc"}
            value={newDentistName}
            onChangeText={setNewDentistName}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              backgroundColor: "#fff",
            }}
            maxLength={50}
          />
          <TextInput
            placeholder="Specialization / General Dentist"
            placeholderTextColor={"#ccc"}
            value={newSpecialization}
            onChangeText={setNewSpecialization}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 6,
              backgroundColor: "#fff",
            }}
            maxLength={50}
          />
          <TouchableOpacity
            onPress={addDentist}
            style={{
              backgroundColor: '#00505cff',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Add Dentist
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Dentists List */}
        <View
          style={{
            backgroundColor: "#f1f5f9",
            padding: 20,
            borderRadius: 8,
            height: "100%",
            marginBottom: 20,
          }}
        >
          <ScrollView>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 15,
              color: '#00505cff',
            }}
          >
            Current Dentists:
          </Text>

          {dentistList.length > 0 ? (
            dentistList.map(({ name, specialty }, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 15,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  marginRight: 10,
                }}
              >
                <Feather onPress={() => setOpenScheduleForIndex(i)} name="edit" size={20} color="#00505cff" style={{ marginRight: 6 } } />
                <Text style={{ fontSize: 16 }}>
                  Dr. {name} ({specialty})
                </Text>
              </View>

                <TouchableOpacity
                  onPress={() => {
                    setDentistToRemoveIndex(i);
                    setRemoveDentistConfirmModalVisible(true);
                  }}
                  style={{
                    marginLeft: 10,
                    backgroundColor: "#ff4444",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#999" }}>
              - dentists have not yet been set -
            </Text>
          )}
          </ScrollView>
      {/* 🔒 Fixed Reset Button */}
      <View
        style={{
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => setResetDentistConfirmModalVisible(true)}
          style={{
            backgroundColor: '#b32020ff',
            paddingVertical: 12,
            paddingHorizontal: 10,
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Reset Dentists
          </Text>
        </TouchableOpacity>
      </View>
        </View>
      </ScrollView>
    </View>
    )}
  </View>
)}

      </View>
    </ScrollView>
  </View>
)}




<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={limitReachedDentistModalVisible} onBackdropPress={() => setLimitReachedDentistModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 

    <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 8, width: '80%' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Limit Reached</Text>
      <Text style={{ marginBottom: 20 }}>
        You can only add up to 10 dentists.
      </Text>
      <TouchableOpacity
        onPress={() => setLimitReachedDentistModalVisible(false)}
        style={{
          backgroundColor: '#003f30ff',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 6,
          alignSelf: 'flex-end',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
      </TouchableOpacity>
    </View>
</Modal>

<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={removeDentistConfirmModalVisible} onBackdropPress={() => setRemoveDentistConfirmModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 8, width: '80%' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Confirm Removal</Text>
      <Text style={{ marginBottom: 20 }}>
        Are you sure you want to remove this dentist?
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          onPress={() => setRemoveDentistConfirmModalVisible(false)}
          style={{
            marginRight: 10,
            backgroundColor: '#ccc',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmRemoveDentist}
          style={{
            backgroundColor: '#ff4444',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
</Modal>

<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={resetDentistConfirmModalVisible} onBackdropPress={() => setResetDentistConfirmModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 8, width: '80%' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Reset Dentists</Text>
      <Text style={{ marginBottom: 20 }}>
        This will remove all dentists from your clinic. Are you sure?
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          onPress={() => setResetDentistConfirmModalVisible(false)}
          style={{
            marginRight: 10,
            backgroundColor: '#ccc',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmResetDentists}
          style={{
            backgroundColor: '#ff4444',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
</Modal>

<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={emptyDentistWarningModalVisible} onBackdropPress={() => setEmptyDentistWarningModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
  <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 8, width: '80%' }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Empty Fields</Text>
    <Text style={{ marginBottom: 20 }}>
      Both the dentist's name and specialization are required.
    </Text>
    <TouchableOpacity
      onPress={() => setEmptyDentistWarningModalVisible(false)}
      style={{
        backgroundColor: '#003f30ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        alignSelf: 'flex-end',
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
    </TouchableOpacity>
  </View>
</Modal>


        {/* Dashboard Offers --------------------------------------------------------------------------------------- */}

        {dashboardView === 'offers' && (
          <View
            style={[
              styles.dashboard,
              {
                width: !isDesktop ? '95%' : expanded ? '80%' : '95%',
                right: dashboardView === 'offers' ? 11 : 20000,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 20,
                alignSelf: isMobile ? 'center' : 'flex-start',
                color: '#00505cff',
              }}
            >
              Offers
            </Text>

            {/* Always-visible TextInput + Add Offer button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <TextInput
                value={newOfferText}
                onChangeText={setNewOfferText}
                placeholder="Enter a new offer..."
                maxLength={50}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  marginRight: 10,
                }}
              />
              <TouchableOpacity
                onPress={async () => {
                  const trimmed = newOfferText.trim();
                  if (trimmed === '') {
                    setEmptyOfferWarningVisible(true);
                    return;
                  }

                  // Check max limit
                  if (offerList.length >= 10) {
                    setLimitReachedModalVisible(true);
                    return;
                  }

                  // Check duplicates (case-insensitive)
                  const duplicate = offerList.some(
                    (offer) => offer.toLowerCase() === trimmed.toLowerCase()
                  );
                  if (duplicate) {
                    Alert.alert('Duplicate Offer', 'This offer already exists.');
                    return;
                  }

                  const updatedOfferList = [...offerList, trimmed];
                  setOfferList(updatedOfferList);

                  try {
                    if (!session?.user) throw new Error('User not authenticated');
                    const combinedOffers = updatedOfferList.join('?');

                    const { error } = await supabase
                      .from('clinic_profiles')
                      .update({ offers: combinedOffers })
                      .eq('id', session.user.id);

                    if (error) throw error;

                    Alert.alert('Success', 'Offer added and saved.');
                    setNewOfferText('');
                    setIsSaved(true);
                    setOffers(combinedOffers);
                  } catch (err: any) {
                    console.error(err);
                    Alert.alert('Error', err.message || 'Could not save offer.');
                  }
                }}
                style={{
                  backgroundColor: '#00505cff',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Offer</Text>
              </TouchableOpacity>
            </View>

            {/* Current offers section */}
            <ScrollView>
              <View
                style={{
                  padding: 20,
                  backgroundColor: '#ffffffff',
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 20,
                    alignSelf: isMobile ? 'center' : 'flex-start',
                    color: '#00505cff',
                  }}
                >
                  Current offers :
                </Text>

                {offers && offers.trim() !== '' ? (
                  offers
                    .split('?')
                    .filter((offer) => offer.trim() !== '')
                    .map((offer, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: '#f0f0f0',   // light gray background
                          borderRadius: 8,
                          padding: 15,
                          marginBottom: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2, // for Android shadow
                        }}
                      >
                        <Text style={{ fontSize: 16, flex: 1, marginRight: 10 }}>
                          • {offer}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setOfferToRemoveIndex(i);  // store which offer to remove
                            setRemoveConfirmModalVisible(true);
                          }}
                          style={{
                            marginLeft: 10,
                            backgroundColor: '#ff4444',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                ) : (
                  <Text style={{ fontSize: 16, color: '#999' }}>
                    - offers have not yet been set -
                  </Text>
                )}

              </View>
            </ScrollView>
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setResetConfirmModalVisible(true)}
                style={{
                  backgroundColor: "#ff4444",
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                  Reset Offers
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={duplicateDentistModalVisible} onBackdropPress={() => setDuplicateDentistModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View style={{
      backgroundColor: 'white',
      padding: 25,
      borderRadius: 10,
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Duplicate Dentist
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
        This dentist with the same name already exists.
      </Text>
      <TouchableOpacity
        onPress={() => setDuplicateDentistModalVisible(false)}
        style={{
          backgroundColor: '#003f30ff',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Okay</Text>
      </TouchableOpacity>
    </View>

</Modal>


<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={resetConfirmModalVisible} onBackdropPress={() => setResetConfirmModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View style={{
      backgroundColor: "white",
      padding: 20,
      borderRadius: 8,
      width: "80%",
      alignItems: "center",
    }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: "center" }}>
        Are you sure you want to reset all offers?
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        <TouchableOpacity
          onPress={() => setResetConfirmModalVisible(false)}
          style={{
            backgroundColor: "#aaa",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
            marginRight: 10,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResetOffers}
          style={{
            backgroundColor: "#ff4444",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 6,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Yes, Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
</Modal>


<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={emptyOfferWarningVisible} onBackdropPress={() => setEmptyOfferWarningVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 

    <View style={{
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Please enter an offer before adding.</Text>
      <TouchableOpacity
        onPress={() => setEmptyOfferWarningVisible(false)}
        style={{
          backgroundColor: '#003f30ff',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
      </TouchableOpacity>
    </View>

</Modal>

<Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={removeConfirmModalVisible} onBackdropPress={() => setRemoveConfirmModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
    <View
      style={{
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
        Confirm Removal
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Are you sure you want to remove this offer?
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        <TouchableOpacity
          onPress={() => setRemoveConfirmModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: '#ccc',
            paddingVertical: 10,
            borderRadius: 8,
            marginRight: 10,
            alignItems: 'center',
          }}
        >
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (offerToRemoveIndex === null) return;

            const newOfferList = [...offerList];
            newOfferList.splice(offerToRemoveIndex, 1);

            setOfferList(newOfferList);
            setRemoveConfirmModalVisible(false);

            try {
              if (!session?.user) throw new Error('User not authenticated');
              const combinedOffers = newOfferList.join('?');

              const { error } = await supabase
                .from('clinic_profiles')
                .update({ offers: combinedOffers })
                .eq('id', session.user.id);

              if (error) throw error;

              Alert.alert('Removed', 'Offer has been deleted.');
              setOffers(combinedOffers);
            } catch (err: any) {
              console.error(err);
              Alert.alert('Error', err.message || 'Failed to remove the offer.');
            }
          }}
          style={{
            flex: 1,
            backgroundColor: '#ff4444',
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
</Modal>


    {/* Reached Limit */}
    <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={limitReachedModalVisible} onBackdropPress={() => setLimitReachedModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 

        <View
          style={{
            width: isMobile ? "90%" : "40%",
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18, marginBottom: 20, fontWeight: 'bold', color: '#00505cff' }}>
            Limit Reached
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            You can only add up to 10 offers.
          </Text>
          <TouchableOpacity
            onPress={() => setLimitReachedModalVisible(false)}
            style={{
              backgroundColor: '#00505cff',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
          </TouchableOpacity>
        </View>
    </Modal>





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
      Analytics
    </Text>

    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 1. DESCRIPTIVE ANALYTICS - Overview Cards */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <MaterialIcons name="assessment" size={24} color="#00505cff" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#00505cff" }}>
            Descriptive Analytics - Overview
          </Text>
        </View>
        
        <View style={{ 
          flexDirection: isMobile ? "column" : "row", 
          flexWrap: "wrap", 
          gap: 15 
        }}>
          {(() => {
            const stats = getAppointmentStats();
            return [
              { label: "Total Appointments", value: stats.total, color: "#3498db", icon: "calendar" },
              { label: "Accepted", value: stats.accepted, color: "#2ecc71", icon: "check-circle" },
              { label: "Rejected", value: stats.rejected, color: "#e74c3c", icon: "times-circle" },
              { label: "Pending", value: stats.pending, color: "#f39c12", icon: "clock" },
              { label: "Attended", value: stats.attended, color: "#27ae60", icon: "user-check" },
              { label: "No-Shows", value: stats.notAttended, color: "#c0392b", icon: "user-times" },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flex: isMobile ? 1 : 0,
                  minWidth: isMobile ? "100%" : "30%",
                  backgroundColor: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  borderLeftWidth: 5,
                  borderLeftColor: item.color,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: "#7f8c8d", marginBottom: 8 }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 32, fontWeight: "bold", color: item.color }}>
                      {item.value}
                    </Text>
                  </View>
                  <FontAwesome5 name={item.icon} size={32} color={item.color} style={{ opacity: 0.3 }} />
                </View>
              </View>
            ));
          })()}
        </View>
      </View>

      {/* 2. DIAGNOSTIC ANALYTICS - Rejection Reasons */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <MaterialIcons name="search" size={24} color="#00505cff" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#00505cff" }}>
            Diagnostic Analytics - Why Appointments Failed
          </Text>
        </View>
        
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 15 }}>
            Top Rejection Reasons
          </Text>
          
          {(() => {
            const reasons = getRejectionReasons();
            return reasons.length > 0 ? (
              reasons.map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottomWidth: i < reasons.length - 1 ? 1 : 0,
                    borderBottomColor: "#ecf0f1",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <FontAwesome5 name="exclamation-circle" size={16} color="#e74c3c" style={{ marginRight: 10 }} />
                    <Text style={{ flex: 1, fontSize: 14, color: "#2c3e50" }}>
                      {item.reason.substring(0, 40)}...
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#e74c3c",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>{item.count}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", color: "#95a5a6" }}>No rejection data</Text>
            );
          })()}
        </View>
      </View>

      {/* 3. PREDICTIVE ANALYTICS - Monthly Trends */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <MaterialIcons name="trending-up" size={24} color="#00505cff" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#00505cff" }}>
            Predictive Analytics - Appointment Trends
          </Text>
        </View>
        
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 15 }}>
            Last 6 Months Activity
          </Text>
          
          {(() => {
            const trends = getMonthlyTrends();
            const maxCount = Math.max(...trends.map(t => t.count), 1);
            
            return trends.length > 0 ? (
              trends.map((item, i) => (
                <View key={i} style={{ marginBottom: 15 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 5,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="event" size={16} color="#3498db" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, color: "#2c3e50" }}>{item.month}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#3498db" }}>
                      {item.count}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#ecf0f1",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: "#3498db",
                      }}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", color: "#95a5a6" }}>No trend data</Text>
            );
          })()}
        </View>
      </View>

      {/* 4. PRESCRIPTIVE ANALYTICS - Recommendations */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <MaterialIcons name="lightbulb-outline" size={24} color="#00505cff" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#00505cff" }}>
            Prescriptive Analytics - Actionable Insights
          </Text>
        </View>
        
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 15 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
            <MaterialIcons name="access-time" size={20} color="#00505cff" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              Peak Appointment Hours
            </Text>
          </View>
          
          {(() => {
            const peakHours = getPeakHours();
            return peakHours.length > 0 ? (
              peakHours.map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    padding: 12,
                    backgroundColor: i === 0 ? "#fff3cd" : "#f8f9fa",
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: i === 0 ? "#ffc107" : "#6c757d",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {i === 0 && <MaterialIcons name="local-fire-department" size={18} color="#ffc107" style={{ marginRight: 6 }} />}
                    <Text style={{ fontSize: 14, fontWeight: i === 0 ? "bold" : "normal" }}>
                      {item.time}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#00505cff" }}>
                    {item.count} bookings
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", color: "#95a5a6" }}>No peak hour data</Text>
            );
          })()}
          
          <View
            style={{
              marginTop: 15,
              padding: 12,
              backgroundColor: "#e8f5e9",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <MaterialIcons name="info-outline" size={18} color="#2e7d32" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ fontSize: 14, color: "#2e7d32", flex: 1 }}>
              Recommendation: Consider adding more staff during peak hours to reduce wait times.
            </Text>
          </View>
        </View>

        {/* No-Show Rate Analysis */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
            <FontAwesome5 name="user-clock" size={18} color="#00505cff" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              No-Show Analysis
            </Text>
          </View>
          
          {(() => {
            const noShowData = getNoShowRate();
            const isHighRate = parseFloat(noShowData.rate) > 20;
            
            return (
              <View>
                <View style={{ alignItems: "center", marginBottom: 15 }}>
                  <Text style={{ fontSize: 48, fontWeight: "bold", color: isHighRate ? "#e74c3c" : "#27ae60" }}>
                    {noShowData.rate}%
                  </Text>
                  <Text style={{ fontSize: 14, color: "#7f8c8d" }}>
                    {noShowData.noShows} out of {noShowData.total} appointments
                  </Text>
                </View>
                
                <View
                  style={{
                    padding: 12,
                    backgroundColor: isHighRate ? "#ffebee" : "#e8f5e9",
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <MaterialIcons 
                    name={isHighRate ? "warning" : "check-circle"} 
                    size={18} 
                    color={isHighRate ? "#c62828" : "#2e7d32"} 
                    style={{ marginRight: 8, marginTop: 2 }} 
                  />
                  <Text style={{ fontSize: 14, color: isHighRate ? "#c62828" : "#2e7d32", flex: 1 }}>
                    {isHighRate
                      ? "High no-show rate detected. Consider implementing reminder SMS or stricter cancellation policies."
                      : "Good attendance rate! Keep up the reminder system."}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>
      </View>

      {/* 5. Popular Services Table */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <FontAwesome5 name="tooth" size={20} color="#00505cff" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#00505cff" }}>
            Most Requested Services
          </Text>
        </View>
        
        <View style={{ backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#00505cff",
              padding: 15,
            }}
          >
            <Text style={{ flex: 1, color: "#fff", fontWeight: "bold" }}>Service</Text>
            <Text style={{ width: 80, color: "#fff", fontWeight: "bold", textAlign: "right" }}>
              Requests
            </Text>
          </View>
          
          {(() => {
            const services = getPopularServices();
            return services.length > 0 ? (
              services.map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    padding: 15,
                    borderBottomWidth: i < services.length - 1 ? 1 : 0,
                    borderBottomColor: "#ecf0f1",
                    backgroundColor: i % 2 === 0 ? "#fff" : "#f8f9fa",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <FontAwesome5 name="check" size={12} color="#27ae60" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 14, textTransform: "capitalize" }}>
                      {item.service}
                    </Text>
                  </View>
                  <Text style={{ width: 80, fontSize: 14, fontWeight: "bold", textAlign: "right" }}>
                    {item.count}
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ padding: 20 }}>
                <Text style={{ textAlign: "center", color: "#95a5a6" }}>
                  No service data available
                </Text>
              </View>
            );
          })()}
        </View>
      </View>
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12 }}>
        {appointmentsCurrentList.length === 0 ? (
          <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
            <Text style={{ fontSize: 20, color: "gray" }}>
              - No Appointments -
            </Text>
          </View>
        ) : (
          appointmentsCurrentList.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#fff",
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
              {/* Patient with clickable clipboard */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", marginBottom: 6, color: '#555' }}>
                    Patient:
                  </Text>
                  <Text style={{color: '#000'}}> {`${item.profiles.first_name} ${item.profiles.last_name}`} </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // Fetch full patient data including history
                    openPatientHistory(item.patient_id, {
                      first_name: item.profiles.first_name,
                      last_name: item.profiles.last_name,
                    });
                  }}
                  style={{
                    backgroundColor: "#00505cff",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <FontAwesome5 name="clipboard-list" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
                
              {item.message === '' && 
                <> 
                  <Text style={{ fontWeight: "700", marginBottom: 6, color: '#555' }}> Message: </Text>
                  <Text style={{ marginBottom: 10 }}>
                    {item.message.length > 40 ? (
                      <>
                        {item.message.slice(0, 40)}...
                        <Text onPress={() => { setSelectedMessage(item.message); setModalMessage(true); }} style={{ color: "blue", textDecorationLine: "underline", }} > {" "} See More </Text>
                      </>
                    ) : (
                      item.message
                    )}
                  </Text>
                </>  
              }

              <Text style={{ fontWeight: "700", marginBottom: 6, color: '#555' }}> Request: </Text>
              <TouchableOpacity
                onPress={() => {
                  openRequestView(item.request);
                }}
              >
                <Text style={{ color: "blue", textDecorationLine: "underline", marginBottom: 10, }} > View Request </Text>
              </TouchableOpacity>

              <Text style={{ fontWeight: "700", marginBottom: 6, color: '#555' }}> Request Date & Time: </Text>
              <Text style={{ marginBottom: 10, color: '#000' }}>
                {new Date(item.date_time).toLocaleString(undefined, {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>

              <Text style={{ fontWeight: "700", marginBottom: 6, color: '#555' }}> Created At: </Text>
              <Text style={{color: '#000', marginBottom: 20}}>{new Date(item.created_at || 0).toLocaleString()}</Text>
              {/* <Text style={{color: 'black'}}>{item.clinic_profiles.email}</Text>
              <Text style={{color: 'black'}}>{item.profiles.email}</Text>
              <Text style={{color: 'black'}}>{item.id}</Text> */}
              <View style={{gap: 10}}>
                <RescheduleAppointment data={item} sender_email={item.clinic_profiles.email} receiver_email={item.profiles.email} />
                <CancelAppointment data={item} sender_email={item.clinic_profiles.email} receiver_email={item.profiles.email}/>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    ) : (
     <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, minWidth: 1100 }}>
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
                  alignItems: "center",
                }}
              >
                <Text style={{ width: 220, fontWeight: "bold", color: "#fff" }}>Patient</Text>
                <Text style={{ width: 200, fontWeight: "bold", color: "#fff" }}>Message</Text>
                <Text style={{ width: 160, fontWeight: "bold", color: "#fff" }}>Request</Text>
                <Text style={{ width: 220, fontWeight: "bold", color: "#fff" }}>Request Date & Time</Text>
                <Text style={{ width: 200, fontWeight: "bold", color: "#fff" }}>Created At</Text>
                <Text style={{ width: 180, fontWeight: "bold", color: "#fff" }}></Text>
              </View>
            )}
            renderItem={({ item, index }) => (
              <View
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderColor: "#ddd",
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                  alignItems: "center",
                }}
              >
                {/* Patient */}
                <View style={{ width: 220, flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() =>
                      openPatientHistory(item.patient_id, {
                        first_name: item.profiles.first_name,
                        last_name: item.profiles.last_name,
                      })
                    }
                    style={{
                      marginRight: 8,
                      padding: 6,
                      backgroundColor: "#00505cff",
                      borderRadius: 6,
                    }}
                  >
                    <FontAwesome5 name="clipboard-list" size={16} color="#fff" />
                  </TouchableOpacity>
                  <Text>{`${item.profiles.first_name} ${item.profiles.last_name}`}</Text>
                </View>

                {/* Message */}
                <Text style={{ width: 200 }}>
                  {item.message.length > 20 ? (
                    <>
                      {item.message.slice(0, 20) + "... "}
                      <Text
                        onPress={() => {
                          setSelectedMessage(item.message);
                          setModalMessage(true);
                        }}
                        style={{
                          color: "#1976d2",
                          textDecorationLine: "underline",
                        }}
                      >
                        See More
                      </Text>
                    </>
                  ) : (
                    item.message
                  )}
                </Text>

                {/* Request */}
                <TouchableOpacity
                  style={{ width: 160 }}
                  onPress={() => openRequestView(item.request)}
                >
                  <Text
                    style={{
                      color: "#1976d2",
                      textDecorationLine: "underline",
                      fontSize: 15,
                    }}
                  >
                    View Request
                  </Text>
                </TouchableOpacity>

                {/* Request Date & Time */}
                <Text style={{ width: 220, color: "#000" }}>
                  {new Date(item.date_time).toLocaleString(undefined, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>

                {/* Created At */}
                <Text style={{ width: 200 }}>
                  {new Date(item.created_at || 0).toLocaleString()}
                </Text>

                {/* Cancel */}
                <View style={{ width: 180, gap: 10}}>
                  <RescheduleAppointment 
                    data={item}
                    sender_email={item.clinic_profiles.email}
                    receiver_email={item.profiles.email}
                  />
                  <CancelAppointment
                    data={item}
                    sender_email={item.clinic_profiles.email}
                    receiver_email={item.profiles.email}
                  />
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  marginTop: 40,
                }}
              >
                <Text style={{ fontSize: 20, color: "gray" }}>- No Appointments -</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

    )}

    {/* Add the Patient History Modal Component */}
    <PatientHistoryModalComponent />
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
                  color: "#00505cff",
                }}
              >
                Requests
              </Text>

              {isMobile ? (
                // 📱 Mobile: cards vertical
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
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", marginBottom: 6, color: 'black' }}>Patient:</Text>
                          <Text style={{ color: 'black' }}>
                            {wrapText(
                              `${item.profiles.first_name} ${item.profiles.last_name}`,
                              40
                            )}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openPatientHistory(item.patient_id, {
                            first_name: item.profiles.first_name,
                            last_name: item.profiles.last_name,
                          })}
                          style={{
                            backgroundColor: "#00505cff",
                            padding: 10,
                            borderRadius: 8,
                          }}
                        >
                          <FontAwesome5 name="clipboard-list" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>

                        <Text style={{ fontWeight: "700", marginBottom: 6,  color: 'black'  }}>Request Date & Time:</Text>
                        <Text style={{ marginBottom: 10,  color: 'black'  }}>
                          {`${new Date(item.date_time).toLocaleString(undefined, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}`}
                        </Text>

                        <Text style={{ fontWeight: "700", marginBottom: 6,  color: 'black'  }}>Message:</Text>
                        <Text style={{ marginBottom: 10,  color: 'black'  }}>
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

                        <Text style={{ fontWeight: "700", marginBottom: 6,  color: 'black'  }}>Request:</Text>
                        <TouchableOpacity
                          onPress={() => openRequestView(item.request)}
                          style={{ marginBottom: 10 }}
                        >
                          <Text style={{ color: "blue", textDecorationLine: "underline",  color: 'black'  }}>
                            View Request
                          </Text>
                        </TouchableOpacity>

                        <Text style={{ fontWeight: "700", marginBottom: 6 ,  color: 'black' }}>Created At:</Text>
                        <Text style={{ marginBottom: 10 ,  color: 'black' }}>
                          {new Date(item.created_at || 0).toLocaleString()}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            gap: 12,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => acceptAppointment(item.id, item)}
                            style={{
                              backgroundColor: "#4CAF50",
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: "white", fontSize: 14, textAlign: "center", fontWeight: "600" }}>
                              Accept
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setRejectAppointmentID(item.id)}
                            style={{
                              backgroundColor: '#b32020ff',
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: "white", fontSize: 14, textAlign: "center", fontWeight: "600" }}>
                              Reject
                            </Text>
                          </TouchableOpacity>

                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              ) : (
                // 🖥 Desktop / Web: table view with improved visibility
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
                            gap: 16,
                          }}
                        >
                          <Text style={{ flex: 1, fontWeight: "bold"}}>
                            Patient
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "bold"}}>
                            Request Date & Time
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "bold"}}>
                            Message
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "bold"}}>
                            Request
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "bold"}}>
                            Created At
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "bold", textAlign: "center" }}>
                            Action
                          </Text>
                        </View>
                      )}
                      renderItem={({ item, index }) => (
                        <View
                          style={{
                            flexDirection: "row",
                            borderBottomWidth: 1,
                            borderColor: "#ddd",
                            paddingVertical: 18,
                            paddingHorizontal: 20,
                            backgroundColor: index % 2 === 0 ? "#fdf9e5" : "#fff",
                            gap: 16,
                          }}
                        >
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                          <TouchableOpacity
                            onPress={() => {
                              // Fetch full patient data including history
                              openPatientHistory(item.patient_id, {
                                first_name: item.profiles.first_name,
                                last_name: item.profiles.last_name,
                              });
                            }}
                            style={{
                              marginRight: 8,
                              padding: 6,
                              backgroundColor: "#00505cff",
                              borderRadius: 6,
                            }}
                          >
                            <FontAwesome5 name="clipboard-list" size={16} color="#fff" />
                          </TouchableOpacity>
                          <Text>{`${item.profiles.first_name} ${item.profiles.last_name}`}</Text>
                        </View>

                          {/* Date & Time */}
                          <Text style={{ flex: 1, color: "#333" }}>
                            {`${new Date(item.date_time).toLocaleString(undefined, {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}`}
                          </Text>

                          {/* Message */}
                          <Text style={{ flex: 1, color: "#333" }}>
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

                          {/* Request */}
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => openRequestView(item.request)}
                          >
                            <Text style={{ color: "#0056b3", textDecorationLine: "underline" }}>
                              View Request
                            </Text>
                          </TouchableOpacity>

                          {/* Created At */}
                          <Text style={{ flex: 1, color: "#333" }}>
                            {new Date(item.created_at || 0).toLocaleString()}
                          </Text>

                          {/* Action Buttons */}
                          <View
                            style={{
                              flex: 1,
                              flexDirection: "row",
                              justifyContent: "center",
                              gap: 8,
                            }}
                          >

                            <TouchableOpacity
                              onPress={() => acceptAppointment(item.id, item)}
                              style={{
                                backgroundColor: '#4CAF50',
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                                Accept
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setRejectAppointmentID(item.id)}
                              style={{
                                backgroundColor: '#b32020ff',
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                                Reject
                              </Text>
                            </TouchableOpacity>

                          </View>
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
              <PatientHistoryModalComponent />
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
                Appointment History
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
                    <View
                      style={{ width: "100%", alignItems: "center", marginTop: 40 }}
                    >
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
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Patient:</Text>
                          <Text>
                            {`${item.profiles.first_name} ${item.profiles.last_name}`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openPatientHistory(item.patient_id, {
                            first_name: item.profiles.first_name,
                            last_name: item.profiles.last_name,
                          })}
                          style={{
                            backgroundColor: "#00505cff",
                            padding: 10,
                            borderRadius: 8,
                          }}
                        >
                          <FontAwesome5 name="clipboard-list" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>

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
                                style={{ color: "blue", textDecorationLine: "underline" }}
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
                          <Text style={{ color: "blue", textDecorationLine: "underline" }}>
                            View Request
                          </Text>
                        </TouchableOpacity>

                        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Status:</Text>
                        <Text style={{ marginBottom: 10 }}>
                          {item.isAccepted ? "Accepted" : "Rejected"}
                        </Text>
                        
                        {item.rejection_note && 
                          <>  
                            <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                              Rejection Note:
                            </Text>
                            <Text style={{ marginBottom: 10 }}>
                              {item.isAccepted === false
                                ? item.rejection_note || "No rejection note"
                                : "-"}
                            </Text>
                          </>  
                        }

                        {item.outcome && 
                          <>  
                            <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                              Outcome:
                            </Text>
                            <Text style={{ marginBottom: 10, color: 'green' }}>
                              {item.outcome}
                            </Text>
                          </>  
                        }

                        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Created At:</Text>
                        <Text style={{ marginBottom: 10 }}>
                          {new Date(item.created_at || 0).toLocaleString()}
                        </Text>

                        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                          Attendance:
                        </Text>
                        <Text style={{ marginBottom: 10 }}>
                          {item.isAttended === true
                            ? "Attended"
                            : item.isAttended === false
                            ? "Not Attended"
                            : "Not Attended"}
                        </Text>

                        {item.isAccepted === true && (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-start",
                              gap: 12,
                            }}
                          >
                            <TouchableOpacity
                             onPress={() => openOutcomeModal(item.id)}
                              style={{
                                backgroundColor: "#4CAF50",
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "white",
                                  fontSize: 14,
                                  textAlign: "center",
                                  fontWeight: "600",
                                }}
                              >
                                Attended
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => notAttendedAppointment(item.id)}
                              style={{
                                backgroundColor: "#b32020ff",
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "white",
                                  fontSize: 14,
                                  textAlign: "center",
                                  fontWeight: "600",
                                }}
                              >
                                Not Attended
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
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
                          <Text style={{ flex: 1, fontWeight: "700" }}>Patient</Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>
                            Request Date & Time
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>Message</Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>Request</Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>Status</Text>
                          
                          <Text style={{ flex: 1, fontWeight: "700" }}>Rejection Note</Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>Created At</Text>
                          <Text style={{ flex: 1, fontWeight: "700", textAlign: "center" }}>
                            Attendance
                          </Text>
                          <Text style={{ flex: 1, fontWeight: "700" }}>Outcome</Text>
                          <Text style={{ flex: 1, fontWeight: "700", textAlign: "center" }}>
                            Actions
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
                            backgroundColor: item.isAccepted ? "#e4ffe0" : "#ffe0e0",
                            gap: 16,
                            alignItems: "center",
                            minWidth: "100%",
                          }}
                        >
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                          <TouchableOpacity
                            onPress={() => {
                              // Fetch full patient data including history
                              openPatientHistory(item.patient_id, {
                                first_name: item.profiles.first_name,
                                last_name: item.profiles.last_name,
                              });
                            }}
                            style={{
                              marginRight: 8,
                              padding: 6,
                              backgroundColor: "#00505cff",
                              borderRadius: 6,
                            }}
                          >
                            <FontAwesome5 name="clipboard-list" size={16} color="#fff" />
                          </TouchableOpacity>
                          <Text>{`${item.profiles.first_name} ${item.profiles.last_name}`}</Text>
                        </View>

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
                          <Text style={{ flex: 1, color: "#333" }}>
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

                          {/* Request */}
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => openRequestView(item.request)}
                          >
                            <Text
                              style={{ color: "#0056b3", textDecorationLine: "underline" }}
                            >
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
                              ? item.rejection_note || "No rejection note"
                              : "-"}
                          </Text>

                          {/* Created At */}
                          <Text style={{ flex: 1, color: "#333" }}>
                            {new Date(item.created_at || 0).toLocaleString()}
                          </Text>

                          {/* Attendance */}
                          <Text style={{ flex: 1, color: "#333", textAlign: "center" }}>
                            {item.isAttended === true
                              ? "Attended"
                              : item.isAttended === false
                              ? "Not Attended"
                              : "Not Attended"}
                          </Text>

                            {/* Outcome */}
                          <Text style={{ flex: 1, color: "#333" }}>
                            {item.outcome}
                          </Text>

                          {/* Actions */}
                          <View
                            style={{
                              flex: 1,
                              flexDirection: "row",
                              justifyContent: "center",
                              gap: 12,
                            }}
                          >
                            {item.isAccepted === true && (
                              <>
                                <TouchableOpacity
                                 onPress={() => openOutcomeModal(item.id)}
                                  style={{
                                    backgroundColor: "#4CAF50",
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{ color: "white", fontWeight: "600", fontSize: 8 }}
                                  >
                                    Attendend
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => notAttendedAppointment(item.id)}
                                  style={{
                                    backgroundColor: "#b32020ff",
                                    paddingVertical: 8,
                                    paddingHorizontal: 14,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{ color: "white", fontWeight: "600", fontSize: 8 }}
                                  >
                                    Not Attended
                                  </Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      )}
                      ListEmptyComponent={() => (
                        <View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
                          <Text style={{ fontSize: 20, color: "gray" }}>- No History -</Text>
                        </View>
                      )}
                    />
                  </View>
                </ScrollView>
              )}
              <PatientHistoryModalComponent />
            </View>
          )}

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
          <ChatView role="clinic"/>
        </View>
        )}

        {/* Dashboard verification --------------------------------------------------------------------------------------- */}

        {dashboardView === "verify" && (
          <View
            style={[
              styles.dashboard,
              {
                width: !isDesktop ? "95%" : expanded ? "80%" : "95%",
                right: dashboardView === "verify" ? 11 : 20000,
                padding: 20,
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
              Verification
            </Text>

            {/* Introduction Section */}
            <View style={{justifyContent: "center", alignItems: "center", flex: 1, padding: 10, backgroundColor: "#f7f7f7ff", borderRadius: 16, marginTop: -10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,}}>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "bold",
                  marginBottom: 20,
                  alignSelf: "center",
                  justifyContent: "center",
                  color: "#00505cff",
                }}
              >
                VERIFY YOUR CLINIC!
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#444",
                  marginBottom: 20,
                  lineHeight: 22,
                }}
              >
                Verified clinics build more trust with patients. When your clinic is verified:
                {"\n"}• Patients are able to create an appointment.
                {"\n"}• You can set your clinic's operating hours and location.
                {"\n"}• Your clinic is highlighted as trustworthy and authentic.
              </Text>

              {/* Upload Area */}
              {/* Upload Area */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  padding: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !!verified ? "#edffe8ff" : !!requestVerification ? "#fffde8ff" : "#f9f9f9",
                  marginBottom: 20,
                }}
              >
                {!!verified && (
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#003f30ff", textAlign: "center"  }}>
                    Your Clinic is Verified
                  </Text>
                )}
                {!!requestVerification && (
                  <Text style={{ color: "#666", textAlign: "center"  }}>
                    Your verification request is pending. Please wait for admin approval. Thank you!
                  </Text>
                )}
                {!verified && !requestVerification && (
                  <Text style={{ marginBottom: 10, color: "#666", textAlign: "center"  }}>
                    Optional: Please Upload DTI Permit (Image or PDF).
                  </Text>
                )}

                  {!!verifyPhoto && (
                    <View style={{ alignItems: "center", marginBottom: 15 }}>
                      {isVerifyPhotoPDF ? (
                        <View style={{ alignItems: "center" }}>
                          <FontAwesome5 name="file-pdf" size={80} color="#d32f2f" />
                          <Text style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
                            PDF File Selected
                          </Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: typeof verifyPhoto === 'object' ? verifyPhoto.uri : verifyPhoto }}
                          style={{ width: 200, height: 150, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  )}

                  {/* Upload and Cancel Buttons */}
              {!verified && !requestVerification && (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      handlePickVerifyPhoto(); // Existing logic to pick a photo
                    }}
                    style={{
                      backgroundColor: "#e0f2f1",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "#00796b" }}>
                      {!!verifyPhoto ? "Change File" : "Upload File"}
                    </Text>
                  </TouchableOpacity>

                  {/* Cancel/Remove Button */}
                  {!!verifyPhoto && (
                    <TouchableOpacity
                      onPress={() => {
                        setVerifyPhoto(null);
                        setIsVerifyPhotoPDF(false);
                      }}
                      style={{
                        backgroundColor: "#ffebee",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                      }}
                    >
                      <Text style={{ color: "#c62828" }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                )}
              </View>

              {denialReason ? (
                <Text style={{ color: "red", marginBottom: 10, marginTop: -2, textAlign: "center" }}>
                  Your clinic has been denied.
                  {"\n"}Reason: {denialReason}
                </Text>
              ) : null}

              {/* Verify Button */}
              {!verified && !requestVerification && (
                <TouchableOpacity
                  onPress={() => setShowVerifyModal(true)}
                  style={{
                    backgroundColor: "#00796b",
                    paddingVertical: 12,
                    paddingHorizontal: 30,
                    borderRadius: 8,
                    alignSelf: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>Verify</Text>
                </TouchableOpacity>
              )}

                <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={showVerifyModal} onBackdropPress={() => setShowVerifyModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 
                    <View
                      style={{
                        backgroundColor: "white",
                        borderRadius: 10,
                        padding: 20,
                        width: isMobile ? "90%" : "40%",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          marginBottom: 10,
                          textAlign: "center",
                          color: '#00505cff'
                        }}
                      >
                        Do you want to verify your clinic?
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          marginTop: 20,
                          gap: 20,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => setShowVerifyModal(false)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 20,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: "#00796b",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <Text style={{ color: "#00796b" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={async () => {
                            if (!verifyPhoto) {
                              setShowVerifyModal(false);
                              setNeedDTIModal(true); // Show the custom modal instead
                              return;
                            }

                            setShowVerifyModal(false);
                            setRequestVerification(true);
                            setDenialReason("");

                            handleVerificationSubmit();

                            const { error } = await supabase
                              .from("clinic_profiles")
                              .update({ 
                                request_verification: true,
                                denied_verification_reason: null,
                                license_photo_url: verifyPhoto.uri || verifyPhoto,
                              })
                              .eq("id", session?.user.id);

                            if (error) {
                              console.error("Failed to request verification:", error.message);
                            }
                          }}

                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 20,
                            borderRadius: 6,
                            backgroundColor: "#00796b",
                          }}
                        >
                          <Text style={{ color: "#fff" }}>Verify</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                </Modal>
                        <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={needDTIModal} onBackdropPress={() => setNeedDTIModal(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 

                            <View
                              style={{
                                backgroundColor: "white",
                                borderRadius: 10,
                                padding: 20,
                                width: isMobile ? "90%" : "40%",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 18,
                                  fontWeight: "bold",
                                  marginBottom: 10,
                                  textAlign: "center",
                                  color: "#00505cff"
                                }}
                              >
                                Upload Required
                              </Text>

                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#555",
                                  textAlign: "center",
                                  marginBottom: 20,
                                }}
                              >
                                You must upload a valid photo of your DTI/Business Permit before verifying your clinic.
                              </Text>

                              <TouchableOpacity
                                onPress={() => setNeedDTIModal(false)}
                                style={{
                                  paddingVertical: 10,
                                  paddingHorizontal: 20,
                                  borderRadius: 6,
                                  backgroundColor: "#00796b",
                                }}
                              >
                                <Text style={{ color: "#fff" }}>Okay</Text>
                              </TouchableOpacity>
                            </View>
                        </Modal>
            </View>
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
          marginBottom: 10,
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
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • Streamline Dental Appointment Scheduling
          </Text>
          <Text
            style={{ fontSize: 12, color: "#555", marginBottom: 10 }}
          >
            Provide a seamless, user-friendly platform for patients to book,
            reschedule, and cancel appointments anytime, anywhere.
          </Text>

          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • Improve Patient Experience Through Accessible Services
          </Text>
          <Text
            style={{ fontSize: 12, color: "#555", marginBottom: 10 }}
          >
            Instant booking, reminders, and access to records help patients
            save time and reduce wait times.
          </Text>

          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • AR Tools for Patient Engagement
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
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
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • Finding the Right Clinic Near You
          </Text>
          <Text
            style={{ fontSize: 12, color: "#555", marginBottom: 10 }}
          >
            Browse trusted clinics in San Jose Del Monte Bulacan with full
            profiles, services, and schedules.
          </Text>

          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • Common Dental Concerns, Easy Solutions
          </Text>
          <Text
            style={{ fontSize: 12, color: "#555", marginBottom: 10 }}
          >
            From toothaches to check-ups, our hub addresses common oral
            health needs.
          </Text>

          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#00796b" }}
          >
            • Book Your Appointment Online
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
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
          
         <Modal  animationIn="fadeIn" animationOut="fadeOut" isVisible={outcomeModalVisible} onBackdropPress={() => setOutcomeModalVisible(false)} backdropColor="#000" backdropOpacity={0.1} style={{alignItems: "center", justifyContent: "center"}}> 

            <View
              style={{
                backgroundColor: "white",
                width: "90%",
                padding: 20,
                borderRadius: 16,
                maxHeight: "80%",
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                textAlign: "center"
              }}>
                Appointment Outcome
              </Text>
              <Text style={{color: 'red'}}>*Required</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 100,
                  textAlignVertical: "top",
                  marginBottom: 16
                }}
                placeholder="Enter outcome message..."
                value={outcomeMessage}
                onChangeText={setOutcomeMessage}
                multiline
                numberOfLines={4}
              />
              
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  onPress={() => {
                    setOutcomeModalVisible(false);
                    setOutcomeMessage("");
                    setSelectedAppointmentId(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#ccc",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginRight: 8
                  }}
                >
                  <Text style={{
                    color: "#333",
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    if (outcomeMessage.trim() === "") {
                      Alert.alert("Required", "Please enter an outcome message");
                      return;
                    }
                    if (selectedAppointmentId) {
                      attendedAppointment(selectedAppointmentId, outcomeMessage);
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#4CAF50",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginLeft: 8
                  }}
                >
                  <Text style={{
                    color: "white",
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          
        </Modal>

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
    width: '100%',   // <-- This makes it stretch full width of the parent
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 1,
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
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
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
