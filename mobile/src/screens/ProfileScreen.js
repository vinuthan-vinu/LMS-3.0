import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/client';
import { showAlert, showConfirm } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import { clearAuthCredentials, getStoredUser, setStoredUser } from '../storage/authStorage';
import { resolveAssetUrl } from '../utils/assetHelper';
import { navigateToRoute } from '../navigation/navigateCompatible';

const StatCard = ({ theme, title, value, icon, color }) => (
  <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
    <View style={[styles.statIcon, { backgroundColor: theme.surface }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
  </View>
);

const MenuItem = ({ theme, icon, title, sub, onPress }) => (
  <TouchableOpacity style={styles.menuItemPress} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuLeft}>
      <View style={[styles.menuIconBg, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name={icon} size={21} color={theme.primary} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {sub ? <Text style={[styles.menuSub, { color: theme.textSecondary }]}>{sub}</Text> : null}
      </View>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textTertiary} />
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    avgScore: '0.0%',
    examsPassed: '0 / 0',
    standing: 'Good',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const cached = await getStoredUser();
      if (cached) setUser(cached);

      const resultsRes = await apiClient.get('/exams/my-results');
      if (resultsRes.data.success) {
        const results = resultsRes.data.data;
        const avg =
          results.length > 0
            ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(1)
            : '0.0';

        setStats({
          avgScore: `${avg}%`,
          examsPassed: `${results.filter((r) => r.isPassed).length} / ${results.length}`,
          standing: parseFloat(avg) > 80 ? 'Excellent' : 'Good',
        });
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthCredentials();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      navigateToRoute(navigation, 'Login');
    }
  };

  const handleEditProfile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (result.canceled) return;

      setUploading(true);
      const selectedImage = result.assets[0];
      const formData = new FormData();

      if (Platform.OS === 'web' && selectedImage.file) {
        formData.append('avatar', selectedImage.file);
      } else {
        formData.append('avatar', {
          uri: selectedImage.uri,
          name: selectedImage.name || 'avatar.jpg',
          type: selectedImage.mimeType || 'image/jpeg',
        });
      }

      const res = await apiClient.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);
        await setStoredUser(updatedUser);
        showAlert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, flex: 1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const isAdmin = typeof user?.role === 'string' && user.role.trim().toLowerCase() === 'admin';
  const isTeacher = typeof user?.role === 'string' && user.role.trim().toLowerCase() === 'teacher';
  const host = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace('/api', '') : '';
  const avatarUri = user?.avatar?.startsWith('/uploads') ? host + user.avatar : (user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.heroStripe, { backgroundColor: theme.heroTop }]}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.heroBottom, opacity: 0.35 }]} />
          <View style={styles.heroStripeInner}>
            <Text style={styles.heroLabel}>PROFILE</Text>
            <Text style={styles.heroTitle}>Your space</Text>
          </View>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
          <View style={styles.avatarContainer}>
            <Image
              source={user?.avatar ? { uri: resolveAssetUrl(user.avatar) } : { uri: 'https://ui-avatars.com/api/?name=' + (user?.firstName || 'User') + '&background=random' }}
              style={styles.avatar}
            />{uploading ? (
              <View style={[styles.editBadge, { backgroundColor: theme.surface, borderColor: theme.card }]}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.card }]}
                onPress={handleEditProfile}
              >
                <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.name, { color: theme.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? theme.accent : theme.primary }]}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        {!isAdmin && (
          <View style={styles.statsGrid}>
            <StatCard theme={theme} title="Avg score" value={stats.avgScore} icon="chart-box-outline" color={theme.primary} />
            <StatCard theme={theme} title="Passed" value={stats.examsPassed} icon="check-decagram-outline" color={theme.secondary} />
            <StatCard theme={theme} title="Standing" value={stats.standing} icon="school-outline" color={theme.accent} />
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>Settings</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, cardShadowStyle(theme)]}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: theme.primarySoft }]}>
                <MaterialCommunityIcons
                  name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                  size={20}
                  color={isDarkMode ? theme.accent : theme.primary}
                />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Appearance</Text>
                <Text style={[styles.menuSub, { color: theme.textSecondary }]}>Dark mode</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary + '99' }}
              thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {(isAdmin || isTeacher) && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{isTeacher ? 'Teaching' : 'Administration'}</Text>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.accent + '44' },
                cardShadowStyle(theme),
              ]}
            >
              <MenuItem
                theme={theme}
                icon={isTeacher ? 'teach' : 'shield-crown-outline'}
                title={isTeacher ? 'Teacher dashboard' : 'Dashboard'}
                sub={isTeacher ? 'Schedules, resources, exams' : 'Full control panel'}
                onPress={() => navigateToRoute(navigation, 'AdminDashboard')}
              />
              {isAdmin && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                  <MenuItem
                    theme={theme}
                    icon="account-group-outline"
                    title="Users & billing"
                    sub="Opens admin dashboard"
                    onPress={() => navigateToRoute(navigation, 'AdminDashboard')}
                  />
                </>
              )}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>Learning</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, cardShadowStyle(theme)]}>
          <MenuItem
            theme={theme}
            icon="credit-card-outline"
            title="Payments"
            sub="Slips & status"
            onPress={() => navigateToRoute(navigation, 'Payments')}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          <MenuItem
            theme={theme}
            icon="certificate-outline"
            title="Exams & results"
            sub="Attempts & grades"
            onPress={() => navigateToRoute(navigation, 'Exams')}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.error + '14',
              borderColor: theme.error + '40',
            },
          ]}
          onPress={() => {
            if (Platform.OS === 'web') {
              handleLogout();
            } else {
              showConfirm('Sign Out', 'Are you sure you want to sign out?', handleLogout, 'Sign Out');
            }
          }}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout-variant" size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Sign out</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 24 },
  center: { justifyContent: 'center', alignItems: 'center' },
  heroStripe: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: -36,
    zIndex: 0,
  },
  heroStripeInner: { zIndex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 8 },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 48,
    zIndex: 1,
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4 },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  name: { fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  email: { fontSize: 14, marginTop: 6, fontWeight: '500' },
  roleBadge: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between', marginBottom: 22 },
  statCard: {
    width: '31%',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 15, fontWeight: '800' },
  statTitle: { fontSize: 10, marginTop: 4, fontWeight: '700', textAlign: 'center' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginLeft: 24,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuItemPress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTitle: { fontSize: 16, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  divider: { height: 1, marginLeft: 70 },
  logoutBtn: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: { marginLeft: 10, fontSize: 16, fontWeight: '700' },
});

export default ProfileScreen;
