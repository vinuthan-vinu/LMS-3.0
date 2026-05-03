import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import { resolveAssetUrl } from '../utils/assetHelper';
import { getStoredUser } from '../storage/authStorage';
import { navigateToRoute } from '../navigation/navigateCompatible';

// --- Sub-components (function declarations are hoisted and safer) ---
function LinearIconWrap({ children, color, tint }) {
  return <View style={[styles.quickActionIcon, { backgroundColor: color }]}>{children}</View>;
}

function StatBox({ theme, color, icon, value, label }) {
  if (!theme) return null;
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: theme.card, borderColor: theme.borderLight },
        cardShadowStyle(theme),
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name={icon || 'help-circle'} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function CourseCard({ theme, title, category, progress, image }) {
  if (!theme) return null;
  return (
    <View
      style={[
        styles.courseCard,
        { backgroundColor: theme.card, borderColor: theme.borderLight },
        cardShadowStyle(theme),
      ]}
    >
      <Image source={{ uri: resolveAssetUrl(image) || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.categoryText, { color: theme.primary }]}>{category}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.surface }]}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress || 0, 100)}%`, backgroundColor: theme.primary }]} />
          </View>
          <Text style={[styles.progressPercent, { color: theme.textTertiary }]}>{progress || 0}%</Text>
        </View>
      </View>
    </View>
  );
}

const DashboardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ passed: 0, total: 0, avg: '0' });
  const [unreadCount, setUnreadCount] = useState(0);

  const fabBottom = Platform.OS === 'ios' ? 108 : 92;

  const fetchData = async (isRefresh = false) => {
    try {
      const cachedUser = await getStoredUser();
      if (cachedUser) setUser(cachedUser);

      const [enrollRes, resultsRes, notificationsRes] = await Promise.all([
        apiClient.get('/enrollments/my-enrollments', { params: { limit: 100 } }).catch(() => null),
        apiClient.get('/exams/my-results').catch(() => null),
        apiClient.get('/notifications').catch(() => null),
      ]);

      if (enrollRes?.data?.success) {
        setEnrollments(enrollRes.data.data.enrollments || []);
      }

      if (resultsRes?.data?.success) {
        const results = resultsRes.data.data || [];
        const passed = results.filter((r) => r.isPassed).length;
        const avg =
          results.length > 0
            ? (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(0)
            : '0';
        setStats({ passed, total: results.length, avg });
      }

      if (notificationsRes?.data?.success && cachedUser) {
        const userId = cachedUser._id || cachedUser.id;
        const unread = (notificationsRes.data.data || []).filter(
          (notification) => !(notification.isReadBy || []).some((id) => String(id) === String(userId))
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, flex: 1 }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={[styles.hero, { borderRadius: theme.radiusXl }, cardShadowStyle(theme)]}>
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.heroBottom }]}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: theme.heroTop, opacity: Platform.OS === 'web' ? 0.94 : 0.9 },
            ]}
          />
          <View pointerEvents="none" style={styles.heroPattern}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.heroOrb,
                  { opacity: 0.12 + i * 0.04, transform: [{ scale: 1 + i * 0.4 }, { translateX: i * 40 }] },
                ]}
              />
            ))}
          </View>
          <View style={styles.heroInner}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeEyebrow}>HOME</Text>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.firstName || 'Learner'}{' '}
                  {user?.lastName || ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.notificationBtn}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigateToRoute(navigation, 'Notifications')}
              >
                <MaterialCommunityIcons name="bell-outline" size={23} color="#FFFFFF" />
                {unreadCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
            <View style={styles.heroFoot}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color="rgba(255,255,255,0.9)" style={{ marginRight: 8 }} />
              <Text style={styles.bannerSubtitle}>
                {(enrollments || []).length} active course{(enrollments || []).length !== 1 ? 's' : ''} · keep momentum
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>Overview</Text>
        <View style={styles.statsRow}>
          <StatBox
            theme={theme}
            color={theme.primary}
            icon="book-open-variant"
            value={enrollments.length}
            label="Courses"
          />
          <StatBox
            theme={theme}
            color={theme.secondary}
            icon="checkbox-marked-circle-outline"
            value={`${stats.passed}/${stats.total}`}
            label="Passed"
          />
          <StatBox theme={theme} color={theme.accent} icon="chart-arc" value={`${stats.avg}%`} label="Avg" />
        </View>

        <TouchableOpacity
          style={[
            styles.quickAction,
            { backgroundColor: theme.card, borderColor: theme.borderLight },
            cardShadowStyle(theme),
          ]}
          onPress={() => navigateToRoute(navigation, 'Payments')}
          activeOpacity={0.92}
        >
          <LinearIconWrap color={theme.primarySoft} tint={theme.primary}>
            <MaterialCommunityIcons name="cash-check" size={22} color={theme.primary} />
          </LinearIconWrap>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>Payments & slips</Text>
            <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>
              Course ID · name on receipt · proof
            </Text>
          </View>
          <View style={[styles.chevronBg, { backgroundColor: theme.primarySoft }]}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.primary} />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionAccent, { backgroundColor: theme.accent }]} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>In progress</Text>
          </View>
          <TouchableOpacity hitSlop={12} onPress={() => navigateToRoute(navigation, 'Courses')}>
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {Array.isArray(enrollments) && enrollments.length > 0 ? (
          enrollments.map((item) => (
            <CourseCard
              theme={theme}
              key={item?._id || Math.random().toString()}
              title={item?.course?.title || 'Untitled'}
              category={item?.course?.category || 'General'}
              progress={item?.progress || 0}
              image={
                (item?.course?.thumbnail && item.course.thumbnail.startsWith('/uploads'))
                  ? `${apiClient.defaults.baseURL.replace('/api', '')}${item.course.thumbnail}`
                  : (item?.course?.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400')
              }
            />
          ))
        ) : (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              cardShadowStyle(theme),
            ]}
          >
            <MaterialCommunityIcons name="compass-outline" size={40} color={theme.primary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No courses yet — browse the catalog and enroll.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigateToRoute(navigation, 'Courses')}
            >
              <Text style={styles.emptyBtnTxt}>Explore courses</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 112 }} />
      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open assistant"
        style={[styles.fab, styles.fabSecondary, { backgroundColor: theme.accent, bottom: fabBottom + 74 }]}
        onPress={() => navigateToRoute(navigation, 'Chatbot')}
      >
        <MaterialCommunityIcons name="robot-outline" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Timetable"
        style={[styles.fab, { backgroundColor: theme.primary, bottom: fabBottom }]}
        onPress={() => navigateToRoute(navigation, 'Timetable')}
      >
        <MaterialCommunityIcons name="calendar-clock" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  hero: {
    overflow: 'hidden',
    marginBottom: 22,
  },
  heroPattern: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  heroOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    marginRight: -20,
    marginBottom: -40,
  },
  heroInner: {
    padding: 22,
    minHeight: 172,
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  welcomeEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  welcomeText: { fontSize: 15, color: 'rgba(255,255,255,0.88)', fontWeight: '500' },
  userName: { fontSize: 28, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.8, marginTop: 4 },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', lineHeight: 11 },
  heroFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  bannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: '600', flex: 1 },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 28,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickActionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  quickActionSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  chevronBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  sectionAccent: { width: 4, height: 18, borderRadius: 4, marginRight: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  viewAllText: { fontSize: 14, fontWeight: '700' },
  courseCard: {
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 112,
  },
  cardImage: { width: 108, height: '100%', minHeight: 112 },
  cardContent: { flex: 1, padding: 14, justifyContent: 'center' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  categoryText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2, lineHeight: 22 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressBarBg: { flex: 1, height: 7, borderRadius: 4, marginRight: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 12, fontWeight: '800', minWidth: 36 },
  emptyCard: { borderRadius: 22, padding: 26, alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 14, lineHeight: 21, fontWeight: '500' },
  emptyBtn: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 12px 28px rgba(91, 77, 255, 0.35)' },
    }),
  },
  fabSecondary: {
    shadowColor: '#F59E0B',
    ...Platform.select({
      web: { boxShadow: '0 12px 28px rgba(245, 158, 11, 0.38)' },
    }),
  },
});

export default DashboardScreen;
