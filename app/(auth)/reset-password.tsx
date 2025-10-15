import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);  // <-- NEW STATE
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const extractTokensFromHash = async () => {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Password reset only works in the browser.');
        return;
      }

      const hash = window.location.hash;
      if (!hash) {
        Alert.alert('Error', 'No token found in URL.');
        return;
      }

      const params = new URLSearchParams(hash.slice(1)); // remove '#'
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setTokenReady(true);

          // Fetch user info after session is set
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error('Error fetching user:', userError.message);
          } else if (user?.email) {
            setEmail(user.email);
          }
        }
      } else {
        Alert.alert('Error', 'Missing access or refresh token.');
      }
    };

    extractTokensFromHash();
  }, []);

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)
    ) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
    }
    return null;
  };

  const handlePasswordReset = async () => {
    const errorMsg = validatePassword(newPassword);

    if (errorMsg) {
      setPasswordError(errorMsg);
      Alert.alert("Error", errorMsg);
      return;
    }

    setPasswordError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully');
      router.replace('/'); // Go to login or home
    }
  };

  const onChangePassword = (text: string) => {
    setNewPassword(text);
    const errorMsg = validatePassword(text);
    setPasswordError(errorMsg);
  };

  if (!tokenReady) {
    return (
      <LinearGradient colors={['#80c4c4ff', '#009b84ff']} style={styles.container}>
        <Text style={styles.title}>Verifying reset link...</Text>
        <ActivityIndicator size="large" color="#ffffffff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#80c4c4ff', '#009b84ff']}
      style={{ ...styles.container, paddingHorizontal: isMobile ? null : 150 }}
    >
      <Text style={styles.title}>Set New Password</Text>

      {email && (
        <Text style={styles.emailText}>Resetting password for: {email}</Text>
      )}

      <View style={styles.inputRow}>
        <MaterialIcons name="lock" size={24} color="white" />
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          secureTextEntry={!showPassword}
          placeholder="Enter new password"
          placeholderTextColor="rgba(255,255,255,0.7)"
          onChangeText={onChangePassword}
          value={newPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialIcons
            name={showPassword ? "visibility" : "visibility-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
      {passwordError && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={20} color="#ffadad" />
          <Text style={styles.errorText}>{passwordError}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.button, (loading || passwordError) && { opacity: 0.6 }]}
        onPress={handlePasswordReset}
        disabled={loading || !!passwordError}  // disable if error or loading
      >
        <Text style={styles.buttonText}>
          {loading ? 'Updating...' : 'Update Password'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#ffffffff',
    letterSpacing: 1,
  },
  emailText: {
    textAlign: 'center',
    color: '#e0f7f7',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffffff',
    height: 60,
    marginBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffffff',
    height: 40,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffadad44',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    gap: 6,
  },
  errorText: {
    color: '#2e0a0aff',
    fontSize: 14,
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#ffffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00000045',
    shadowRadius: 6,
    shadowOffset: { width: 4, height: 4 },
  },
  buttonText: {
    color: '#00505cff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
