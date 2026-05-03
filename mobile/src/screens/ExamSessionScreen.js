import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { showAlert, showConfirm } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';

const ExamSessionScreen = ({ route, navigation }) => {
  const { examId } = route.params;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    startSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timeLeft <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft > 0]);

  const startSession = async () => {
    try {
      const res = await apiClient.post('/exams/start', { examId });
      if (res.data.success) {
        const { duration, exam } = res.data.data;
        setQuestions(exam?.questions || []);
        setTimeLeft(duration * 60);
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to start exam session');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);
    try {
      await apiClient.post('/exams/submit', {
        examId,
        answers: questions.map((q, index) => ({
          questionId: q._id,
          studentAnswer: answers[index] || '',
        })),
      });
      showAlert('Submitted', 'Exam submitted successfully!', () => navigation.navigate('Exams'));
    } catch (error) {
      hasSubmittedRef.current = false;
      showAlert('Error', error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmit = async () => {
    if (hasSubmittedRef.current) return;
    showAlert('Time up', 'Submitting automatically…');
    await submitExam();
  };

  const selectAnswer = (questionIndex, answer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Starting exam…</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const urgent = timeLeft < 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.timerHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View
          style={[
            styles.timerContainer,
            { backgroundColor: urgent ? theme.accentSoft : theme.surface },
          ]}
        >
          <MaterialCommunityIcons name="timer-sand" size={20} color={urgent ? theme.error : theme.textSecondary} />
          <Text style={[styles.timerText, { color: urgent ? theme.error : theme.text }]}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <TouchableOpacity
          style={[styles.reviewToggleBtn, { backgroundColor: showReview ? theme.accent : theme.surface, borderColor: theme.border }]}
          onPress={() => setShowReview(!showReview)}
        >
          <MaterialCommunityIcons name={showReview ? 'eye-off-outline' : 'eye-outline'} size={18} color={showReview ? '#FFF' : theme.textSecondary} />
          <Text style={[styles.reviewToggleText, { color: showReview ? '#FFF' : theme.textSecondary }]}>{showReview ? 'Hide' : 'Review'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.primary }, submitting && { opacity: 0.6 }]}
          onPress={() => {
            const answered = Object.keys(answers).filter(k => answers[k] && answers[k].toString().trim()).length;
            const unanswered = questions.length - answered;
            const msg = unanswered > 0
              ? `You have answered ${answered}/${questions.length} questions. ${unanswered} unanswered. Submit anyway?`
              : `You have answered all ${questions.length} questions. Ready to submit?`;
            showConfirm('Confirm Submit', msg, () => submitExam(), 'Submit');
          }}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* REVIEW PANEL */}
        {showReview && (
          <View style={[styles.reviewPanel, { backgroundColor: theme.card, borderColor: theme.accent }, cardShadowStyle(theme)]}>
            <Text style={[styles.reviewTitle, { color: theme.accent }]}>📋 Answer Preview</Text>
            {questions.map((q, idx) => {
              const ans = answers[idx];
              const hasAnswer = ans && ans.toString().trim();
              return (
                <TouchableOpacity key={idx} style={[styles.reviewItem, { borderBottomColor: theme.borderLight }]} onPress={() => { setCurrentIndex(idx); setShowReview(false); }}>
                  <View style={[styles.reviewQBadge, { backgroundColor: hasAnswer ? theme.primarySoft : theme.accentSoft }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: hasAnswer ? theme.primary : theme.warning }}>Q{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }} numberOfLines={1}>{q.questionText}</Text>
                    <Text style={{ fontSize: 12, color: hasAnswer ? theme.success : theme.error, marginTop: 2, fontWeight: '700' }}>
                      {hasAnswer ? `✓ ${ans}` : '✗ Not answered'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {currentQ ? (
          <View style={[styles.questionCard, cardShadowStyle(theme), { borderColor: theme.border }]}>
            <View style={styles.questionHeader}>
              <View style={[styles.qBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.qBadgeText}>Q{currentIndex + 1}</Text>
              </View>
              <Text style={[styles.marksBadge, { color: theme.textSecondary }]}>
                {currentQ.marks || 1} mark{(currentQ.marks || 1) > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.questionText}</Text>

            {currentQ.options && currentQ.options.length > 0 ? (
              <View style={styles.optionsContainer}>
                {currentQ.options.map((option, idx) => {
                  const selected = answers[currentIndex] === option;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionBtn,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.inputBg,
                        },
                        selected && {
                          borderColor: theme.primary,
                          backgroundColor: theme.primarySoft,
                        },
                      ]}
                      onPress={() => selectAnswer(currentIndex, option)}
                    >
                      <View
                        style={[
                          styles.optionRadio,
                          { borderColor: theme.textTertiary },
                          selected && { borderColor: theme.primary },
                        ]}
                      >
                        {selected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme.textSecondary },
                          selected && { color: theme.text, fontWeight: '700' },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View>
                <Text style={[styles.noOptionsText, { color: theme.textTertiary }]}>
                  Short answer — type your response below.
                </Text>
                <TextInput
                  style={[
                    styles.typedAnswerInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: answers[currentIndex] ? theme.primary : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={answers[currentIndex] || ''}
                  onChangeText={(text) => selectAnswer(currentIndex, text)}
                  placeholder="Type your answer here…"
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navBtn, currentIndex === 0 && { opacity: 0.35 }]}
                onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.navBtnText, { color: theme.primary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, currentIndex === questions.length - 1 && { opacity: 0.35 }]}
                onPress={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
              >
                <Text style={[styles.navBtnText, { color: theme.primary }]}>Next</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={theme.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.questionPlaceholder, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={44} color={theme.textTertiary} />
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
              No questions for this exam.
            </Text>
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
    loadingText: { marginTop: 12, fontSize: 15 },
    timerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    timerText: { fontSize: 18, fontWeight: '800', marginLeft: 8 },
    progressText: { fontSize: 14, fontWeight: '700' },
    submitBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: theme.radiusMd },
    submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    reviewToggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radiusMd, borderWidth: 1 },
    reviewToggleText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
    reviewPanel: { borderRadius: theme.radiusLg, padding: 16, marginBottom: 16, borderWidth: 1.5 },
    reviewTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
    reviewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    reviewQBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    questionCard: {
      backgroundColor: theme.card,
      borderRadius: theme.radiusXl,
      padding: 22,
      borderWidth: 1,
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    qBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radiusSm },
    qBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    marksBadge: { fontSize: 13, fontWeight: '700' },
    questionText: { fontSize: 17, fontWeight: '700', lineHeight: 26, marginBottom: 22 },
    optionsContainer: { marginBottom: 8 },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1.5,
      borderRadius: theme.radiusMd,
      marginBottom: 12,
    },
    optionRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    radioInner: { width: 12, height: 12, borderRadius: 6 },
    optionText: { fontSize: 15, flex: 1, lineHeight: 22 },
    noOptionsText: { fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
    typedAnswerInput: {
      borderWidth: 1.5,
      borderRadius: theme.radiusMd,
      padding: 16,
      fontSize: 15,
      minHeight: 120,
      lineHeight: 23,
      marginBottom: 16,
    },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    navBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    navBtnText: { fontSize: 15, fontWeight: '700' },
    questionPlaceholder: {
      borderRadius: theme.radiusLg,
      padding: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    placeholderText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  });
}

export default ExamSessionScreen;
