import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { showAlert } from '../utils/webAlert';
import { useTheme } from '../context/ThemeContext';
import { saveAuthSession, getAccessToken as getStoredToken, getStoredUser } from '../storage/authStorage';
import { navigateToRoute } from '../navigation/navigateCompatible';

/** Dev shortcuts: __DEV__/NODE_ENV may be stripped on web; allow localhost + Expo dev builds. */
const showDevShortcuts = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HIDE_DEV_LOGIN === '1') return false;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const h = window.location?.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return true;
  }
  return false;
};

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === 'web' && width >= 920;
  const styles = useMemo(() => createLoginStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getStoredToken();
        const user = await getStoredUser();
        if (token && user) {
          // If we have a session, skip login
          handlePostLogin(user);
        }
      } catch (err) {
        console.log('No existing session');
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handlePostLogin = (user) => {
    const roleKey = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
    if (roleKey === 'admin' || roleKey === 'teacher') {
      navigation.replace('AdminDashboard');
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleLogin = async (customEmail, customPassword) => {
    const finalEmail = customEmail || email;
    const finalPassword = customPassword || password;

    try {
      const response = await apiClient.post('/users/login', {
        email: finalEmail,
        password: finalPassword,
      });
      const { token, user } = response.data.data;
      if (!user) throw new Error('User data missing from response');

      await saveAuthSession(token, user);
      handlePostLogin(user);

      const roleKey = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
      const capitalizedRole = roleKey
        ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1)
        : 'User';

      // Show alert after a tiny delay so navigation starts
      setTimeout(() => {
        showAlert('Login Successful', `Welcome! You are logged in as ${capitalizedRole}.`);
      }, 100);
    } catch (error) {
      console.error('Login Error:', error);
      showAlert('Error', error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      const msg = 'Please enter both an email and a password.';
      if (Platform.OS === 'web') window.alert(msg);
      else showAlert('Error', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      if (Platform.OS === 'web') window.alert(msg);
      else showAlert('Error', msg);
      return;
    }

    try {
      await apiClient.post('/users/register', {
        email,
        password,
        firstName: email.split('@')[0],
        lastName: 'User',
        role: 'student',
      });

      const msg = 'Account created successfully! You can now log in.';
      if (Platform.OS === 'web') window.alert(msg);
      else showAlert('Success', msg);

      setIsLogin(true);
      setPassword('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Try again.';
      if (Platform.OS === 'web') window.alert('Error: ' + errorMsg);
      else showAlert('Error', errorMsg);
    }
  };

  const heroBlock = (
    <View style={[styles.heroOuter, isWideLayout && styles.heroOuterWide]}>
      <View style={styles.heroGlow} pointerEvents="none" />
      <View style={[styles.heroInner, isWideLayout && styles.heroInnerWide]}>
        <Image
          source={require('../../assets/login-hero.png')}
          style={[styles.heroImage, isWideLayout && styles.heroImageWide]}
          accessibilityLabel="Online learning illustration with students and a classroom screen"
          resizeMode="contain"
        />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroBrand}>Academic Excellence LMS</Text>
        <Text style={styles.heroTagline}>Learn anywhere. Stay connected.</Text>
      </View>
    </View>
  );

  const formCard = (
    <View style={[styles.contentCard, isWideLayout && styles.contentCardWide]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}>
          <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}>
          <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Create account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.welcome}>{isLogin ? 'Welcome back' : 'Join the classroom'}</Text>
        <Text style={styles.welcomeSub}>
          {isLogin ? 'Enter your credentials to continue' : 'Set up your student profile in seconds'}
        </Text>

        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="you@university.edu"
            placeholderTextColor={theme.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.passwordHeader}>
          <Text style={styles.inputLabel}>Password</Text>
          <TouchableOpacity
            onPress={() =>
              showAlert('Forgot Password', 'Please contact your administrator at admin@lms.com to reset your password.')
            }
          >
            <Text style={styles.forgotText}>Forgot?</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.signInButton} activeOpacity={0.9} onPress={() => (isLogin ? handleLogin() : handleRegister())}>
          <MaterialCommunityIcons name="login" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.signInButtonText}>{isLogin ? 'Sign in' : 'Create account'}</Text>
        </TouchableOpacity>

        {showDevShortcuts() ? (
          <>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Dev shortcuts</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.devButtonsRow}>
              <TouchableOpacity
                style={[styles.devButton, { marginRight: 8 }]}
                activeOpacity={0.85}
                onPress={() => void handleLogin('student@lms.com', 'password123')}
              >
                <MaterialCommunityIcons name="account-school-outline" size={18} color={theme.text} />
                <Text style={styles.devButtonText}> Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonAdmin]}
                activeOpacity={0.85}
                onPress={() => void handleLogin('admin@lms.com', 'password123')}
              >
                <MaterialCommunityIcons name="shield-crown-outline" size={18} color="#C2410C" />
                <Text style={[styles.devButtonText, { color: '#C2410C' }]}> Admin</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <View style={[styles.dividerContainer, { marginTop: showDevShortcuts() ? 16 : 20 }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Campus SSO</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.ssoButton}
          activeOpacity={0.85}
          onPress={() => showAlert('SSO Login', 'SSO Login is currently restricted to campus network users.')}
        >
          <MaterialCommunityIcons name="domain" size={20} color={theme.primary} style={styles.ssoIcon} />
          <Text style={styles.ssoButtonText}>Institution sign-in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollGrow}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
        >
          {isWideLayout ? (
            <View style={styles.splitRow}>
              {heroBlock}
              <View style={styles.splitForm}>{formCard}</View>
            </View>
          ) : (
            <>
              {heroBlock}
              {formCard}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function createLoginStyles(theme) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  keyboard: { flex: 1 },
  scrollGrow: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: Platform.OS === 'web' ? 620 : undefined,
    flex: 1,
  },
  splitForm: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    maxWidth: 520,
  },

  heroOuter: {
    backgroundColor: theme.surface,
    paddingBottom: 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroOuterWide: {
    flex: 1.15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 40,
    justifyContent: 'center',
    minHeight: 560,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.65)',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.heroTop,
    opacity: Platform.OS === 'web' ? 0.09 : 0.12,
  },
  heroInner: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'web' ? 28 : 20,
    minHeight: 200,
    justifyContent: 'center',
  },
  heroInnerWide: {
    minHeight: 320,
    paddingTop: 40,
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroImageWide: {
    height: 340,
    maxWidth: '100%',
  },
  heroCopy: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 4,
    alignItems: 'center',
  },
  heroBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroTagline: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },

  contentCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginTop: -18,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 28,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 24px 60px rgba(15,41,66,0.12)' }
      : {
          shadowColor: '#0F2942',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
        }),
    borderWidth: 1,
    borderColor: theme.border,
  },
  contentCardWide: {
    marginHorizontal: 0,
    marginTop: 0,
    maxHeight: Platform.OS === 'web' ? 'auto' : undefined,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: theme.card, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(91,77,255,0.14)' } : { elevation: 2 }) },
  tabText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  activeTabText: { color: theme.primary },

  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSub: { fontSize: 14, color: theme.textSecondary, marginBottom: 22, fontWeight: '500' },

  form: {},
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 16,
    backgroundColor: theme.inputBg,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: theme.text },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotText: { fontSize: 13, color: theme.primary, fontWeight: '700' },

  signInButton: {
    backgroundColor: theme.primary,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 28px rgba(37,99,235,0.35)' }
      : { shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 }),
  },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.borderLight },
  dividerText: { paddingHorizontal: 12, fontSize: 12, fontWeight: '700', color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },

  devButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' },
  devButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
  },
  devButtonAdmin: { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  devButtonText: { fontSize: 13, fontWeight: '800', color: theme.text },

  ssoButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: theme.border,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primarySoft,
  },
  ssoIcon: { marginRight: 10 },
  ssoButtonText: { color: theme.primary, fontSize: 15, fontWeight: '800' },
  });
}

export default LoginScreen;
