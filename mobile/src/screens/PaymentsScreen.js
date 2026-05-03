import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/client';
import { showAlert } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';

const PaymentsScreen = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [payerNameOnSlip, setPayerNameOnSlip] = useState('');
  const [manualCourseId, setManualCourseId] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [paymentsRes, coursesRes] = await Promise.all([
        apiClient.get('/payments/history').catch(() => null),
        apiClient.get('/courses').catch(() => null),
      ]);

      if (paymentsRes?.data.success) setPayments(paymentsRes.data.data || []);
      if (coursesRes?.data.success) setCourses(coursesRes.data.data.courses || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setManualCourseId(course._id || '');
    setAmount(String(course.price ?? ''));
  };

  const syncCourseFromManualId = (text) => {
    setManualCourseId(text);
    const t = text.trim();
    if (!t) {
      setSelectedCourse(null);
      return;
    }
    const matched = courses.find((c) => String(c._id) === t);
    if (matched) {
      setSelectedCourse(matched);
      setAmount(String(matched.price ?? ''));
    }
  };

  const getCourseIdForUpload = () => {
    const fromField = manualCourseId.trim();
    if (fromField) return fromField;
    return selectedCourse?._id ? String(selectedCourse._id) : '';
  };

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });
      if (result.canceled) return;
      setSelectedImage(result.assets[0]);
    } catch {
      showAlert('Error', 'Failed to pick image');
    }
  };

  const handleUploadProof = async () => {
    const courseId = getCourseIdForUpload();
    if (!courseId) return showAlert('Error', 'Select a course from the list or paste the course ID (Mongo ObjectId)');
    if (!selectedImage) return showAlert('Error', 'Please select a payment slip image');
    if (!amount) return showAlert('Error', 'Please enter payment amount');
    const nameTrim = payerNameOnSlip.trim();
    if (!nameTrim) return showAlert('Error', 'Enter your full name exactly as shown on your payment slip');

    setUploading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web' && selectedImage.file) {
        formData.append('proof', selectedImage.file);
      } else {
        formData.append('proof', {
          uri: selectedImage.uri,
          name: selectedImage.name || 'payment.jpg',
          type: selectedImage.mimeType || 'image/jpeg',
        });
      }

      formData.append('amount', amount);
      formData.append('course', courseId);
      formData.append('notes', notes);
      formData.append('payerNameOnSlip', nameTrim);

      const response = await apiClient.post('/payments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        showAlert('Success', 'Payment proof uploaded! Pending admin verification.');
        setSelectedCourse(null);
        setManualCourseId('');
        setSelectedImage(null);
        setAmount('');
        setNotes('');
        setPayerNameOnSlip('');
        fetchInitialData();
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  const statusTone = (status) => {
    if (status === 'verified')
      return { bg: theme.secondarySoft, fg: theme.success };
    if (status === 'rejected') return { bg: 'rgba(220,38,38,0.12)', fg: theme.error };
    return { bg: theme.accentSoft, fg: theme.warning };
  };

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
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.subtitle}>Submit proof of payment and track verification status.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.uploadSection, cardShadowStyle(theme)]}>
          <Text style={styles.sectionTitle}>Submit proof</Text>

          <Text style={styles.inputLabel}>Select course</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseSelector}>
            {courses.map((course) => (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseItem,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  selectedCourse?._id === course._id && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => handleSelectCourse(course)}
              >
                <Text
                  style={[
                    styles.courseItemText,
                    { color: theme.textSecondary },
                    selectedCourse?._id === course._id && { color: '#FFFFFF' },
                  ]}
                  numberOfLines={1}
                >
                  {course.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Course ID (required)</Text>
          <Text style={styles.helpText}>Prefilled when you pick a course; you can paste a Mongo ObjectId manually.</Text>
          <TextInput
            style={styles.input}
            value={manualCourseId}
            onChangeText={syncCourseFromManualId}
            placeholder="e.g. 674a1b2c3d4e5f6789abcd01"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Name on slip (required)</Text>
          <TextInput
            style={styles.input}
            value={payerNameOnSlip}
            onChangeText={setPayerNameOnSlip}
            placeholderTextColor={theme.textTertiary}
            placeholder="Exactly as printed on receipt"
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor={theme.textTertiary}
                placeholder="0.00"
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.inputLabel}>Payment slip</Text>
              <TouchableOpacity style={styles.pickBtn} onPress={handlePickImage}>
                <MaterialCommunityIcons
                  name={selectedImage ? 'check-circle' : 'camera-outline'}
                  size={22}
                  color={selectedImage ? theme.success : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.pickBtnText,
                    { color: theme.textSecondary },
                    selectedImage && { color: theme.success, fontWeight: '700' },
                  ]}
                >
                  {selectedImage ? 'Slip attached' : 'Pick image'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={theme.textTertiary}
            placeholder="Reference number or memo…"
            multiline
          />

          <TouchableOpacity
            style={[
              styles.uploadBtn,
              { backgroundColor: theme.primary },
              (!getCourseIdForUpload() || !selectedImage || uploading) && styles.disabledBtn,
            ]}
            onPress={handleUploadProof}
            disabled={!getCourseIdForUpload() || !selectedImage || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload-outline" size={22} color="#FFFFFF" />
                <Text style={styles.uploadText}>Submit for verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>History</Text>
        {payments.map((payment) => {
          const tone = statusTone(payment.status);
          return (
            <View key={payment._id} style={[styles.card, cardShadowStyle(theme)]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseTitle}>{payment.course?.title || 'Course payment'}</Text>
                  <Text style={styles.date}>
                    {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.amount}>${payment.amount}</Text>
              </View>
              <Text style={styles.detailLine}>
                Course ID: {payment.course?._id || '—'}
                {payment.course?.courseCode ? ` · Code: ${payment.course.courseCode}` : ''}
              </Text>
              {payment.payerNameOnSlip ? (
                <Text style={styles.detailLine}>On slip: {payment.payerNameOnSlip}</Text>
              ) : null}
              <View style={styles.cardBottom}>
                <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.statusText, { color: tone.fg }]}>{payment.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          );
        })}
        {payments.length === 0 && <Text style={styles.emptyText}>No payments recorded yet.</Text>}
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
    subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 8, lineHeight: 20 },
    scrollContent: { padding: 20, paddingBottom: 36 },
    uploadSection: {
      backgroundColor: theme.card,
      borderRadius: theme.radiusXl,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 16 },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 8,
      marginTop: 10,
    },
    helpText: { fontSize: 12, color: theme.textTertiary, marginBottom: 8, lineHeight: 17 },
    detailLine: { fontSize: 13, color: theme.textSecondary, marginTop: 8 },
    courseSelector: { flexDirection: 'row', marginBottom: 12, maxHeight: 44 },
    courseItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radiusMd,
      marginRight: 10,
      borderWidth: 1,
      maxWidth: 220,
    },
    courseItemText: { fontSize: 13, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
    input: {
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      paddingHorizontal: 14,
      height: 48,
      fontSize: 15,
      color: theme.text,
    },
    inputMultiline: { height: 72, paddingTop: 12, textAlignVertical: 'top' },
    pickBtn: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: theme.radiusMd,
      backgroundColor: theme.inputBg,
    },
    pickBtnText: { fontSize: 13, marginLeft: 10 },
    uploadBtn: {
      borderRadius: theme.radiusMd,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 10,
    },
    disabledBtn: { backgroundColor: theme.textTertiary, opacity: 0.5 },
    uploadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    card: {
      backgroundColor: theme.card,
      borderRadius: theme.radiusLg,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    courseTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    date: { fontSize: 12, color: theme.textTertiary, marginTop: 6 },
    amount: { fontSize: 20, fontWeight: '800', color: theme.primary },
    cardBottom: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radiusSm },
    statusText: { fontSize: 11, fontWeight: '800' },
    emptyText: { textAlign: 'center', color: theme.textSecondary, marginTop: 12, fontSize: 15 },
  });
}

export default PaymentsScreen;
