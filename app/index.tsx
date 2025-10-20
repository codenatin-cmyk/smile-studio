import { FontAwesome } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [termsOfUse, setTermsOfUse] = useState(false);
  const [featuresModal, setFeaturesModal] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
  });

  const scrollRef = useRef<ScrollView>(null);

  const sectionRefs = {
    start: useRef<View>(null),
    benefits: useRef<View>(null),
    concept: useRef<View>(null),
    topics: useRef<View>(null),
    purpose: useRef<View>(null),
    testimonials: useRef<View>(null),
    contact: useRef<View>(null),
  };

  type SectionKey = keyof typeof sectionRefs;

  const scrollToSection = (key: SectionKey) => {
    sectionRefs[key]?.current?.measureLayout(
      scrollRef.current!.getInnerViewNode(),
      (x, y) => {
        scrollRef.current?.scrollTo({ y, animated: true });
      }
    );
  };

  const login = () => {
    router.replace('/login');
  };

  const downloadAPK = () => {
    // External GitHub Release link - no local asset needed
    const apkUrl = 'https://github.com/smilestudiohub-gif/smilestudioapkrelease/releases/download/v1/smilestudio.apk';
    
    Linking.openURL(apkUrl).catch(err => {
      Alert.alert(
        'Download Error',
        'Unable to open download link. Please try again later.'
      );
    });
  };

  const isMobile = width < 768;

  useEffect(() => {
    const isWeb = Platform.OS === 'web';

    if (isWeb) {
      const hash = window?.location?.hash;
      if (hash && hash.includes('access_token')) {
        router.push(`/reset-password${hash}`);
      }
    }
  }, []);

  // ✅ Show a loader while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2D9CDB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Animated values for header transparency
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: ['rgba(128, 196, 196, 1)', 'rgba(128, 196, 196, 0.76)'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Modal
        visible={termsOfUse}
        transparent
        onRequestClose={() => setTermsOfUse(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: "#00505cff",
                }}
              >
                SMILE STUDIO
              </Text>
      
              {/* Divider */}
              <View
                style={{
                  marginVertical: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                }}
              />
      
              {/* Terms of Use */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: "#00505cff",
                }}
              >
                Terms of Use
              </Text>
              <Text style={{ fontSize: 14, marginBottom: 10, color: "#444" }}>
                <Text style={{ fontWeight: "bold" }}>Last Updated:</Text> October 13,
                2025{"\n"}
              </Text>
      
              <Text style={{ fontSize: 14, color: "#444", lineHeight: 22 }}>
                By accessing or using Smile Studio: A Cross-Platform Dental Appointment
                System with AR Teeth and Braces Filter for Dental Patients in San Jose
                Del Monte, Bulacan, owned and operated by Scuba Scripter and Pixel
                Cowboy Team, you agree to be legally bound by these Terms of Use. If
                you do not agree, please stop using the platform immediately.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>1. Definitions{"\n"}</Text>
                1.1 Appointment – A scheduled dental consultation booked through Smile
                Studio.{"\n"}
                1.2 No-Show – Failure to attend a booked appointment without
                cancellation.{"\n"}
                1.3 Grace Period – The allowable late arrival time is determined by
                each partner dental clinic based on their internal policy.{"\n"}
                1.4 Malicious Activity – Any action that disrupts, exploits, or harms
                the system, users, or clinics, such as hacking, spamming, harassment,
                or impersonation.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>2. Eligibility and Accounts{"\n"}</Text>
                2.1 The platform is primarily intended for academic and demonstration
                purposes.{"\n"}
                2.2 Users under 16 years old must have verified parental or guardian
                consent before registration.{"\n"}
                2.3 Users are responsible for maintaining the confidentiality of their
                login credentials and all activities that occur under their account.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>3. Permitted and Prohibited Use{"\n"}</Text>
                3.1 Permitted Use – Booking legitimate dental appointments, accessing
                clinic information, and managing appointment schedules.{"\n"}
                3.2 Prohibited Use – Creating fake or spam appointments, harassing
                staff or other users, attempting to hack or damage the system,
                uploading harmful content, impersonating others, or repeatedly
                violating platform rules.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>4. Appointments{"\n"}</Text>
                4.1 Appointments are handled on a "First-Appoint, First-Served"
                basis.{"\n"}
                4.2 No downpayment or online payment is required before appointments.{"\n"}
                4.3 Cancellations must be made at least 24 hours prior to the scheduled
                time.{"\n"}
                4.4 Notification reminders are automatically sent to users before
                appointments.{"\n"}
                4.5 The grace period for late arrivals is based on the policy of each
                respective dental clinic.{"\n"}
                4.6 Clinics may cancel or reschedule appointments due to emergencies or
                unavailability, and users will be notified promptly through email.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>5. Conduct, Violations, and Disciplinary Actions{"\n"}</Text>
                5.1 Superadmin Authority – The Superadmin reserves the right to issue
                warnings, temporary suspensions, or permanent bans on user accounts
                based on the severity of misconduct or breach of these Terms of Use.{"\n"}
                5.2 Appeals – Users may submit a written appeal to Smile Studio Email
                if they believe disciplinary actions were issued in error.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>6. Clinic Verification and DTI Validation{"\n"}</Text>
                6.1 Verification Requirement – All dental clinics registering with
                Smile Studio must provide valid business information, including their
                official Department of Trade and Industry (DTI) registration details.{"\n"}
                6.2 Superadmin DTI Verification – The Superadmin or authorized
                developers are permitted to verify the authenticity of a clinic's DTI
                registration through the official DTI online verification platform.{"\n"}
                6.3 Legal Basis – Under Philippine law, any civilian may verify the
                registration status of a sole proprietorship using the Department of
                Trade and Industry's public verification system without requiring
                special access or authority.{"\n"}
                6.4 Purpose – This verification process ensures that only legitimate
                and lawfully registered dental clinics operate within Smile Studio,
                protecting users from fraudulent or unlicensed establishments.{"\n"}
                6.5 Revocation – The Superadmin reserves the right to suspend or remove
                a clinic's account if its DTI registration cannot be verified or has
                been found invalid.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>7. Medical Disclaimer{"\n"}</Text>
                7.1 Smile Studio is not a healthcare provider and is not to be used for
                emergency medical concerns.{"\n"}
                7.2 Patients must provide accurate and complete medical information to
                ensure proper treatment.{"\n"}
                7.3 The AR Teeth and Braces Filter is provided for visualization and
                educational purposes only and does not represent professional dental
                advice.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>8. Intellectual Property{"\n"}</Text>
                8.1 All platform elements, including the system's design, graphics,
                text, and content, are the property of Smile Studio and its
                developers.{"\n"}
                8.2 The platform may only be used for personal, non-commercial, and
                educational purposes. Unauthorized reproduction or redistribution is
                prohibited.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>9. Privacy and Security{"\n"}</Text>
                9.1 All user and clinic data are collected, processed, and stored in
                compliance with the Philippine Data Privacy Act of 2012 (RA 10173).{"\n"}
                9.2 The handling of personal and clinic information is further
                explained in the Smile Studio Privacy Policy.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>10. Termination{"\n"}</Text>
                10.1 Smile Studio reserves the right to warn, suspend, or delete
                accounts that violate these Terms of Use.{"\n"}
                10.2 Users and clinics may request account deletion or data removal by
                contacting Smile Studio Support.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>11. Updates to Terms{"\n"}</Text>
                11.1 Smile Studio may revise these Terms of Use at any time to reflect
                policy changes or system improvements.{"\n"}
                11.2 Users will be notified of updates, and continued use of the
                platform constitutes acceptance of the revised terms.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>Acknowledgment{"\n"}</Text>
                By creating an account or booking an appointment through Smile Studio,
                you acknowledge that you have read, understood, and agreed to these
                Terms of Use.{"\n\n"}
              </Text>
      
              {/* Divider */}
              <View
                style={{
                  marginVertical: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                }}
              />
      
              {/* Privacy Policy */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: "#00505cff",
                }}
              >
                Privacy Policy
              </Text>
              <Text style={{ fontSize: 14, marginBottom: 10, color: "#444" }}>
                <Text style={{ fontWeight: "bold" }}>Last Updated:</Text> October 13,
                2025{"\n"}
              </Text>
      
              <Text style={{ fontSize: 14, color: "#444", lineHeight: 22 }}>
                This Privacy Policy explains how Smile Studio collects, uses, and
                safeguards your personal and clinic information.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>1. Information We Collect{"\n"}</Text>
                1.1 Personal Information – Name, age, date of birth, contact number,
                email address, and address (Dental Clinic).{"\n"}
                1.2 Appointment Information – Clinic and dentist details, appointment
                dates and times.{"\n"}
                1.3 Health Information (only if provided) – Relevant medical or dental
                conditions such as allergies, pregnancy, or ongoing medication.{"\n"}
                1.4 System Data – Username, password, browser information, device type,
                and system notifications sent.{"\n"}
                1.5 Clinic Verification Data – Clinic's registration info and DTI permit
                number provided for clinic verification.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>2. How We Use Your Information{"\n"}</Text>
                2.1 To manage dental appointments and clinic scheduling.{"\n"}
                2.2 To send automated notifications and reminders.{"\n"}
                2.3 To verify clinic legitimacy through DTI validation.{"\n"}
                2.4 To ensure compliance with applicable regulations.{"\n"}
                2.5 To improve platform performance and security.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>3. Data Sharing and Disclosure{"\n"}</Text>
                3.1 With Partner Clinics – For appointment coordination and service
                preparation.{"\n"}
                3.2 With DTI or Authorized Platforms – For validation of clinic
                verification.{"\n"}
                3.3 With User Consent – For referrals or optional features.{"\n"}
                3.4 As Required by Law – When mandated by government or regulatory
                authorities.{"\n"}
                3.5 For Security – To prevent fraudulent activities or misuse of the
                platform.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>4. Data Security{"\n"}</Text>
                5.1 Smile Studio implements strong physical, technical, and
                administrative measures to protect data using Supabase, including
                encrypted passwords, secure logins, and limited access.{"\n"}
                5.2 However, no online platform can guarantee absolute security. Use of
                the system is at the user's own risk.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>5. Children's Privacy{"\n"}</Text>
                6.1 Smile Studio allows access to users under 16 only with verified
                parental or guardian consent.{"\n"}
                6.2 The system does not intentionally collect data from minors without
                supervision.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>6. Patient and Clinic Rights{"\n"}</Text>
                7.1 Under the Data Privacy Act of 2012 (RA 10173), users and clinics
                have the right to access, correct, delete, or withdraw their data.{"\n"}
                7.2 They may also file a complaint with the National Privacy Commission
                (NPC) if data rights are violated.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>7. AR Filter Disclaimer{"\n"}</Text>
                8.1 The AR Teeth and Braces Filter is for educational and visualization
                purposes only.{"\n"}
                8.2 It does not store, process, or analyze facial recognition data, and
                no images are permanently saved.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>8. Updates to This Privacy Policy{"\n"}</Text>
                9.1 This Privacy Policy may be updated periodically to comply with laws
                or improve practices.{"\n"}
                9.2 Continued use of the system after updates signifies agreement with
                the latest version.{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>9. Contact Information{"\n"}</Text>
                Smile Studio Support{"\n"}
                Scuba Scripter and Pixel Cowboy Team{"\n"}
                (+63) 921-888-1835{"\n"}
                San Jose Del Monte, Bulacan, Philippines{"\n\n"}
      
                <Text style={{ fontWeight: "bold" }}>Acknowledgment{"\n"}</Text>
                By using Smile Studio, you acknowledge that you have read, understood,
                and agreed to this Privacy Policy.
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
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={featuresModal}
        transparent
        onRequestClose={() => setFeaturesModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: "#00505cff",
                }}
              >
                SMILE STUDIO: FEATURES OVERVIEW
              </Text>
              <Text style={{ fontSize: 13, color: "#444", lineHeight: 20 }}>
                Last Updated: October 16, 2025{"\n\n"}
                Smile Studio is a Cross-Platform Dental Appointment and Augmented Reality
                System designed to make dental care simpler, smarter, and more engaging for
                both patients and clinics.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>1. Cross-Platform Access{"\n"}</Text>
                Smile Studio runs seamlessly across Web, Android devices using
                Expo technology. Patients can book appointments anytime, anywhere.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>2. AR Teeth & Braces Filter{"\n"}</Text>
                Experience how braces or smile adjustments might look before treatment
                through our non-real-time Augmented Reality machine learning visualization feature — built for
                education and engagement.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>3. Smart Dental Appointments{"\n"}</Text>
                Easily browse partner clinics, view available schedules, and book an
                appointment instantly. Notifications remind patients of changes.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>4. Verified Partner Clinics{"\n"}</Text>
                Every registered clinic undergoes DTI validation to ensure legitimacy and
                patient trust. Only verified, lawful dental clinics are allowed to operate
                within Smile Studio.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>5. Secure Authentication{"\n"}</Text>
                Supabase authentication protects every user and clinic account. All data is
                encrypted and securely stored in compliance with the Data Privacy Act of
                2012 (RA 10173).{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>6. Notifications & Updates{"\n"}</Text>
                Automatic notifications help clinics and patients stay on track with
                appointment schedules and updates.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>7. Educational Visualization{"\n"}</Text>
                The AR filter is for educational purposes only — designed to help users
                understand dental procedures and possible results in a visual, interactive
                way.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>8. Continuous Improvements{"\n"}</Text>
                Smile Studio evolves with new updates and features to provide a smoother,
                smarter, and safer digital dental experience.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>Acknowledgment{"\n"}</Text>
                By using Smile Studio, you acknowledge that you have read and understood
                the features provided in this platform and that all functionalities are for
                academic, educational, and demonstration purposes only.{"\n\n"}
              </Text>
              <TouchableOpacity
                onPress={() => setFeaturesModal(false)}
                style={{
                  marginTop: 10,
                  backgroundColor: "#00505cff",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fixed Header with Animated Transparency */}
      <Animated.View style={[
        styles.header,
        {
          backgroundColor: headerBackgroundColor,
        }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../assets/adaptive-icon.png')}
            style={{
              width: 40,
              height: 40,
            }}
            resizeMode="contain"
          />
          <Text style={[styles.logo, { marginLeft: 8, color: 'white'}]}>
            Smile<Text style={[{ color: '#00205cff'}]}>Stu</Text><Text style={[{ color: '#1c6ac5ff'}]}>dio</Text>
          </Text>
        </View>

        {!isMobile && (
          <View style={styles.nav}>
            <TouchableOpacity onPress={() => scrollToSection('start')}>
              <Text style={styles.navItem}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('benefits')}>
              <Text style={styles.navItem}>Benefits</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('concept')}>
              <Text style={styles.navItem}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('topics')}>
              <Text style={styles.navItem}>Services</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('testimonials')}>
              <Text style={styles.navItem}>Testimonials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navCta} onPress={login}>
              <Text style={styles.navCtaText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent} 
        ref={scrollRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View ref={sectionRefs.start} style={styles.hero}>
          <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Healthcare Platform</Text>
            </View>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              Your Smile Deserves{'\n'}Expert Care
            </Text>
            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              Connect with trusted dental clinics in San Jose Del Monte, Bulacan. 
              Book appointments seamlessly and take control of your oral health journey.
            </Text>
           <View style={styles.heroCtas}>
  <TouchableOpacity 
    style={[styles.ctaPrimary, isMobile && styles.ctaPrimaryMobile]} 
    onPress={login}
  >
    <Text style={[styles.ctaPrimaryText, isMobile && styles.ctaPrimaryTextMobile]}>
      Get Started Free
    </Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={[styles.ctaDownload, isMobile && styles.ctaDownloadMobile]} 
    onPress={downloadAPK}
  >
    <Image
      source={require('../assets/favicon.ico.png')}
      style={styles.downloadIcon}
      resizeMode="contain"
    />
    <Text style={[styles.ctaDownloadText, isMobile && styles.ctaDownloadTextMobile]}>
      Download Our App
    </Text>
  </TouchableOpacity>
</View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustText}>
                ⭐ Trusted by 10+ dental clinics
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View ref={sectionRefs.benefits} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>BENEFITS</Text>
            <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
              Why Choose Our Platform?
            </Text>
            <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>
              A modern solution designed to make dental care accessible, 
              convenient, and stress-free for everyone.
            </Text>
          </View>

          <View style={[styles.cardGrid, isMobile && styles.cardGridMobile]}>
            {/* Card 1 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="calendar-check" size={30} color="#007AFF" />
              </View>
              <Text style={styles.cardTitle}>Seamless Scheduling</Text>
              <Text style={styles.cardDesc}>
                Book appointments with just a few taps. 
                No more phone calls or waiting on hold.
              </Text>
            </View>

            {/* Card 2 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="bolt" size={30} color="#FF9500" />
              </View>
              <Text style={styles.cardTitle}>Real-time Confirmation</Text>
              <Text style={styles.cardDesc}>
                Receive real-time booking confirmations and automated reminders 
                so you never miss an appointment.
              </Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="bullseye" size={30} color="#34C759" />
              </View>
              <Text style={styles.cardTitle}>Non-real-time AR 'Experimental'</Text>
              <Text style={styles.cardDesc}>
                Experience augmented reality tool to preview types of braces (metal or ceramic) using machine learning.
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View ref={sectionRefs.concept} style={styles.statsSection}>
          <Text style={[styles.statsTitle, isMobile && styles.statsTitleMobile]}>
            Powering Dental Care Innovation
          </Text>
          <Text style={styles.statsSubtitle}>
            Built by students, trusted by professionals
          </Text>
          <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
            <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>10+</Text>
              <Text style={styles.statLabel}>Partner Clinics</Text>
              <Text style={styles.statSubtext}>across SJDM area</Text>
            </View>
            <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>99.24%</Text>
              <Text style={styles.statLabel}>Satisfaction Rate</Text>
              <Text style={styles.statSubtext}>from our patients</Text>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View ref={sectionRefs.topics} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SERVICES</Text>
            <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
              Everything You Need in One Place
            </Text>
          </View>

          <View style={[styles.cardGrid, isMobile && styles.cardGridMobile]}>
            {/* Card 1 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="map-marker-alt" size={30} color="#FF3B30" />
              </View>
              <Text style={styles.cardTitle}>Find Nearby Clinics</Text>
              <Text style={styles.cardDesc}>
                Discover trusted dental clinics near you with detailed profiles, 
                services offered, and clinic's availability.
              </Text>
            </View>

            {/* Card 2 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="tooth" size={30} color="#5856D6" />
              </View>
              <Text style={styles.cardTitle}>Expert Consultations</Text>
              <Text style={styles.cardDesc}>
                Get professional advice for common dental concerns from 
                experienced practitioners in your area.
              </Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="mobile-alt" size={30} color="#007AFF" />
              </View>
              <Text style={styles.cardTitle}>Digital Records</Text>
              <Text style={styles.cardDesc}>
                Access your dental history, treatment plans, and appointments 
                securely from any device.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View ref={sectionRefs.purpose} style={styles.ctaSection}>
          <View style={styles.ctaSectionContent}>
            <Text style={[styles.ctaSectionTitle, isMobile && styles.ctaSectionTitleMobile]}>
              Ready to Transform Your{'\n'}Dental Experience?
            </Text>
            <TouchableOpacity style={styles.ctaPrimaryLarge} onPress={login}>
              <Text style={styles.ctaPrimaryTextLarge}>Start Your Journey</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Testimonials */}
        <View ref={sectionRefs.testimonials} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TESTIMONIALS</Text>
            <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
              Beta Feedback
            </Text>
          </View>
          <View style={[styles.testimonialGrid, isMobile && styles.testimonialGridMobile]}>
            <View style={[styles.testimonial, isMobile && styles.testimonialMobile]}>
              <View style={styles.stars}>
                <Text style={styles.starText}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "The booking process was incredibly smooth. I found a great clinic 
                near me and got an appointment within days!"
              </Text>
              <View style={styles.testimonialAuthor}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>EJ</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>Mc Neil Dela Peña</Text>
                  <Text style={styles.authorRole}>Beta Tester</Text>
                </View>
              </View>
            </View>
            <View style={[styles.testimonial, isMobile && styles.testimonialMobile]}>
              <View style={styles.stars}>
                <Text style={styles.starText}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "Finally, a platform that makes dental care accessible. The reminders 
                and digital records are game-changers!"
              </Text>
              <View style={styles.testimonialAuthor}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>JC</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>Rewin Dave Sumo</Text>
                  <Text style={styles.authorRole}>Beta Tester</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerContent, isMobile && styles.footerContentMobile]}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogo}>SmileStudio</Text>
              <Text style={styles.footerTagline}>
                Your trusted partner in dental health
              </Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity
                  style={styles.socialIcon}
                  onPress={() => Linking.openURL('https://www.facebook.com/share/1CZ6vYaKiF/?mibextid=wwXlfr')}
                >
                  <FontAwesome name="facebook" size={20} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialIcon}
                  onPress={() => Linking.openURL('https://www.instagram.com/smilestudiohub?igsh=a2EwcXp1Z3htdGww&utm_source=qr')}
                >
                  <FontAwesome name="instagram" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.footerLinks}>
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Product</Text>
                <Text onPress={() => setFeaturesModal(true)} style={styles.footerLink}>Features</Text>
              </View>
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Legal</Text>
                <Text onPress={() => setTermsOfUse(true)} style={styles.footerLink}>Terms & Privacy</Text>
              </View>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              © 2025 SmileStudio. All rights reserved.
            </Text>
            <Text style={styles.footerContact}>
              smilestudiohub@gmail.com • 09218881835
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#2D9CDB',
  },
  
  // Fixed Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#ffffff',
  },
  navCta: {
    backgroundColor: '#00505c',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  navCtaText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#ffffff',
  },

  // Scrollable Content
  scrollContent: {
    flex: 1,
    marginTop: 80, // Height of fixed header
  },

  // Hero
  hero: {
    backgroundColor: '#ccf0eb',
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  heroContentMobile: {
    paddingHorizontal: 16,
  },
  badge: {
    backgroundColor: '#86ffc7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#498d6d',
  },
  heroTitle: {
    fontSize: 56,
    fontFamily: 'Poppins-Bold',
    color: '#00505c',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 64,
  },
  heroTitleMobile: {
    fontSize: 36,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 19,
    fontFamily: 'Poppins-Regular',
    color: '#003f30',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  heroSubtitleMobile: {
    fontSize: 17,
    lineHeight: 26,
  },
  heroCtas: {
  flexDirection: 'row',
  gap: 16,
  marginBottom: 32,
  flexWrap: 'wrap', // Add this
  justifyContent: 'center', // Add this
},
ctaDownloadMobile: {
  width: '100%', // Full width on mobile
  justifyContent: 'center',
  paddingVertical: 14,
  paddingHorizontal: 24,
},
  ctaPrimary: {
    backgroundColor: '#00505c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  ctaPrimaryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  ctaSecondary: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#80c4c4',
  },
  ctaSecondaryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#00505c',
  },
 ctaDownload: {
  backgroundColor: '#ffffff',
  paddingVertical: 16,
  paddingHorizontal: 32,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#80c4c4',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  minWidth: 200, // Add this to ensure button doesn't get too small
},
ctaDownloadTextMobile: {
  fontSize: 15, // Slightly smaller on mobile
},
ctaPrimaryMobile: {
  width: '100%', // Also make primary button full width on mobile
  alignItems: 'center',
  paddingVertical: 14,
  paddingHorizontal: 24,
},
ctaPrimaryTextMobile: {
  fontSize: 15,
},
  ctaDownloadText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#00505c',
  },
  downloadIcon: {
    width: 24,
    height: 24,
  },
  trustBadge: {
    paddingVertical: 12,
  },
  trustText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#498d6d',
  },

  // Section
  section: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  sectionLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#00505c',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 40,
    fontFamily: 'Poppins-Bold',
    color: '#00505c',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitleMobile: {
    fontSize: 32,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#003f30',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
  },
  sectionSubtitleMobile: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Cards
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  cardGridMobile: {
    flexDirection: 'column',
  },
  card: {
    width: '31%',
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#80c4c4',
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  cardMobile: {
    width: '100%',
  },
  cardIconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#86ffc7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#00505c',
    marginBottom: 12,
  },
  cardDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#003f30',
    lineHeight: 24,
  },

  // Stats
  statsSection: {
    backgroundColor: '#ccf0eb',
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 40,
    fontFamily: 'Poppins-Bold',
    color: '#00505c',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsTitleMobile: {
    fontSize: 32,
  },
  statsSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    color: '#003f30',
    marginBottom: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statsGridMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#80c4c4',
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  statCardMobile: {
    width: '100%',
  },
  statValue: {
    fontSize: 48,
    fontFamily: 'Poppins-Bold',
    color: '#00505c',
    marginBottom: 8,
  },
  statValueMobile: {
    fontSize: 40,
  },
  statLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#00505c',
    marginBottom: 4,
  },
  statSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#498d6d',
  },

  // CTA Section
  ctaSection: {
    backgroundColor: '#00505c',
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  ctaSectionContent: {
    maxWidth: 700,
    alignItems: 'center',
  },
  ctaSectionTitle: {
    fontSize: 44,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 52,
  },
  ctaSectionTitleMobile: {
    fontSize: 32,
    lineHeight: 40,
  },
  ctaSectionSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#86ffc7',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  ctaSectionSubtitleMobile: {
    fontSize: 16,
    lineHeight: 24,
  },
  ctaPrimaryLarge: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  ctaPrimaryTextLarge: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: '#00505c',
  },

  // Testimonials
  testimonialGrid: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  testimonialGridMobile: {
    flexDirection: 'column',
  },
  testimonial: {
    width: '45%',
    minWidth: 320,
    backgroundColor: '#ccf0eb',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#80c4c4',
  },
  testimonialMobile: {
    width: '100%',
  },
  stars: {
    marginBottom: 16,
  },
  starText: {
    fontSize: 16,
  },
  testimonialText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#003f30',
    lineHeight: 26,
    marginBottom: 24,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#86ffc7',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#498d6d',
  },
  authorName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#00505c',
  },
  authorRole: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#498d6d',
  },

  // Footer
  footer: {
    backgroundColor: '#80c4c4',
    paddingTop: 64,
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  footerContentMobile: {
    flexDirection: 'column',
    gap: 32,
  },
  footerBrand: {
    flex: 1,
  },
  footerLogo: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  footerTagline: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 48,
  },
  footerColumn: {
    gap: 12,
  },
  footerColumnTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  footerBottom: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#009b84',
    alignItems: 'center',
    gap: 8,
  },
  footerCopyright: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  footerContact: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#ffffff',
  },
});