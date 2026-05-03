import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { showAlert } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import { resolveAssetUrl } from '../utils/assetHelper';

const ResourceItem = ({ theme, title, course, date, sizeLabel, type, url }) => {
  const iconName = type === 'pdf' ? 'file-pdf-box' : type === 'video' ? 'play-circle' : 'file-document-outline';
  const accent = type === 'pdf' ? theme.error : type === 'video' ? theme.primary : theme.secondary;

  const handleOpen = async () => {
    if (!url) return showAlert('Unavailable', 'This resource has no link yet.');
    try {
      const fullUrl = resolveAssetUrl(url);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const absoluteUrl = new URL(fullUrl, window.location.href).toString();
        const opened = window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          window.location.assign(absoluteUrl);
        }
        return;
      }
      await Linking.openURL(fullUrl);
    } catch {
      showAlert('Error', 'Could not open resource.');
    }
  };

  return (
    <View style={[styles.resourceCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
      <View style={styles.resourceTop}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name={iconName} size={24} color={accent} />
        </View>
        <View style={[styles.availBadge, { backgroundColor: theme.primarySoft }]}>
          <MaterialCommunityIcons name="check-decagram-outline" size={14} color={theme.primary} />
          <Text style={[styles.availText, { color: theme.primary }]}>Available</Text>
        </View>
      </View>
      <Text style={[styles.resourceTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.resourceCourse, { color: theme.textSecondary }]}>{course}</Text>

      <View style={[styles.resourceFooter, { borderTopColor: theme.borderLight }]}>
        <Text style={[styles.resourceMeta, { color: theme.textTertiary }]}>
          {date} · {sizeLabel}
        </Text>
        <TouchableOpacity style={[styles.openBtn, { backgroundColor: theme.primary }]} onPress={handleOpen} activeOpacity={0.9}>
          <Text style={styles.openBtnText}>Open</Text>
          <MaterialCommunityIcons name="open-in-new" size={16} color="#FFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ResourcesScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useFocusEffect(
    useCallback(() => {
      fetchResources();
    }, [])
  );

  const fetchResources = async (isRefresh = false) => {
    try {
      const response = await apiClient.get('/resources/my-resources');
      if (response.data.success) {
        setResources(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'PDFs' && item.type === 'pdf') ||
      (activeTab === 'Videos' && item.type === 'video');
    return matchesSearch && matchesTab;
  });

  const progress = resources.length === 0 ? 0 : Math.min(100, Math.round((resources.length / (resources.length + 3)) * 100));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.top, { backgroundColor: theme.card }, cardShadowStyle(theme)]}>
        <Text style={[styles.overline, { color: theme.textTertiary }]}>library</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Resources</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Materials from your enrolled courses — open anytime.
        </Text>
      </View>

      <View style={[styles.searchSection, { backgroundColor: theme.card, borderBottomColor: theme.borderLight }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by title or course..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabScrollInner}>
          {['All', 'PDFs', 'Videos'].map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? theme.primarySoft : theme.surface,
                    borderColor: active ? theme.primary : theme.borderLight,
                  },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabPillText, { color: active ? theme.primary : theme.textSecondary }]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResources(true); }} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          <View style={[styles.trackerCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <View style={[styles.trackerDot, { backgroundColor: theme.secondarySoft }]}>
                  <MaterialCommunityIcons name="progress-clock" size={18} color={theme.secondary} />
                </View>
                <View>
                  <Text style={[styles.trackerTitle, { color: theme.text }]}>This term</Text>
                  <Text style={[styles.trackerHint, { color: theme.textSecondary }]}>{resources.length} materials</Text>
                </View>
              </View>
              <View style={[styles.termBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.termBadgeText}>Live</Text>
              </View>
            </View>
            <View style={[styles.trackerProgressBg, { backgroundColor: theme.surface }]}>
              <View style={[styles.trackerProgressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>

          {filteredResources.length > 0 ? (
            filteredResources.map((item) => (
              <ResourceItem
                key={item._id}
                theme={theme}
                title={item.title}
                course={`${item.course?.courseCode || ''} · ${item.course?.title || 'Course'}`}
                date={new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                sizeLabel={
                  item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Online'
                }
                type={item.type}
                url={item.fileUrl}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No resources match filters.</Text>
          )}
          <View style={{ height: 96 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 16, paddingBottom: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.9 },
  headerSubtitle: { fontSize: 14, marginTop: 10, lineHeight: 21, fontWeight: '500' },
  searchSection: { paddingBottom: 14, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
  tabScroll: { marginTop: 14, maxHeight: 44 },
  tabScrollInner: { paddingHorizontal: 20 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
  },
  tabPillText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  trackerCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  trackerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  trackerDot: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  trackerTitle: { fontSize: 16, fontWeight: '800' },
  trackerHint: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  termBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  termBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  trackerProgressBg: { height: 8, borderRadius: 999, overflow: 'hidden' },
  trackerProgressFill: { height: '100%', borderRadius: 999 },
  resourceCard: { borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1 },
  resourceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  availBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  availText: { fontSize: 11, fontWeight: '800', marginLeft: 5 },
  resourceTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.25, marginBottom: 6, lineHeight: 23 },
  resourceCourse: { fontSize: 13, fontWeight: '500', marginBottom: 14, lineHeight: 18 },
  resourceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1 },
  resourceMeta: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  openBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  openBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 36, fontSize: 15, fontWeight: '600' },
});

export default ResourcesScreen;
