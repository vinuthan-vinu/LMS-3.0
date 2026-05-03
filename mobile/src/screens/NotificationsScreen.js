import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import { getStoredUser } from '../storage/authStorage';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      const response = await apiClient.get('/notifications');
      if (response.data.success) {
        const list = response.data.data || [];
        setNotifications(list);
        const user = await getStoredUser();
        const userId = user?._id || user?.id;
        const unread = userId
          ? list.filter((n) => !(n.isReadBy || []).some((id) => String(id) === String(userId)))
          : [];
        unread.slice(0, 20).forEach((notification) => {
          apiClient.put(`/notifications/${notification._id}/read`).catch(() => null);
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>Announcements and updates from your instructors.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <View key={n._id} style={[styles.notificationCard, cardShadowStyle(theme)]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                  <MaterialCommunityIcons
                    name={n.type === 'alert' ? 'alert-circle' : 'bell'}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.metaContainer}>
                  <Text style={styles.title}>{n.title}</Text>
                  <Text style={styles.date}>
                    {new Date(n.createdAt).toLocaleDateString()} •{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: theme.surface }]}>
                  <Text style={styles.typeText}>{n.type}</Text>
                </View>
              </View>
              <Text style={styles.message}>{n.message}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, cardShadowStyle(theme)]}>
            <MaterialCommunityIcons name="bell-off" size={50} color={theme.textTertiary} />
            <Text style={styles.emptyText}>No notifications right now.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 18,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 8, lineHeight: 20 },
    scrollContent: { padding: 20, paddingBottom: 32 },
    notificationCard: {
      backgroundColor: theme.card,
      borderRadius: theme.radiusLg,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.radiusMd,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metaContainer: { flex: 1 },
    title: { fontSize: 16, fontWeight: '700', color: theme.text },
    date: { fontSize: 12, color: theme.textTertiary, marginTop: 4 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radiusSm },
    typeText: { fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' },
    message: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      backgroundColor: theme.card,
      borderRadius: theme.radiusXl,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyText: { color: theme.textSecondary, fontSize: 15, marginTop: 14, textAlign: 'center' },
  });
}

export default NotificationsScreen;
