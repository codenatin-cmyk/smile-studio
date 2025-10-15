import { FontAwesome } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();

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

  const isMobile = width < 768;

  useEffect(() => {
    const isWeb = Platform.OS === 'web';

    if (isWeb) {
      const hash = window?.location?.hash;
      if (hash && hash.includes('access_token')) {
        router.push(`/reset-password${hash}` as any);
      }
    }
  }, []);

  // ✅ Show a loader while fonts are loading
  if (!fontsLoaded) {
    return (
      <View>
        <ActivityIndicator size="large" color="#2D9CDB" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} ref={scrollRef}>
      {/* Header */}
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      source={require('../assets/adaptive-icon.png')} // replace with your actual logo path
      style={{
        width: 40,
        height: 40,
      }}
      resizeMode="contain"
    />
        <Text style={[styles.logo, { marginLeft: 8, color: 'white'}]}>Smile<Text style={[{ color: '#00205cff'}]}>Stu</Text><Text style={[{ color: '#1c6ac5ff'}]}>dio</Text></Text>
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
    </View>


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
            <TouchableOpacity style={styles.ctaPrimary} onPress={login}>
              <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustText}>
              ⭐ Trusted by 7+ dental clinics • 300+ happy patients
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
            Book, reschedule, or cancel appointments with just a few taps. 
            No more phone calls or waiting on hold.
          </Text>
        </View>

        {/* Card 2 */}
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          <View style={styles.cardIconWrapper}>
            <FontAwesome5 name="bolt" size={30} color="#FF9500" />
          </View>
          <Text style={styles.cardTitle}>Instant Confirmation</Text>
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
          <Text style={styles.cardTitle}>AR-Powered Education</Text>
          <Text style={styles.cardDesc}>
            Experience augmented reality tools for treatment previews and 
            interactive dental health education.
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
            <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>30+</Text>
            <Text style={styles.statLabel}>Partner Clinics</Text>
            <Text style={styles.statSubtext}>across SJDM area</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>300+</Text>
            <Text style={styles.statLabel}>Active Users</Text>
            <Text style={styles.statSubtext}>and growing daily</Text>
          </View>
          <View style={[styles.statCard, isMobile && styles.statCardMobile]}>
            <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>99%</Text>
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
            services offered, and real-time availability.
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
          <Text style={[styles.ctaSectionSubtitle, isMobile && styles.ctaSectionSubtitleMobile]}>
            Join hundreds of patients who've already discovered a better 
            way to manage their oral health.
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
            Loved by Patients
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
                <Text style={styles.authorName}>Emily Johnson</Text>
                <Text style={styles.authorRole}>Patient since 2024</Text>
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
                <Text style={styles.authorName}>James Carter</Text>
                <Text style={styles.authorRole}>Patient since 2024</Text>
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
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome name="facebook" size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome name="twitter" size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome name="instagram" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Product</Text>
              <Text style={styles.footerLink}>Features</Text>
              <Text style={styles.footerLink}>Pricing</Text>
              <Text style={styles.footerLink}>Clinics</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Support</Text>
              <Text style={styles.footerLink}>Help Center</Text>
              <Text style={styles.footerLink}>Contact</Text>
              <Text style={styles.footerLink}>FAQ</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Legal</Text>
              <Text style={styles.footerLink}>Privacy</Text>
              <Text style={styles.footerLink}>Terms</Text>
              <Text style={styles.footerLink}>Security</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    backgroundColor: '#80c4c4',
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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