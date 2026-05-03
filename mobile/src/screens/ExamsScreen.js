import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';

const SectionLabel = ({ theme, text }) => (
  <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>{text}</Text>
);

const StatBox = ({ theme, icon, label, value, accent }) => (
  <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
    <View style={[styles.statIcon, { backgroundColor: theme.surface }]}>
      <MaterialCommunityIcons name={icon} size={22} color={accent} />
    </View>
    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

const Meta = ({ theme, icon, text }) => (
  <View style={styles.metaItem}>
    <MaterialCommunityIcons name={icon} size={17} color={theme.textSecondary} />
    <Text style={[styles.metaText, { color: theme.textSecondary }]}>{text}</Text>
  </View>
);

const ExamCard = ({ theme, title, course, duration, questions, onPress }) => (
  <View style={[styles.examCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
    <View style={[styles.dueBadge, { backgroundColor: theme.accentSoft }]}>
      <MaterialCommunityIcons name="alarm-panel-outline" size={13} color={theme.warning} />
      <Text style={[styles.dueText, { color: theme.warning }]}>Timed</Text>
    </View>
    <Text style={[styles.examTitle, { color: theme.text }]}>{title}</Text>
    <Text style={[styles.examCourse, { color: theme.textSecondary }]}>{course}</Text>

    <View style={styles.examMeta}>
      <Meta theme={theme} icon="timer-outline" text={duration} />
      <Meta theme={theme} icon="format-list-checks" text={questions} />
    </View>

    <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.startBtnText}>Begin session</Text>
      <MaterialCommunityIcons name="play-circle-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  </View>
);

const ResultItem = ({ theme, title, course, score, status, date }) => (
  <View style={styles.resultItem}>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={[styles.resultTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.resultMeta, { color: theme.textSecondary }]}>
        {course} · {date}
      </Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[styles.resultScore, { color: theme.text }]}>{score}</Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: status === 'Pass' ? theme.secondarySoft : 'rgba(220, 38, 38, 0.12)' },
        ]}
      >
        <Text style={[styles.statusText, { color: status === 'Pass' ? theme.secondary : theme.error }]}>{status}</Text>
      </View>
    </View>
  </View>
);

const ExamsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async (isRefresh = false) => {
    try {
      const [examsRes, resultsRes] = await Promise.all([
        apiClient.get('/exams/my-exams'),
        apiClient.get('/exams/my-results'),
      ]);

      if (examsRes.data.success) setExams(examsRes.data.data);
      if (resultsRes.data.success) setResults(resultsRes.data.data);
    } catch (error) {
      console.error('Error fetching exams data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const averageScore =
    results.length > 0
      ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(1)
      : '0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }, cardShadowStyle(theme)]}>
        <Text style={[styles.overline, { color: theme.textTertiary }]}>assessments</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Exams & results</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Upcoming quizzes and your graded history — all in one place.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          <View style={styles.statsContainer}>
            <StatBox theme={theme} icon="chart-line" label="Average" value={`${averageScore}%`} accent={theme.primary} />
            <StatBox theme={theme} icon="certificate-outline" label="Passed" value={`${results.filter((r) => r.isPassed).length}/${results.length}`} accent={theme.secondary} />
            <StatBox theme={theme} icon="school-outline" label="Standing" value={parseFloat(averageScore) > 80 ? 'Top' : 'Good'} accent={theme.accent} />
          </View>

          <SectionLabel theme={theme} text="Scheduled" />
          {exams.length > 0 ? (
            exams.map((exam) => (
              <ExamCard
                key={exam._id}
                theme={theme}
                title={exam.title}
                course={`${exam.course?.courseCode} · ${exam.course?.title}`}
                duration={`${exam.duration} min`}
                questions={`${exam.questions?.length || 0} Qs`}
                onPress={() => navigation.navigate('ExamSession', { examId: exam._id })}
              />
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }, cardShadowStyle(theme)]}>
              <MaterialCommunityIcons name="coffee-outline" size={40} color={theme.primary} style={{ opacity: 0.4 }} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No exams lined up.</Text>
            </View>
          )}

          <SectionLabel theme={theme} text="Past results" />
          <View style={[styles.resultsCard, { backgroundColor: theme.card, borderColor: theme.borderLight }, cardShadowStyle(theme)]}>
            {results.length > 0 ? (
              results.map((result, index) => (
                <React.Fragment key={result._id}>
                  <ResultItem theme={theme} title={result.exam?.title} course={result.exam?.course?.courseCode} score={`${result.percentage}%`} status={result.isPassed ? 'Pass' : 'Fail'} date={new Date(result.submittedAt).toLocaleDateString()} />
                  {index < results.length - 1 ? <View style={[styles.divider, { backgroundColor: theme.borderLight }]} /> : null}
                </React.Fragment>
              ))
            ) : (
              <Text style={[styles.innerEmpty, { color: theme.textSecondary }]}>No graded attempts yet.</Text>
            )}
          </View>

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
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    marginBottom: 4,
  },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.9 },
  headerSubtitle: { fontSize: 14, marginTop: 10, lineHeight: 21 },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 13,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2, fontWeight: '700', textAlign: 'center' },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 16,
    marginLeft: 2,
  },
  examCard: { borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
  dueText: { fontSize: 10, fontWeight: '800', marginLeft: 5, letterSpacing: 0.2 },
  examTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.35, marginBottom: 6, lineHeight: 24 },
  examCourse: { fontSize: 13, fontWeight: '500', marginBottom: 14, lineHeight: 18 },
  examMeta: { flexDirection: 'row', marginBottom: 18, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 18, marginBottom: 4 },
  metaText: { fontSize: 13, marginLeft: 6, fontWeight: '600' },
  startBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 10px 24px rgba(91,77,255,0.38)' } }) },
  startBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  resultsCard: { borderRadius: 18, paddingVertical: 6, borderWidth: 1 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  resultTitle: { fontSize: 15, fontWeight: '800' },
  resultMeta: { fontSize: 12, marginTop: 5, fontWeight: '500' },
  resultScore: { fontSize: 17, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  divider: { height: 1, marginLeft: 16, marginRight: 16 },
  emptyCard: { borderRadius: 18, padding: 36, alignItems: 'center', borderWidth: 1, marginBottom: 14 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 12, fontWeight: '600' },
  innerEmpty: { padding: 24, textAlign: 'center', fontSize: 14, fontWeight: '600' },
});

export default ExamsScreen;
