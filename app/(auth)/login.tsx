import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons1 from '@expo/vector-icons/MaterialIcons';
import {
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSession } from '@/lib/SessionContext';

// 🔁 Handle Supabase auth refresh on app active/inactive
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const router = useRouter();
  const { signIn } = useSession();
  const { width } = useWindowDimensions();

  // Assume "web" if width is wide enough (e.g. > 480)
  const isWeb = width >= 480;

useEffect(() => {
  if (!isWeb) return;

  // Handle Supabase password reset redirect
  const hash = window?.location?.hash;
  if (hash && hash.includes('access_token')) {
    const resetUrl = `/reset-password${hash}`;
    window.location.replace(resetUrl);
    return;
  }

  // Push a dummy history state
  window.history.pushState(null, '', window.location.href);

  // Handle browser back
  const handlePopState = () => {
    router.replace('/'); // ← this redirects to index.tsx
  };

  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, [isWeb]);



  const isMobile = width < 480;

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    setLoginError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setLoginError('Wrong email or password.');
      }
    } catch (err) {
      setLoginError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#80c4c4ff', '#009b84ff']} style={styles.container}>
        <TouchableOpacity
          onPress={() => router.push('/')}  // <-- Navigate to home screen
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 10,
          }}
        >
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>
        <View style={{ width: '100%', maxWidth: 500, marginTop: 30, marginHorizontal: 'auto' }}>
          <Image source={require('../../assets/favicon.ico.png')} style={styles.logo} />

          <Text style={styles.welcome}>SMILE STUDIO</Text>
          <Text style={{ ...styles.welcome, fontSize: 15, marginTop: -10, fontWeight: '300', marginBottom: -15 }}>
            Grin Creators
          </Text>

          <View style={{ ...styles.container }}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.verticallySpacedRow}>
              <MaterialIcons name="email" size={24} color={'white'} />
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                placeholder="JuanDelaCruz@address.com"
                autoCapitalize="none"
                placeholderTextColor={'rgba(218, 218, 218, 1)'}
              />
            </View>

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.verticallySpacedRow}>
              <MaterialIcons1 name="password" size={24} color="white" />
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                autoCapitalize="none"
                placeholderTextColor="rgba(218, 218, 218, 1)"
              />
            </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 20, marginTop: -8}}>
                <Checkbox
                  value={showPassword}
                  onValueChange={setShowPassword}
                  color={showPassword ? '#00505cff' : undefined}
                />
                <Text style={{ color: 'white', marginLeft: 5 }}>Show Password</Text>
              </View>

            {loginError !== '' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Wrong Credentials</Text>
                <Text style={styles.errorMessage}>Invalid email or password</Text>
              </View>
            )}

            <View style={styles.verticallySpaced}>
              <TouchableOpacity
                style={{
                  ...styles.loginButton,
                  backgroundColor:
                    email === '' || password === '' ? 'rgba(0, 0, 0, 0.1)' : '#ffffffff',
                }}
                disabled={loading || email === '' || password === ''}
                onPress={handleLogin}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: email === '' || password === '' ? '#ffffffff' : '#00505cff',
                  }}
                >
                  {loading ? 'Signing In...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{...styles.subtext, marginTop: 20}}>Don't have an Account (Patient/Clinic)?</Text>
            <Text style={{...styles.subtext, marginBottom: 20}}>Sign up here!</Text>

            <View style={styles.verticallySpaced}>
              <TouchableOpacity style={styles.signupButton} onPress={() => setModalVisible(true)}>
                <Text style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 1)' }}>SIGN UP</Text>
              </TouchableOpacity>

              {/* Signup Options Modal */}
              <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <View style={{ ...styles.modalBox, width: !isMobile ? 550 : 280 }}>
                    <Text style={{ ...styles.optionText, fontSize: 20, marginBottom: 20, color: '#00505cff' }}>
                      Patient or Clinic?
                    </Text>

                    <TouchableOpacity
                      style={{ ...styles.optionButton, backgroundColor: '#86ffc7ff' }}
                      onPress={() => {
                        router.push('/signupPatient');
                        setModalVisible(false);
                      }}
                    >
                      <Fontisto name="bed-patient" size={64} color="#498d6dff" />
                      <Text style={{ ...styles.optionText, color: '#498d6dff' }}>PATIENT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ ...styles.optionButton, backgroundColor: '#86f7ffff' }}
                      onPress={() => {
                        router.push('/signupClinic');
                        setModalVisible(false);
                      }}
                    >
                      <FontAwesome5 name="clinic-medical" size={64} color="#4a878bff" />
                      <Text style={{ ...styles.optionText, color: '#4a878bff' }}>CLINIC</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>CLOSE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Forgot Password Modal */}
            <Modal
              transparent
              animationType="fade"
              visible={forgotModalVisible}
              onRequestClose={() => {
                setForgotModalVisible(false);
                setForgotPasswordSent(false);
                setForgotEmail('');
                setForgotError('');
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { width: isMobile ? 300 : 400 }]}>
                  <Text style={{...styles.modalTitle, color: '#00505cff'}}>Reset Your Password</Text>

                  {!forgotPasswordSent ? (
                    <>
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#aaa"
                        style={styles.modalInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                      />

                      {forgotError !== '' && <Text style={{ color: 'red', marginBottom: 10 }}>{forgotError}</Text>}

                      <TouchableOpacity
                        style={styles.sendResetButton}
                        onPress={async () => {
                          setForgotError('');
                          if (!forgotEmail) {
                            setForgotError('Please enter your email.');
                            return;
                          }

                          const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                            redirectTo: 'https://www.smilestudio.works/reset-password',
                          });

                          if (error) {
                            setForgotError(error.message);
                          } else {
                            setForgotPasswordSent(true);
                          }
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Reset Link</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={{ color: 'green', fontWeight: 'bold', textAlign: 'center' }}>
                      Password reset link sent! Check your email.
                    </Text>
                  )}

                  <TouchableOpacity style={styles.closeButton} onPress={() => setForgotModalVisible(false)}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>CLOSE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffffff',
    alignSelf: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffffff',
    alignSelf: 'flex-start',
    marginBottom: 10,
    letterSpacing: 1,
  },
  verticallySpacedRow: {
    backgroundColor: 'rgba(31, 31, 31, 0.08)',
    padding: 14,
    borderRadius: 12,
    borderColor: '#ffffffff',
    color: '#fff',
    marginBottom: 15,
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    gap: 5,
  },
  input: {
    backgroundColor: '#00000000',
    outlineWidth: 0,
    width: '80%',
    height: 40,
    color: 'rgba(255, 255, 255, 1)',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  loginButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  subtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ffffffff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signupButton: {
    backgroundColor: '#00505cff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  forgotLink: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ffffffff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#003f30ff',
  },
  modalInput: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    width: '100%',
    borderRadius: 8,
    marginBottom: 10,
    color: '#000',
  },
  sendResetButton: {
    backgroundColor: '#00505cff',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#b32020ff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  optionButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
    borderColor: 'black',
    marginBottom: 15,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  errorBox: {
    backgroundColor: '#ffd0d0ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  errorTitle: {
    color: '#00505cff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#00505cff',
    fontSize: 14,
    textAlign: 'center',
  },
});
