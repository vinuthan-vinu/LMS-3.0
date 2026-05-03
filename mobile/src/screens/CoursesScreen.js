import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { showAlert } from '../utils/webAlert';
import { resolveAssetUrl } from '../utils/assetHelper';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import { getStoredUser } from '../storage/authStorage';

const categoryAccent = (cat, fallback) => {
  const map = {
    Programming: '#5B4DFF',
    Design: '#EC4899',
    Business: '#0D9F7A',
    Mathematics: '#3B82F6',
    Science: '#8B5CF6',
  };
  return map[cat] || fallback;
};

const CourseCard = ({ theme, accent, category, title, description, instructor, price, duration, image, onEnroll, isEnrolled }) => (
  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
    <ImageBackground source={{ uri: image }} style={styles.cardImage} imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
      <View style={styles.imgOverlay}>
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>{category}</Text>
        </View>
      </View>
    </ImageBackground>

    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="account-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{instructor}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{duration}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
        <Text style={[styles.priceText, { color: theme.text }]}>{price}</Text>
        <TouchableOpacity 
          style={[styles.enrollBtn, { backgroundColor: isEnrolled ? theme.success : accent, opacity: isEnrolled ? 0.7 : 1 }]} 
          onPress={isEnrolled ? null : onEnroll} 
          activeOpacity={0.9}
          disabled={isEnrolled}
        >
          <Text style={styles.enrollBtnText}>{isEnrolled ? 'Enrolled' : 'Enroll'}</Text>
          {!isEnrolled && <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const CoursesScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourses = async (isRefresh = false) => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/enrollments/my-enrollments', { params: { limit: 100 } }).catch(() => ({ data: { data: { enrollments: [] } } }))
      ]);

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data.courses);
      }
      if (enrollmentsRes?.data?.success) {
        setMyEnrollments(enrollmentsRes.data.data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [])
  );

  const handleEnroll = async (courseId) => {
    try {
      const snapshot = await getStoredUser();
      const studentId = snapshot ? snapshot._id || snapshot.id : '';

      const response = await apiClient.post('/enrollments/enroll', {
        course: courseId,
        student: studentId,
      });

      if (response.data.success) {
        showAlert('Success', 'You have enrolled. Await confirmation if pending.');
        fetchCourses();
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Enrollment failed');
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }, cardShadowStyle(theme)]}>
        <Text style={[styles.overline, { color: theme.textTertiary }]}>catalog</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find your course</Text>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search titles, subjects, skills..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(true); }} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const isEnrolled = myEnrollments.some(e => e.course?._id === course._id || e.course === course._id);
              return (
                <CourseCard
                  key={course._id}
                  theme={theme}
                  accent={categoryAccent(course.category, theme.primary)}
                  category={course.category}
                  title={course.title}
                  description={course.description}
                  instructor={`${course.teacher?.firstName || 'Prof.'} ${course.teacher?.lastName || ''}`}
                  price={`$${course.price}`}
                  duration={`${course.duration} wks`}
                  image={course.thumbnail ? resolveAssetUrl(course.thumbnail) : 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400'}
                  onEnroll={() => handleEnroll(course._id)}
                  isEnrolled={isEnrolled}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
                <MaterialCommunityIcons name="book-search-outline" size={52} color={theme.primary} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text }]}>Nothing matches yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Try another keyword.</Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    marginHorizontal: Platform.OS === 'web' ? 0 : undefined,
    zIndex: 2,
    borderBottomWidth: 1,
    borderColor: 'transparent',
  },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.9, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
  scrollContent: { padding: 20, paddingTop: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 48, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  cardImage: { width: '100%', height: 164 },
  imgOverlay: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(11,18,32,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardContent: { padding: 18 },
  cardTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.35, marginBottom: 8, lineHeight: 24 },
  cardDesc: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 18, marginBottom: 4 },
  metaText: { fontSize: 12, marginLeft: 5, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  enrollBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(91,77,255,0.35)' },
    }),
  },
  enrollBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default CoursesScreen;
