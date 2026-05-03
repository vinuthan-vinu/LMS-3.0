import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { showAlert } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TimetableScreen = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Mon');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await apiClient.get('/enrollments/my-enrollments', { params: { limit: 100 } });
      if (response.data.success) {
        const enrollments = response.data.data.enrollments || [];
        const courseSchedules = enrollments
          .filter((e) => e.status === 'approved' && e.course?.schedule)
          .map((e) => ({
            title: e.course.title,
            code: e.course.courseCode,
            schedule: e.course.schedule || {},
          }));
        setSchedule(courseSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassesForDay = () =>
    schedule.filter(
      (course) =>
        course.schedule.days &&
        course.schedule.days.some((d) => d.toLowerCase().startsWith(selectedDay.toLowerCase()))
    );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const classesToday = getClassesForDay();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable</Text>
        <Text style={styles.headerSubtitle}>Live sessions from your approved enrollments.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.dayBarWrap, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.dayBarContent}
      >
        {DAYS.map((day) => {
          const active = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayTab,
                { backgroundColor: theme.surface },
                active && { backgroundColor: theme.primary },
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: theme.textSecondary },
                  active && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{selectedDay}</Text>

        {classesToday.length > 0 ? (
          classesToday.map((item, index) => (
            <View key={`${item.code}-${index}`} style={[styles.classCard, cardShadowStyle(theme)]}>
              <View style={[styles.timeBadge, { backgroundColor: theme.primarySoft }]}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.timeText, { color: theme.primary }]}>
                  {item.schedule.startTime || '09:00 AM'} –{' '}
                  {item.schedule.endTime || '11:00 AM'}
                </Text>
              </View>
              <View style={styles.classContent}>
                <Text style={styles.classTitle}>{item.title}</Text>
                <Text style={styles.classCode}>{item.code}</Text>
                <TouchableOpacity
                  style={[styles.liveBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    const meetUrl = item.schedule.meetLink || 'https://meet.google.com';
                    Linking.openURL(meetUrl).catch(() =>
                      showAlert('Info', 'Link will open when class is active.')
                    );
                  }}
                >
                  <MaterialCommunityIcons name="video-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.liveBtnText}>Join session</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, cardShadowStyle(theme)]}>
            <MaterialCommunityIcons name="calendar-blank" size={52} color={theme.textTertiary} />
            <Text style={styles.emptyText}>Nothing scheduled for this day.</Text>
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
      paddingBottom: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 8 },
    dayBarWrap: {
      maxHeight: 58,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
    },
    dayBarContent: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    dayTab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radiusMd, marginRight: 8 },
    dayText: { fontSize: 13, fontWeight: '700' },
    scrollContent: { padding: 20, paddingBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 16 },
    classCard: {
      marginBottom: 14,
      backgroundColor: theme.card,
      borderRadius: theme.radiusLg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    timeText: { fontSize: 12, fontWeight: '800', flex: 1, flexWrap: 'wrap' },
    classContent: { padding: 16 },
    classTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    classCode: { fontSize: 14, color: theme.textSecondary, marginTop: 4, marginBottom: 14 },
    liveBtn: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.radiusMd,
    },
    liveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    emptyCard: {
      alignItems: 'center',
      padding: 44,
      backgroundColor: theme.card,
      borderRadius: theme.radiusXl,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyText: { color: theme.textSecondary, fontSize: 15, marginTop: 12, textAlign: 'center' },
  });
}

export default TimetableScreen;
