import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, useWindowDimensions, Image, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useSession } from '../../lib/SessionContext';  // Adjust path accordingly
import { Picker } from '@react-native-picker/picker';
import { FontAwesome } from '@expo/vector-icons';

  type ErrorsType = {
    clinicName?: string;
    mobileNumber?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    street?: string;
    barangay?: string;
    zipCode?: string;
  };


export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [clinicPhoto, setClinicPhoto] = useState<string | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  

  const { signUpClinic } = useSession();
  const [modalVisible, setModalVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [cityProvince, setCityProvince] = useState('City of San Jose del Monte, Bulacan');
  const [zipCode, setZipCode] = useState('');
  const [errors, setErrors] = useState<ErrorsType>({});

  const [barangayList, setBarangayList] = useState<
    { brgy: string; zip_code: string }[]
  >([]);
  const [selectedBarangay, setSelectedBarangay] = useState(barangay);



useEffect(() => {
  async function fetchBarangays() {
    const { data, error } = await supabase
      .from('barangay')
      .select('brgy, zip_code')
      .order('brgy', { ascending: true });

    if (error) {
      console.error('Error fetching barangays:', error);
      return;
    }

    setBarangayList(data);
  }

  fetchBarangays();
}, []);



  const pickClinicPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setClinicPhoto(result.assets[0].uri);
    }
  };

  const pickLicensePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLicensePhoto(result.assets[0].uri);
    }
  };

const validateForm = (): boolean => {
  const newErrors: ErrorsType = {};

  if (!clinicName?.trim()) {
    newErrors.clinicName = "Clinic name is required";
  }

  if (!mobileNumber?.trim()) {
    newErrors.mobileNumber = "Mobile number is required";
  } else if (!/^9\d{9}$/.test(mobileNumber)) {
    newErrors.mobileNumber = "Mobile number must be exactly 10 digits and start with 9";
  }

  if (!email?.trim()) {
    newErrors.email = "Email is required";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    newErrors.email = "Invalid email format";
  }

  if (!street?.trim()) {
    newErrors.street = "Street is required";
  }

  if (!barangay?.trim()) {
    newErrors.barangay = "Barangay is required";
  }

  if (!zipCode?.trim()) {
    newErrors.zipCode = "Zip code is required";
  } else if (!/^\d{4}$/.test(zipCode)) {
    newErrors.zipCode = "Zip code must be exactly 4 digits";
  } else if (zipCode !== "3023" && zipCode !== "3024") {
    newErrors.zipCode = "Zip code must be 3023 or 3024";
  }

  if (!password) {
    newErrors.password = "Password is required";
  } else if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)
  ) {
    newErrors.password =
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
  }

  if (!confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password";
  } else if (confirmPassword !== password) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const emailExists = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle(); // avoids throwing on "no rows"

  if (error) {
    console.error('Error checking email existence:', error.message);
    return false; // assume false on error, or handle as needed
  }

  return !!data;
};

const signUpHandler = async () => {
  if (!validateForm()) {
    return; // Don't proceed if validation fails
  }

  // Check if email already exists before signup
  const exists = await emailExists(email);
  if (exists) {
    alert("🚫 This email is already taken.");
    return;  // stop signup
  }

  try {
    let clinicPhotoUrl = null;
    let licensePhotoUrl = null;

    if (clinicPhoto) {
      clinicPhotoUrl = await uploadPhoto(clinicPhoto, 'clinic-photos');
    }

    if (licensePhoto) {
      licensePhotoUrl = await uploadPhoto(licensePhoto, 'license-photos');
    }

    const clinicProfile = {
      clinic_name: clinicName,
      mobile_number: mobileNumber.startsWith('0') ? mobileNumber : '0' + mobileNumber,
      address,
      clinic_photo_url: clinicPhotoUrl || undefined,
      license_photo_url: licensePhotoUrl || undefined,
    };

    const success = await signUpClinic(email, password, clinicProfile);

    if (success) {
      alert("✅ Clinic account created. Please verify your email to continue.");
      router.push('/login');
    }
  } catch (error: any) {
    Alert.alert('Signup failed', error.message || 'Unknown error');
  }
};

  // Upload image to Supabase Storage and return public URL
  const uploadPhoto = async (uri: string, folder: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // Get file extension (default to jpg if not found)
      const match = /\.(\w+)$/.exec(uri);
      const fileExt = match ? match[1] : 'jpg';

      // Unique filename in specified folder
      const fileName = `${folder}/${Date.now()}.${fileExt}`;

      // Upload to the correct folder
      const { data, error } = await supabase.storage.from('clinic-photos').upload(fileName, blob, {
        upsert: false,
      });

      if (error) {
        console.error('Photo upload error:', error);
        Alert.alert('Upload failed', 'Could not upload photo.');
        return null;
      }

      // Get public URL for uploaded file
      const { data: publicUrlData } = supabase.storage.from('clinic-photos').getPublicUrl(fileName);
      return publicUrlData.publicUrl || null;
    } catch (error) {
      console.error('Upload exception:', error);
      return null;
    }
  };

useEffect(() => {
  const fullAddress = `${street}, ${barangay}, ${cityProvince}, ${zipCode}`;
  setAddress(fullAddress);
}, [street, barangay, cityProvince, zipCode]);

return (
  <LinearGradient colors={['#80c4c4ff', '#009b84ff']} style={styles.container}>
    <View style={styles.container}>
      <View
        style={{
          ...styles.formBox,
          width: isMobile ? 360 : 900,
          height: isMobile ? 650 : 740,
          padding: 40,
        }}
      >
        <ScrollView style={{ flex: 1 }} automaticallyAdjustKeyboardInsets>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={{ position: 'absolute', top: 10, left: 0, zIndex: 10 }}
          >
            <Ionicons name="arrow-back" size={36} color="#00505cff" />
          </TouchableOpacity>

          {/* Logo & Titles */}
          <Image
            source={require('../../assets/favicon.ico.png')}
            style={styles.logo}
          />
          <Text style={styles.welcome}>SMILE STUDIO</Text>
          <Text
            style={{
              ...styles.welcome,
              fontSize: 15,
              marginTop: -10,
              fontWeight: '300',
              marginBottom: 20,
            }}
          >
            Grin Creators
          </Text>

          {/* Main Form Title */}
          <Text
            style={{
              ...styles.sectionHeader,
              fontSize: 21,
              borderBottomWidth: 2,
              marginTop: 32,
              marginBottom: 36,
            }}
          >
            CLINIC SIGN UP
          </Text>

          <View
            style={{
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0 : 24, // space between columns only on desktop
              marginBottom: 30,
            }}
          >
                      {/* Clinic Information Section */}
          <View style={{ marginBottom: 30, flex : 1 }}>
            <Text style={styles.sectionHeader}>Clinic Information</Text>

            {/* Clinic Name */}
            <Text style={[styles.label, { marginBottom: 4 }]}>*Clinic Name</Text>
            <TextInput
              style={[
                styles.input,
                errors.clinicName && { borderColor: 'red' },
                { marginBottom: 8 },
              ]}
              placeholder="e.g. Smile Studio"
              maxLength={40}
              placeholderTextColor="#555"
              value={clinicName}
              onChangeText={(text) => {
                setClinicName(text);
                if (errors.clinicName)
                  setErrors((prev) => ({ ...prev, clinicName: undefined }));
              }}
            />
            {errors.clinicName && (
              <Text style={styles.errorText}>{errors.clinicName}</Text>
            )}

            {/* Email */}
            <Text style={[styles.label, { marginBottom: 4 }]}>*Email</Text>
            <TextInput
              style={[
                styles.input,
                errors.email && { borderColor: 'red' },
                { marginBottom: 8 },
              ]}
              placeholder="e.g. clinic@example.com"
              placeholderTextColor="#555"
              maxLength={40}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}


            {/* Mobile Number */}
            <Text style={[styles.label, { marginBottom: 4 }]}>*Mobile Number</Text>

            <View
              style={[
                styles.input,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                },
                errors.mobileNumber && { borderColor: 'red' },
                { marginBottom: 8 },
              ]}
            >
              {/* Flag Icon */}
              <Image
                source={require('../../assets/Flag_of_the_Philippines.svg.png')} // Update this path if needed
                style={{ width: 24, height: 16, marginRight: 6 }}
                resizeMode="contain"
              />

              {/* +63 Prefix */}
              <Text style={{ fontSize: 16, color: '#000', marginRight: 6 }}>+63</Text>

              {/* Mobile Number Input */}
              <TextInput
                style={{ flex: 1, fontSize: 16, color: '#000' }}
                placeholder="9123456789"
                placeholderTextColor="#555"
                value={mobileNumber}
                keyboardType="phone-pad"
                maxLength={10} // since you want 10 digits excluding +63
                autoComplete="tel"
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/[^0-9]/g, '');
                  setMobileNumber(digitsOnly);
                  if (errors.mobileNumber)
                    setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                }}
              />
            </View>

            {errors.mobileNumber && (
              <Text style={styles.errorText}>{errors.mobileNumber}</Text>
            )}

            </View>

            {/* Clinic Location Section */}
            <View style={{ marginBottom: 30, flex : 1, marginTop: isMobile ? -60 : null  }}>
              <Text style={styles.sectionHeader}>Clinic Location</Text>

              {/* Street */}
              <Text style={[styles.label, { marginBottom: 4 }]}>*Street</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.street && { borderColor: 'red' },
                  { marginBottom: 8 },
                ]}
                placeholder="e.g. 123 Main St"
                placeholderTextColor="#555"
                maxLength={30}
                value={street}
                onChangeText={(text) => {
                  setStreet(text);
                  if (errors.street)
                    setErrors((prev) => ({ ...prev, street: undefined }));
                }}
              />
              {errors.street && (
                <Text style={styles.errorText}>{errors.street}</Text>
              )}

              {/* Barangay */}
              <Text style={[styles.label, { marginBottom: 4 }]}>*Barangay</Text>
<View
  style={[
    styles.pickerContainer,
    errors.barangay && { borderColor: 'red', borderWidth: 1 },
    { marginBottom: 8 },
  ]}
>
  <Picker
    selectedValue={selectedBarangay}
    style={{
      height: isMobile ? (Platform.OS === 'ios' ? 230 : 50) : 45,
      color: 'black',
      borderWidth: 0, // explicit: Picker has no visible border
    }}
    itemStyle={{ color: 'black', fontSize: 16 }}
    onValueChange={(itemValue, itemIndex) => {
      setSelectedBarangay(itemValue);
      setBarangay(itemValue);

      // Auto-set zip code based on selected barangay
      const matched = barangayList.find((b) => b.brgy === itemValue);
      if (matched) {
        setZipCode(matched.zip_code);
      } else {
        setZipCode('');
      }

      if (errors.barangay) {
        setErrors((prev) => ({ ...prev, barangay: undefined }));
      }
    }}
  >
    <Picker.Item label="Select Barangay" value="" />
    {barangayList.map((item) => (
      <Picker.Item key={item.brgy} label={item.brgy} value={item.brgy} />
    ))}
  </Picker>
</View>


              {errors.barangay && <Text style={styles.errorText}>{errors.barangay}</Text>}

              {/* City / Province */}
              <Text style={[styles.label, { marginBottom: 4 }]}>*City / Province</Text>
              <TextInput
                style={[
                  styles.input,
                ]}
                placeholder="e.g. Manila"
                placeholderTextColor="#555"
                value={cityProvince}
                readOnly
                onChangeText={(text) => {
                  setCityProvince(text);
                }}
              />

              {/* Zip Code */}
<Text style={[styles.label, { marginBottom: 4 }]}>*Zip Code</Text>
<TextInput
  style={[
    styles.input,
    { color: '#000', backgroundColor: '#fff' }, // force text color and bg
    errors.zipCode && { borderColor: 'red' },
    { marginBottom: 8 },
  ]}
  placeholder="Auto-filled from barangay"
  placeholderTextColor="#555"
  value={zipCode}
  editable={false}
  selectTextOnFocus={false}
/>
{errors.zipCode && (
  <Text style={styles.errorText}>{errors.zipCode}</Text>
)}


              {/* You can optionally show combined address here for user confirmation */}
              <Text style={{ marginTop: 10, fontStyle: 'italic', color: '#333' }}>
                Full Address: {address}
              </Text>
            </View>
          </View>

          {/* Password Setup Section */}
          <View style={{ marginBottom: 30, marginTop: isMobile ? 65 : null }}>
            <Text style={{ ...styles.sectionHeader }}>Set Password</Text>

            {/* Password */}
            <Text style={styles.label}>*Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0 },
                  errors.password && { borderColor: 'red' },
                ]}
                placeholder="Password"
                placeholderTextColor="#555"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Confirm Password */}
            <Text style={styles.label}>*Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0 },
                  errors.confirmPassword && { borderColor: 'red' },
                ]}
                placeholder="Confirm Password"
                placeholderTextColor="#555"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={{ ...styles.errorText, marginBottom: 20 }}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Terms Modal */}
          <Modal visible={modalVisible} animationType="fade" transparent={true}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: '#f1f5f9',
                  marginHorizontal: 20,
                  borderRadius: 10,
                  maxHeight: '80%',
                  padding: 20,
                  width: isMobile ? '80%' : '35%',
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    marginBottom: 15,
                    textAlign: 'center',
                    color: '#00505cff',
                  }}
                >
                  Terms of Use & Privacy Policy
                </Text>

                <ScrollView style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00505cff', marginBottom: 8 }}>
                    SMILE STUDIO – TERMS OF USE
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    Last Updated: May 8, 2025{'\n'}
                    Effective Immediately
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    By accessing or using Smile Studio: A Cross-Platform Dental Appointment System with AR Teeth and Braces Filter for Dental Patients in San Jose Del Monte, Bulacan, owned and operated by Scuba Scripter and Pixel Cowboy Team, you agree to be legally bound by these Terms of Use. These Terms govern your use of Smile Studio, a web-based and mobile system designed for managing dental appointments with notification-based follow-up reminders.
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    If you do not agree with any part of these Terms, you must immediately cease all use of the Platform. Continued access constitutes unconditional acceptance of these Terms and any future modifications.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>1. Definitions</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    • “Appointment” – A scheduled dental consultation booked through Smile Studio.{'\n'}
                    • “No-Show” – Failure to attend a booked Appointment without prior cancellation.{'\n'}
                    • “Grace Period” – A 15-minute window after a scheduled Appointment time during which a late arrival may still be accommodated.{'\n'}
                    • “Malicious Activity” – Any action that disrupts, exploits, or harms the Platform, its users, or affiliated clinics (e.g., hacking, fake bookings, harassment).
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>2. Eligibility & Account Registration</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    2.1 Age Requirement{'\n'}
                    The Platform is accessible to users of all ages but is currently intended for non-commercial, academic/capstone project use only.{'\n'}
                    Minors (under 18) must obtain parental/guardian consent before booking Appointments.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    2.2 Account Responsibility{'\n'}
                    Users must provide accurate, current, and complete information during registration. You are solely responsible for:{'\n'}
                    • Maintaining the confidentiality of your login credentials.{'\n'}
                    • All activities conducted under your account.{'\n'}
                    • Immediately notifying us of any unauthorized account use.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>3. Permitted & Prohibited Use</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    3.1 Acceptable Use{'\n'}
                    You may use Smile Studio only for lawful purposes, including:{'\n'}
                    • Booking legitimate dental Appointments at partner clinics in San Jose Del Monte, Bulacan.{'\n'}
                    • Accessing clinic information, availability, location, pricing, services, and notification assistance.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    3.2 Strictly Prohibited Conduct{'\n'}
                    Violations will result in immediate account suspension or termination. You agree NOT to:{'\n'}
                    • Create fake or duplicate Appointments (e.g., under false names).{'\n'}
                    • Engage in hacking, phishing, or data scraping (automated or manual).{'\n'}
                    • Harass clinic staff or other users (e.g., trolling, abusive messages).{'\n'}
                    • Upload malicious software (viruses, spyware) or disrupt server operations.{'\n'}
                    • Misrepresent your identity or medical needs.{'\n'}
                    • Circumvent appointment limits (e.g., creating multiple accounts).
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>4. Appointment Policies</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    4.1 Booking & Cancellation{'\n'}
                    • Appointments operate on a “First-Appoint, First-Served” basis.{'\n'}
                    • No downpayment is required (“Appoint Now, Pay Later”).{'\n'}
                    • Cancellations must be made at least 24 hours in advance via the Platform.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    4.2 No-Show & Late Arrival Policy{'\n'}
                    • Notification Reminders: Users receive automated alerts before their scheduled Appointment.{'\n'}
                    • Grace Period: A 15-minute late arrival window is permitted. After this:{'\n'}
                      • The Appointment is automatically forfeited.{'\n'}
                      • The slot is released to other patients.{'\n'}
                      • The User must reschedule.{'\n\n'}
                    Strike System:{'\n'}
                    • 1st No-Show = Warning (User is notified of policy violation).{'\n'}
                    • 2nd No-Show = 1-month Account Suspension.{'\n\n'}
                    Suspended accounts cannot book new Appointments but may still view clinic information.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    4.3 Clinic Cancellations{'\n'}
                    Partner clinics reserve the right to reschedule or cancel Appointments due to unforeseen circumstances such as dentist unavailability, equipment failure, or emergencies. Patients will be promptly notified via the Platform’s notification system.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>5. Medical Disclaimer & Patient Responsibilities</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    5.1 Non-Emergency Use{'\n'}
                    Smile Studio is not intended for medical emergencies. If you are experiencing severe pain, bleeding, infection, or urgent dental issues, please call 911 (Philippine hotline: 117) or proceed to the nearest hospital or emergency facility.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    5.2 Patient Honesty{'\n'}
                    Patients must provide truthful and complete medical information when booking and attending Appointments. This includes disclosing conditions such as allergies, current medications, pregnancy, or chronic illnesses. Failure to disclose relevant information may affect treatment safety and outcomes.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    5.3 AR Filter Disclaimer{'\n'}
                    The AR Teeth and Braces Filter is for illustrative and educational purposes only. It is not a substitute for professional dental advice or treatment planning. Actual outcomes and recommendations will depend on clinical assessment by a licensed dentist.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>6. Intellectual Property Rights</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    6.1 Ownership{'\n'}
                    All text, graphics, logos, clinic data, AR filters, and notification software are the exclusive property of Smile Studio and its partner clinics.{'\n'}
                    No commercial use (e.g., reselling clinic slots, redistributing data) is permitted.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    6.2 Limited License{'\n'}
                    Users are granted a revocable, non-exclusive license to access the Platform for personal, non-commercial healthcare purposes.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>7. Privacy & Data Security</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    Our Privacy Policy explains how we collect, store, and protect your data. By using the Platform, you agree to its terms.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    7.1 Confidentiality{'\n'}
                    All medical information shared during Appointments is protected under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    7.2 Data Retention{'\n'}
                    Patient data, including appointment records, is stored for a maximum of 12 months for reporting and scheduling purposes. After this period, data is securely deleted, in compliance with Philippine law.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>8. Disclaimers & Limitation of Liability</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    8.1 No Medical Guarantees{'\n'}
                    Smile Studio is not a healthcare provider. We do not guarantee diagnosis accuracy, treatment outcomes, or clinic availability.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    8.2 Platform “As Is”{'\n'}
                    The Platform may experience downtime, bugs, or delays.
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    8.3 No Financial Liability{'\n'}
                    We do not charge users and do not handle payments, medical services, or clinic operations.{'\n'}
                    We are not liable for:{'\n'}
                    • User misconduct (e.g., no-shows, fake bookings).{'\n'}
                    • Clinic errors (e.g., overbooking, misdiagnosis).{'\n'}
                    • Indirect damages (e.g., lost time, travel costs).
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>9. Feedback & Complaints</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    Users may provide feedback or file complaints regarding clinics, services, or system errors by contacting Smile Studio Support. Reports of unprofessional conduct by clinics or users will be reviewed, and appropriate action may include warnings, suspensions, or termination of accounts.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>10. Termination & Enforcement</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    10.1 By Smile Studio{'\n'}
                    We may suspend or terminate accounts for:{'\n'}
                    • Breach of these Terms (e.g., fake Appointments, harassment).{'\n'}
                    • Malicious Activity (e.g., hacking attempts).{'\n'}
                    • Excessive No-Shows (per Section 4.2).
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    10.2 By Users{'\n'}
                    You may deactivate your account at any time by contacting:{'\n'}
                    (+63) 921-888-1835
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>11. Governing Law & Dispute Resolution</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    These Terms are governed by Philippine law (Republic Act No. 10173, Data Privacy Act of 2012).{'\n'}
                    Disputes must first undergo mediation in San Jose Del Monte, Bulacan.{'\n'}
                    Unresolved disputes will be settled in Philippine courts.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>12. Contact Information</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    Smile Studio Support{'\n'}
                    Scuba Scripter and Pixel Cowboy Team{'\n'}
                    (+63) 921-888-1835{'\n'}
                    San Jose Del Monte, Bulacan, Philippines
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginTop: 20, marginBottom: 6 }}>Acknowledgment</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22 }}>
                    By creating an account or booking an Appointment through Smile Studio, you acknowledge that you have read, understood, and agreed to these Terms of Use.
                  </Text>

                  <View
                    style={{
                      borderBottomColor: '#00505cff', // light gray color
                      borderBottomWidth: 1,       // thickness of the line
                      marginVertical: 10,         // space above and below the line
                      paddingVertical: 40
                    }}
                  />
                  
                  {/* /////////////////////////////////////// */}

                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00505cff', marginBottom: 8 }}>
                    SMILE STUDIO – PRIVACY AND POLICY
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    Last Updated: May 8, 2025{'\n'}
                    Effective Immediately
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    This Privacy Policy explains how Smile Studio, owned and operated by Scuba Scripter and Pixel Cowboy Team, collects, uses, stores, and protects your information when you use our dental appointment system. We are committed to safeguarding your privacy in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
                  </Text>

                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    By creating an account, booking an appointment, or using any feature of Smile Studio, you agree to the practices described in this Privacy Policy.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>1. Information We Collect</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    1.1 Personal Information – Name, age/date of birth, contact details, address (Clinic only).{'\n'}
                    1.2 Appointment Information – Clinic/dentist selected, appointment date and time, booking history (including no-shows).{'\n'}
                    1.3 Health Information (if provided) – Allergies, pregnancy status, ongoing medications, dental concerns.{'\n'}
                    1.4 System Data – Login credentials, device/browser details, notifications and reminders sent.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>2. How We Use Your Information</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    We use the collected information to:{'\n'}
                    • Process and manage dental appointments.{'\n'}
                    • Send notifications and reminders about upcoming consultations.{'\n'}
                    • Notify you of cancellations, rescheduling, or clinic emergencies.{'\n'}
                    • Maintain records of booking activity (including no-shows).{'\n'}
                    • Improve Smile Studio’s system performance and user experience.{'\n'}
                    • Ensure compliance with applicable laws and regulations.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>3. Data Sharing & Disclosure</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    We do not sell or rent your personal information. Data may only be shared:{'\n'}
                    • With Partner Clinics – For confirming appointments, preparing consultations, and managing schedules.{'\n'}
                    • With Your Consent – For referrals or other services.{'\n'}
                    • As Required by Law – To comply with legal obligations.{'\n'}
                    • For System Protection – To prevent fraud, hacking, or malicious activity.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>4. Data Retention & Deletion</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    • Appointment records are stored for a maximum of 12 months for reporting and scheduling reference.{'\n'}
                    • Personal data is deleted once it is no longer needed for services.{'\n'}
                    • Users may request deletion of their account and data at any time by contacting Smile Studio Support.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>5. Data Security</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    We implement organizational, physical, and technical safeguards to protect your data, including:{'\n'}
                    • Password encryption and secured logins.{'\n'}
                    • Restricted access for authorized personnel only.{'\n'}
                    • Regular system monitoring to prevent breaches.{'\n\n'}
                    However, no online system can guarantee 100% security. You acknowledge that you use Smile Studio at your own risk.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>6. Children’s Privacy</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    Smile Studio is accessible to users under 18 only with parental/guardian consent. We do not knowingly collect or use personal data from minors without supervision.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>7. Patient Rights</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    Under RA 10173 (Data Privacy Act), you have the right to:{'\n'}
                    • Access the personal data we hold about you.{'\n'}
                    • Request corrections to inaccurate or outdated information.{'\n'}
                    • Request deletion of your account and associated data.{'\n'}
                    • Withdraw consent for the processing of your data.{'\n'}
                    • File a complaint with the National Privacy Commission (NPC).
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>8. AR Filter Disclaimer</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    The AR Teeth and Braces Filter is for illustration only and does not store or analyze facial recognition data. Images are not permanently saved unless explicitly uploaded by the user.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>9. Updates</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                    We may update this Privacy Policy to reflect changes in law, technology, or system improvements. Updates will be posted within the Platform with the “Last Updated” date. Continued use after updates indicates acceptance.
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginBottom: 6 }}>10. Contact Information</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 10 }}>
                    Smile Studio Support{'\n'}
                    Scuba Scripter and Pixel Cowboy Team{'\n'}
                    (+63) 921-888-1835{'\n'}
                    San Jose Del Monte, Bulacan, Philippines
                  </Text>

                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00505cff', marginTop: 20, marginBottom: 6 }}>Acknowledgment</Text>
                  <Text style={{ fontSize: 14, lineHeight: 22 }}>
                    By creating an account or booking through Smile Studio, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
                  </Text>
                </ScrollView>


                {/* Checkbox */}
      <TouchableOpacity
        onPress={() => setTermsAccepted((prev) => !prev)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
      >
        <View
          style={{
            height: 22,
            width: 22,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#888',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: termsAccepted ? '#f1f5f9' : '#fff',
          }}
        >
          {termsAccepted && (
            <FontAwesome name="check" size={14} color="#00505cff" />
          )}
        </View>
        <Text style={{ fontSize: 16 }}>I agree to the <Text style={{color: '#00505cff', fontWeight: 'bold'}}>Terms of Use</Text> and <Text style={{color: '#00505cff', fontWeight: 'bold'}}>Privacy Policy</Text>.</Text>
      </TouchableOpacity>

                {/* Modal Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setTermsAccepted(false)
                      setModalVisible(false)}}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 6,
                      marginRight: 10,
                      alignItems: 'center',
                      backgroundColor: '#00505cff',
                      justifyContent: 'center',
                      padding: isMobile ? 8 : null,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                      Reject Terms and Close
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (termsAccepted) {
                        signUpHandler();
                      }
                      setModalVisible(false);
                    }}
                    disabled={!termsAccepted}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 6,
                      marginLeft: 10,
                      alignItems: 'center',
                      backgroundColor: termsAccepted ? '#ffffffff' : '#ccc',
                      justifyContent: 'center',
                      padding: isMobile ? 8 : null,
                    }}
                  >
                    <Text style={{ color: '#00505cff', fontWeight: '600', textAlign: 'center' }}>
                      Accept Terms and Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>

        {/* Action Button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 16,
          }}
        >
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#00505cff' }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </LinearGradient>
);


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  formBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    height: 600,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    marginLeft: 4,
    fontSize: 16,
    color: '#1f5474ff',
    marginTop: 6,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  photoBox: {
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: 8,
    height: 150,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'rgba(16, 82, 51, 1)',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginTop: 50,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00505cff',
    alignSelf: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00505cff',   // matching the title's greenish tone
    marginBottom: -5,
    borderBottomColor: '#00505cff',
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 3.5,
    marginBottom: 15,
    backgroundColor: 'white',
  },
});
