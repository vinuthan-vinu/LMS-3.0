import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Image, Modal, Pressable, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/client';
import { showAlert, showConfirm } from '../utils/webAlert';
import { useTheme } from '../context/ThemeContext';
import { clearAuthCredentials, getStoredUser } from '../storage/authStorage';
import { resolveAssetUrl } from '../utils/assetHelper';

function createAdminStyles(theme) {
  if (!theme) return StyleSheet.create({});
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background || '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background || '#FFF' },
    header: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
    tabsWrapper: { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    tabContainer: { paddingHorizontal: 10 },
    tabBtn: { paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: theme.accent },
    tabBtnText: { fontSize: 11, color: theme.textSecondary, marginTop: 4, fontWeight: '700' },
    tabBtnTextActive: { color: theme.accent },
    scrollContent: { padding: 20, paddingBottom: 50 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    statBox: {
      width: '31%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      borderBottomWidth: 3,
      elevation: 1,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statIconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 18, fontWeight: '700', color: theme.text },
    statLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '500' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 15 },
    listItem: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    listItemCol: { backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    listSub: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
    iconBtn: { padding: 8, backgroundColor: theme.surface, borderRadius: 8 },
    formCard: { backgroundColor: theme.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 15,
      height: 50,
      marginBottom: 15,
      backgroundColor: theme.inputBg,
      color: theme.text,
    },
    inputArea: {
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 15,
      height: 100,
      textAlignVertical: 'top',
      marginBottom: 15,
      color: theme.text,
    },
    sendBtn: { backgroundColor: theme.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    smallBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    smallBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
    placeholderCard: {
      alignItems: 'center',
      padding: 30,
      backgroundColor: theme.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    placeholderText: { textAlign: 'center', color: theme.textSecondary, marginTop: 15, marginBottom: 15, lineHeight: 22 },
    logUser: { fontWeight: '700', color: theme.primary, marginBottom: 8 },
    logUserMsg: { color: theme.textSecondary, fontSize: 13, marginBottom: 4 },
    logBotMsg: { color: theme.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: theme.textSecondary, marginTop: 20 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
    filterChipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    filterChipTextActive: { color: theme.warning },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      padding: 20,
    },
    modalInner: { backgroundColor: theme.card, borderRadius: 16, padding: 16, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
    modalSub: { fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
    modalImage: { width: '100%', height: 380, backgroundColor: theme.surface },
    modalOpenBtn: {
      marginTop: 14,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.primarySoft,
      alignItems: 'center',
    },
    modalOpenBtnText: { color: theme.primaryDark, fontWeight: '700', fontSize: 14 },
    linkHint: { fontSize: 12, color: theme.primary, fontWeight: '600' },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 8 },
    secondaryBtnText: { marginLeft: 8, color: theme.primary, fontWeight: '700', fontSize: 13 },
    formLabel: { fontSize: 13, color: theme.textSecondary, marginBottom: 8 },
  });
}

const TabButton = ({ title, icon, isActive, onPress, styles, theme }) => (
  <TouchableOpacity style={[styles.tabBtn, isActive && styles.tabBtnActive]} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={20} color={isActive ? theme.accent : theme.textSecondary} />
    <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const StatBox = ({ color, icon, value, label, styles }) => (
  <View style={[styles.statBox, { borderBottomColor: color }]}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}22` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, courses, payments, exams, resources, chatbot, notify
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', onConfirm: null });

  const triggerConfirm = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      setConfirmModal({ visible: true, title, message, onConfirm });
    } else {
      showConfirm(title, message, onConfirm);
    }
  };
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [notificationMsg, setNotificationMsg] = useState('');

  // User Form
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student', phone: '' });
  // Course Form
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [selectedCourseImage, setSelectedCourseImage] = useState(null);
  const [newCourse, setNewCourse] = useState({ title: '', category: 'Programming', price: '', duration: '', scheduleDays: '', startTime: '', endTime: '', meetLink: '', teacherId: '' });
  const [payments, setPayments] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', type: 'pdf', courseId: '', fileUrl: '' });
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [selectedResourceFile, setSelectedResourceFile] = useState(null);
  const [resourceBrowseCourseId, setResourceBrowseCourseId] = useState('');
  const [newExam, setNewExam] = useState({ title: '', courseId: '', duration: '60', totalMarks: '100', questions: [] });
  const [currentQuestion, setCurrentQuestion] = useState({ questionText: '', options: '', correctAnswer: '', marks: '1' });
  const [notifications, setNotifications] = useState([]);
  const [resources, setResources] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [receiptModalUrl, setReceiptModalUrl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const { theme } = useTheme();
  const styles = useMemo(() => createAdminStyles(theme), [theme]);
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const availableTabs = [
    { key: 'overview', title: 'Overview', icon: 'chart-box-outline', admin: true, teacher: true },
    { key: 'users', title: 'Users', icon: 'account-group-outline', admin: true, teacher: false },
    { key: 'courses', title: 'Courses/Schedule', icon: 'book-open-outline', admin: true, teacher: true },
    { key: 'payments', title: 'Payments', icon: 'credit-card-outline', admin: true, teacher: true },
    { key: 'resources', title: 'Resources', icon: 'folder-outline', admin: true, teacher: true },
    { key: 'exams', title: 'Exams', icon: 'file-document-edit-outline', admin: true, teacher: true },
    { key: 'chatbot', title: 'Chat Logs', icon: 'robot-outline', admin: true, teacher: false },
    { key: 'notify', title: 'Notify', icon: 'bell-ring-outline', admin: true, teacher: true },
  ].filter((tab) => (isTeacher ? tab.teacher : tab.admin));

  useEffect(() => {
    fetchAdminData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (activeTab === 'exams') {
      fetchExamsAndResults();
    }
  }, [activeTab]);

  const handleLogout = () => {
    const executeLogout = async () => {
      await clearAuthCredentials();
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        navigation.replace('Login');
      }
    };
    triggerConfirm('Sign Out', 'Are you sure you want to sign out?', executeLogout);
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) { console.error('Error fetching notifications'); }
  };

  const fetchAdminData = async () => {
    try {
      const storedUser = await getStoredUser();
      setCurrentUser(storedUser);
      const role = storedUser?.role;
      const teacherId = storedUser?._id || storedUser?.id;

      const [usersRes, coursesRes, chatsRes, paymentsRes, enrollRes] = await Promise.all([
        role === 'admin'
          ? apiClient.get('/users').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/courses', { params: { limit: 200, ...(role === 'teacher' && teacherId ? { teacher: teacherId } : {}) } }).catch(() => ({ data: { data: { courses: [] } } })),
        role === 'admin'
          ? apiClient.get('/chat/admin/logs').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/payments/history').catch(() => ({ data: { data: [] } })),
        apiClient.get('/enrollments/my-enrollments', { params: { limit: 500 } }).catch(() => ({ data: { data: { enrollments: [] } } }))
      ]);

      setUsers(usersRes.data.data || []);
      setCourses(coursesRes.data.data.courses || []);
      setChatLogs(chatsRes.data.data || []);
      setPayments(paymentsRes.data.data || []);
      setEnrollments(enrollRes.data.data?.enrollments || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Course Delete
  const deleteCourse = (id) => {
    triggerConfirm('Delete Course', 'Are you sure you want to delete this course?', async () => {
      try {
        await apiClient.delete(`/courses/${id}`);
        setCourses(courses.filter(c => c._id !== id));
        showAlert('Success', 'Course deleted');
        fetchAdminData();
      } catch (err) { showAlert('Error', 'Failed to delete course'); }
    }, 'Delete');
  };

  // Resource Delete
  const deleteResource = (id) => {
    triggerConfirm('Delete Resource', 'Are you sure you want to delete this resource?', async () => {
      try {
        await apiClient.delete(`/resources/${id}`);
        setResources(resources.filter(r => r._id !== id));
        showAlert('Success', 'Resource deleted');
        fetchAdminData();
      } catch (err) { showAlert('Error', 'Failed to delete resource'); }
    }, 'Delete');
  };

  // Fetch resources for listing
  const fetchResources = async (courseId) => {
    try {
      const res = await apiClient.get(`/resources/course/${courseId}`);
      if (res.data.success) setResources(res.data.data || []);
    } catch (err) { console.error('Error fetching resources'); }
  };

  // Enrollment approve/reject
  const handleEnrollmentStatus = async (id, status) => {
    try {
      await apiClient.put(`/enrollments/${id}/status`, { status });
      setEnrollments(enrollments.map(e => e._id === id ? { ...e, status } : e));
      showAlert('Success', `Enrollment ${status}`);
      fetchAdminData();
    } catch (err) { showAlert('Error', 'Failed to update enrollment'); }
  };

  const handleVerifyPayment = async (id, status) => {
    try {
      const rejectionReason = status === 'rejected' ? 'Payment could not be verified.' : undefined;
      const res = await apiClient.put(`/payments/${id}/verify`, { status, rejectionReason });

      if (res.data.success) {
        const updated = res.data.data;
        setPayments((prev) => prev.map((p) => (p._id === id ? { ...p, ...updated } : p)));
        const label =
          status === 'verified' ? 'marked verified (accepted)' :
            status === 'rejected' ? 'rejected' :
              'reset to pending';
        showAlert('Success', `Payment ${label}.`);
      }
    } catch (err) {
      console.error('Payment verify error:', err.response?.data || err.message);
      showAlert('Error', err.response?.data?.message || 'Failed to update payment status');
    }
  };

  const filteredPayments =
    paymentFilter === 'all'
      ? payments
      : payments.filter((p) => p.status === paymentFilter);

  const handleCreateUser = async () => {
    try {
      if (!isAdmin) return showAlert('Error', 'Only admins can create users');
      if (!newUser.email || !newUser.password) return showAlert('Error', 'Email and Password are required');
      const res = await apiClient.post('/users', newUser);
      setUsers([res.data.data, ...users]);
      showAlert('Success', 'User created successfully');
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'student', phone: '' });
      fetchAdminData(); // Ensure lists are synced
    } catch (err) { showAlert('Error', err.response?.data?.message || 'Failed to create user'); }
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser) return;
      const res = await apiClient.put(`/users/${editingUser._id}`, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        isActive: editingUser.isActive,
      });
      setUsers(users.map(u => u._id === editingUser._id ? res.data.data : u));
      setEditingUser(null);
      showAlert('Success', 'User details updated');
      fetchAdminData();
    } catch (err) { showAlert('Error', err.response?.data?.message || 'Failed to update user details'); }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const res = await apiClient.put(`/users/${id}/role`, { isActive: !currentStatus });
      setUsers(users.map(u => u._id === id ? res.data.data : u));
      showAlert('Success', `User ${!currentStatus ? 'blocked' : 'unblocked'}`);
    } catch (err) { showAlert('Error', 'Failed to update status'); }
  };

  const handlePickResourceFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled) setSelectedResourceFile(result.assets[0]);
    } catch (err) { showAlert('Error', 'Failed to pick file'); }
  };

  const handleCreateResource = async () => {
    try {
      if (!newResource.title?.trim() || !newResource.courseId?.trim()) {
        return showAlert('Error', 'Title and Course ID required');
      }

      const courseMongoId = newResource.courseId.trim();

      if (editingResourceId) {
        const res = await apiClient.put(`/resources/${editingResourceId}`, {
          title: newResource.title.trim(),
          type: newResource.type || 'pdf',
          fileUrl: newResource.fileUrl?.trim() || undefined,
        });
        setResources(resources.map((r) => (r._id === editingResourceId ? res.data.data : r)));
        showAlert('Success', 'Resource updated.');
        setEditingResourceId(null);
        setNewResource({ title: '', type: 'pdf', courseId: '', fileUrl: '' });
        setSelectedResourceFile(null);
        return;
      }

      if (selectedResourceFile) {
        // Multipart Upload
        const formData = new FormData();
        formData.append('title', newResource.title.trim());
        formData.append('course', courseMongoId);
        formData.append('type', newResource.type || 'pdf');
        
        if (Platform.OS === 'web' && selectedResourceFile.file) {
          formData.append('file', selectedResourceFile.file);
        } else {
          formData.append('file', {
            uri: selectedResourceFile.uri,
            name: selectedResourceFile.name || 'resource.pdf',
            type: selectedResourceFile.mimeType || 'application/pdf',
          });
        }

        await apiClient.post('/resources/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showAlert('Success', 'Resource file uploaded.');
      } else {
        // Simple Link
        const url = newResource.fileUrl?.trim();
        if (!url) {
          return showAlert('Error', 'Please provide a File URL OR upload a file.');
        }
        await apiClient.post('/resources/link', {
          title: newResource.title.trim(),
          course: courseMongoId,
          type: newResource.type || 'pdf',
          fileUrl: url,
        });
        showAlert('Success', 'Resource link saved.');
      }

      setNewResource({ title: '', type: 'pdf', courseId: '', fileUrl: '' });
      setEditingResourceId(null);
      setSelectedResourceFile(null);
      fetchResources(courseMongoId);
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to create resource');
    }
  };

  const handleCreateExam = async () => {
    try {
      if (!newExam.title || !newExam.courseId) return showAlert('Error', 'Title and Course ID required');
      await apiClient.post('/exams', {
        title: newExam.title,
        course: newExam.courseId,
        duration: Number(newExam.duration),
        totalMarks: Number(newExam.totalMarks),
        questions: newExam.questions,
        scheduledDate: new Date(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        passingMarks: Math.floor(Number(newExam.totalMarks) * 0.4)
      });
      showAlert('Success', 'Exam created');
      setNewExam({ title: '', course: '', duration: '60', totalMarks: '100' });
      setExamQuestions([]);
      fetchAdminData();
    } catch (err) { showAlert('Error', err.response?.data?.message || 'Failed to create exam'); }
  };

  const addQuestionToExam = () => {
    if (!currentQuestion.questionText || !currentQuestion.correctAnswer) {
      return showAlert('Error', 'Question text and correct answer are required');
    }
    const options = currentQuestion.options.split(',').map(o => o.trim()).filter(Boolean);
    const question = {
      questionText: currentQuestion.questionText,
      options,
      correctAnswer: currentQuestion.correctAnswer,
      marks: Number(currentQuestion.marks),
      questionType: options.length > 0 ? 'multiple_choice' : 'short_answer'
    };
    setNewExam({ ...newExam, questions: [...newExam.questions, question] });
    setCurrentQuestion({ questionText: '', options: '', correctAnswer: '', marks: '1' });
    showAlert('Success', 'Question added to exam list');
  };

  // Fetch all exams and results for admin
  const fetchExamsAndResults = async () => {
    try {
      const [examsRes, resultsRes] = await Promise.all([
        apiClient.get('/exams/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/exams/all-results').catch(() => ({ data: { data: [] } })),
      ]);
      setExams(examsRes.data.data || []);
      setExamResults(resultsRes.data.data || []);
    } catch (err) { console.error('Error fetching exams data'); }
  };

  // Delete exam
  const deleteExam = (id) => {
    triggerConfirm('Delete Exam', 'Are you sure? All related data will remain but the exam will be removed.', async () => {
      try {
        await apiClient.delete(`/exams/${id}`);
        setExams(exams.filter(e => e._id !== id));
        showAlert('Success', 'Exam deleted');
      } catch (err) { showAlert('Error', 'Failed to delete exam'); }
    }, 'Delete');
  };

  // Download results as CSV
  const downloadResultsCSV = () => {
    if (examResults.length === 0) return showAlert('Info', 'No results to download');
    const header = 'Student,Email,Exam,Course,Score,Percentage,Grade,Passed,Date\n';
    const rows = examResults.map(r =>
      `"${r.student?.firstName || ''} ${r.student?.lastName || ''}","${r.student?.email || ''}","${r.exam?.title || ''}","${r.exam?.course?.title || ''}",${r.totalMarksObtained || 0}/${r.exam?.totalMarks || 0},${(r.percentage || 0).toFixed(1)}%,${r.grade || ''},${r.isPassed ? 'Yes' : 'No'},${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ''}`
    ).join('\n');
    const csv = header + rows;
    if (typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam_results.csv';
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Success', 'Results CSV downloaded!');
    } else {
      showAlert('Info', 'CSV download is available on web.');
    }
  };

  // User Management Methods
  const deleteUser = (id) => {
    triggerConfirm('Delete User', 'Are you sure you want to delete this user?', async () => {
      try {
        await apiClient.delete(`/users/${id}`);
        setUsers(users.filter(u => u._id !== id));
        showAlert('Success', 'User deleted');
        fetchAdminData();
      } catch (err) { showAlert('Error', 'Failed to delete user'); }
    });
  };

  const changeRole = async (id, currentRole) => {
    const newRole = currentRole === 'student' ? 'teacher' : 'student';
    try {
      const res = await apiClient.put(`/users/${id}/role`, { role: newRole, isActive: true });
      setUsers(users.map(u => u._id === id ? res.data.data : u));
    } catch (err) { showAlert('Error', 'Failed to update role'); }
  };

  // Course Image Picker
  const handlePickCourseImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled) setSelectedCourseImage(result.assets[0]);
    } catch (err) { showAlert('Error', 'Failed to pick image'); }
  };

  const handleEditCourseBtn = (course) => {
    setEditingCourseId(course._id);
    setNewCourse({
      title: course.title,
      category: course.category || 'Programming',
      price: String(course.price || ''),
      duration: String(course.duration || ''),
      scheduleDays: course.schedule?.days?.join(', ') || '',
      startTime: course.schedule?.startTime || '',
      endTime: course.schedule?.endTime || '',
      meetLink: course.schedule?.meetLink || '',
      teacherId: course.teacher?._id || course.teacher || ''
    });
    setSelectedCourseImage(null);
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setNewCourse({ title: '', category: 'Programming', price: '', duration: '', scheduleDays: '', startTime: '', endTime: '', meetLink: '', teacherId: '' });
    setSelectedCourseImage(null);
  };

  // Course & Schedule Creation / Update
  const handleCreateCourse = async () => {
    try {
      if (!newCourse.title) return showAlert('Error', 'Course title is required');

      const adminUser = await getStoredUser();
      const teacherId = isAdmin
        ? (newCourse.teacherId?.trim() || adminUser?.id || adminUser?._id || '')
        : (adminUser?.id || adminUser?._id || '');

      const formData = new FormData();
      formData.append('title', newCourse.title);
      if (!editingCourseId) {
        formData.append('courseCode', newCourse.title.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900));
        formData.append('description', newCourse.title + ' - Course created by Admin');
        formData.append('credits', 3);
        formData.append('level', 'beginner');
        formData.append('maxStudents', 30);
        formData.append('status', 'published');
        formData.append('teacher', teacherId);
      }
      formData.append('category', newCourse.category || 'Programming');
      if (editingCourseId && isAdmin && newCourse.teacherId?.trim()) {
        formData.append('teacher', newCourse.teacherId.trim());
      }
      formData.append('price', Number(newCourse.price) || 0);
      formData.append('duration', Number(newCourse.duration) || 4);
      formData.append('schedule', JSON.stringify({
        days: newCourse.scheduleDays ? newCourse.scheduleDays.split(',').map(d => d.trim()) : ['Monday', 'Wednesday'],
        startTime: newCourse.startTime || '10:00 AM',
        endTime: newCourse.endTime || '12:00 PM',
        meetLink: newCourse.meetLink || ''
      }));

      if (selectedCourseImage) {
        if (Platform.OS === 'web' && selectedCourseImage.file) {
          formData.append('thumbnail', selectedCourseImage.file);
        } else {
          formData.append('thumbnail', {
            uri: selectedCourseImage.uri,
            name: selectedCourseImage.name || 'thumbnail.jpg',
            type: selectedCourseImage.mimeType || 'image/jpeg',
          });
        }
      }

      if (editingCourseId) {
        const res = await apiClient.put(`/courses/${editingCourseId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCourses(courses.map(c => c._id === editingCourseId ? res.data.data : c));
        showAlert('Success', 'Course Updated!');
      } else {
        const res = await apiClient.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCourses([res.data.data, ...courses]);
        showAlert('Success', 'Course Created!');
      }
      resetCourseForm();
    } catch (err) { showAlert('Error', err.response?.data?.message || 'Failed to save course'); }
  };

  // Send Notification
  const handleSendNotification = async () => {
    if (!notificationMsg) return;
    try {
      await apiClient.post('/notifications', { title: 'Admin Alert', message: notificationMsg, type: 'announcement', audience: 'all' });
      showAlert('Success', 'Notification pushed!');
      setNotificationMsg('');
      fetchNotifications();
    } catch (err) { showAlert('Error', 'Failed to send'); }
  };

  const deleteNotification = (id) => {
    triggerConfirm('Delete Notification', 'Are you sure?', async () => {
      try {
        await apiClient.delete(`/notifications/${id}`);
        setNotifications(notifications.filter(n => n._id !== id));
        showAlert('Success', 'Notification deleted');
      } catch (err) { showAlert('Error', 'Failed to delete'); }
    }, 'Delete');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{isTeacher ? 'Teacher Dashboard' : 'System Admin Dashboard'}</Text>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: 'rgba(248,113,113,0.18)', padding: 10 }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={22} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {availableTabs.map((tab) => (
            <TabButton key={tab.key} styles={styles} theme={theme} title={tab.title} icon={tab.icon} isActive={activeTab === tab.key} onPress={() => setActiveTab(tab.key)} />
          ))}
        </ScrollView>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={confirmModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalInner, { maxWidth: 400 }]}>
            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
            <Text style={styles.modalSub}>{confirmModal.message}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25 }}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: theme.surface, marginRight: 12, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
              >
                <Text style={[styles.smallBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: theme.error }]}
                onPress={() => {
                  setConfirmModal({ ...confirmModal, visible: false });
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
              >
                <Text style={styles.smallBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!receiptModalUrl} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setReceiptModalUrl(null)}>
          <Pressable style={styles.modalInner} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment receipt</Text>
              <TouchableOpacity onPress={() => setReceiptModalUrl(null)} accessibilityLabel="Close">
                <MaterialCommunityIcons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>
            {receiptModalUrl ? (
              <Image source={{ uri: resolveAssetUrl(receiptModalUrl) }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
            <TouchableOpacity
              style={styles.modalOpenBtn}
              onPress={() => receiptModalUrl && Linking.openURL(resolveAssetUrl(receiptModalUrl))}
            >
              <Text style={styles.modalOpenBtnText}>Open in browser / full size</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.statsRow}>
              <StatBox styles={styles} color={theme.accent} icon="account-multiple" value={users.length} label="Total Users" />
              <StatBox styles={styles} color={theme.primary} icon="book-open-variant" value={courses.length} label="Courses" />
              <StatBox styles={styles} color={theme.secondary} icon="robot" value={chatLogs.length} label="Chat Queries" />
            </View>

            <View style={styles.formCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Financial Summary</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: theme.textSecondary }}>Total Revenue (Verified):</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.secondary }}>
                  ${payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {payments.slice(0, 5).map((p, i) => (
              <View key={i} style={styles.listItem}>
                <MaterialCommunityIcons name="cash-marker" size={20} color={theme.secondary} style={{ marginRight: 10 }} />
                <Text style={styles.listSub}>{p.student?.email} paid ${p.amount} for {p.course?.title} ({p.status})</Text>
              </View>
            ))}
            {payments.length === 0 && <Text style={styles.emptyText}>No recent activity.</Text>}
          </View>
        )}

        {/* 1. USERS */}
        {activeTab === 'users' && isAdmin && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>User Management</Text>
              <TouchableOpacity onPress={fetchAdminData}>
                <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
              </TouchableOpacity>
            </View>

            {editingUser ? (
              <View style={styles.formCard}>
                <Text style={[styles.formLabel, { color: theme.text, fontWeight: '700', marginBottom: 10 }]}>Edit User Details</Text>
                <TextInput style={styles.input} placeholder="First Name" value={editingUser.firstName} onChangeText={t => setEditingUser({ ...editingUser, firstName: t })} />
                <TextInput style={styles.input} placeholder="Last Name" value={editingUser.lastName} onChangeText={t => setEditingUser({ ...editingUser, lastName: t })} />
                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={editingUser.email} onChangeText={t => setEditingUser({ ...editingUser, email: t })} />
                <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={editingUser.phone} onChangeText={t => setEditingUser({ ...editingUser, phone: t })} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.textSecondary, flex: 0.45 }]} onPress={() => setEditingUser(null)}>
                    <Text style={styles.sendBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sendBtn, { flex: 0.45 }]} onPress={handleUpdateUser}>
                    <Text style={styles.sendBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.formCard}>
                <Text style={[styles.formLabel, { color: theme.text, fontWeight: '700', marginBottom: 10 }]}>Create New User</Text>
                <TextInput style={styles.input} placeholder="First Name" value={newUser.firstName} onChangeText={t => setNewUser({ ...newUser, firstName: t })} />
                <TextInput style={styles.input} placeholder="Last Name" value={newUser.lastName} onChangeText={t => setNewUser({ ...newUser, lastName: t })} />
                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={newUser.email} onChangeText={t => setNewUser({ ...newUser, email: t })} />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={newUser.password} onChangeText={t => setNewUser({ ...newUser, password: t })} />
                <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={newUser.phone} onChangeText={t => setNewUser({ ...newUser, phone: t })} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginRight: 10 }}>Role:</Text>
                  <TouchableOpacity
                    style={[styles.tabBtn, { paddingVertical: 5, borderBottomWidth: 0, backgroundColor: newUser.role === 'student' ? theme.accent : theme.border }]}
                    onPress={() => setNewUser({ ...newUser, role: 'student' })}
                  >
                    <Text style={{ fontSize: 12, color: newUser.role === 'student' ? '#FFFFFF' : theme.textSecondary }}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, { paddingVertical: 5, borderBottomWidth: 0, backgroundColor: newUser.role === 'teacher' ? theme.accent : theme.border, marginLeft: 10 }]}
                    onPress={() => setNewUser({ ...newUser, role: 'teacher' })}
                  >
                    <Text style={{ fontSize: 12, color: newUser.role === 'teacher' ? '#FFFFFF' : theme.textSecondary }}>Teacher</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={handleCreateUser}>
                  <Text style={styles.sendBtnText}>Create User Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {users.map(user => (
              <View key={user._id} style={styles.listItem}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{user.firstName} {user.lastName}</Text>
                  <Text style={styles.listSub}>{user.email} • {user.role} {user.isActive ? '✅' : '❌'}</Text>
                </View>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface, marginRight: 8 }]} onPress={() => setEditingUser(user)}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.primarySoft, marginRight: 8 }]} onPress={() => changeRole(user._id, user.role)}>
                  <MaterialCommunityIcons name="account-convert" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: user.isActive ? 'rgba(248,113,113,0.18)' : theme.secondarySoft,
                      marginRight: 8,
                      opacity: user.email === 'admin@lms.com' ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => user.email !== 'admin@lms.com' && toggleUserStatus(user._id, user.isActive)}
                  disabled={user.email === 'admin@lms.com'}
                >
                  <MaterialCommunityIcons
                    name={user.isActive ? 'account-off' : 'account-check'}
                    size={20}
                    color={user.isActive ? theme.error : theme.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { opacity: user.email === 'admin@lms.com' ? 0.5 : 1 }]}
                  onPress={() => user.email !== 'admin@lms.com' && deleteUser(user._id)}
                  disabled={user.email === 'admin@lms.com'}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 2 & 3. COURSES & SCHEDULE */}
        {activeTab === 'courses' && (
          <View>
            <Text style={styles.sectionTitle}>{editingCourseId ? 'Edit Course & Timetable' : 'Create Course & Timetable'}</Text>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Course Title" value={newCourse.title} onChangeText={t => setNewCourse({ ...newCourse, title: t })} />
              <TextInput style={styles.input} placeholder="Price ($)" keyboardType="numeric" value={newCourse.price} onChangeText={t => setNewCourse({ ...newCourse, price: t })} />
              <TextInput style={styles.input} placeholder="Duration (Weeks)" keyboardType="numeric" value={newCourse.duration} onChangeText={t => setNewCourse({ ...newCourse, duration: t })} />
              {isAdmin && (
                <>
                  <TextInput style={styles.input} placeholder="Teacher ID (pick below or paste ObjectId)" value={newCourse.teacherId} onChangeText={t => setNewCourse({ ...newCourse, teacherId: t })} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {users.filter((u) => u.role === 'teacher' || u.role === 'admin').map((teacher) => (
                      <TouchableOpacity
                        key={teacher._id}
                        style={[
                          styles.filterChip,
                          newCourse.teacherId === teacher._id && styles.filterChipActive,
                        ]}
                        onPress={() => setNewCourse({ ...newCourse, teacherId: teacher._id })}
                      >
                        <Text style={[styles.filterChipText, newCourse.teacherId === teacher._id && styles.filterChipTextActive]}>
                          {teacher.firstName} {teacher.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              <TextInput style={styles.input} placeholder="Schedule Days (e.g., Mon,Wed,Fri)" value={newCourse.scheduleDays} onChangeText={t => setNewCourse({ ...newCourse, scheduleDays: t })} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="Start (10:00 AM)" value={newCourse.startTime} onChangeText={t => setNewCourse({ ...newCourse, startTime: t })} />
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="End (12:00 PM)" value={newCourse.endTime} onChangeText={t => setNewCourse({ ...newCourse, endTime: t })} />
              </View>
              <TextInput style={styles.input} placeholder="Class Meeting Link (e.g., Google Meet / Zoom URL)" autoCapitalize="none" value={newCourse.meetLink} onChangeText={t => setNewCourse({ ...newCourse, meetLink: t })} />
              <TouchableOpacity style={[styles.input, { justifyContent: 'center', alignItems: 'center', borderColor: selectedCourseImage ? theme.success : theme.border }]} onPress={handlePickCourseImage}>
                <Text style={{ color: selectedCourseImage ? theme.success : theme.textSecondary, fontWeight: '600' }}>
                  <MaterialCommunityIcons name="camera" size={16} /> {selectedCourseImage ? 'Thumbnail Selected ✓' : 'Upload Course Thumbnail (Optional)'}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {editingCourseId && (
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.textSecondary, flex: 0.48 }]} onPress={resetCourseForm}>
                    <Text style={styles.sendBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.sendBtn, { flex: editingCourseId ? 0.48 : 1 }]} onPress={handleCreateCourse}>
                  <Text style={styles.sendBtnText}>{editingCourseId ? 'Save Changes' : 'Save Course & Schedule'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {courses.map(course => (
              <View key={course._id} style={styles.listItem}>
                {course.thumbnail ? (
                  <Image source={{ uri: resolveAssetUrl(course.thumbnail) }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
                ) : (
                  <View style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="image-outline" size={24} color={theme.textTertiary} />
                  </View>
                )}
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{course.title}</Text>
                  <Text style={styles.listSub}>{course.courseCode} • {course.schedule?.days?.join(', ') || 'TBA'} • {course.schedule?.startTime || ''}-{course.schedule?.endTime || ''}</Text>
                </View>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface, marginRight: 8 }]} onPress={() => handleEditCourseBtn(course)}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(248,113,113,0.18)' }]} onPress={() => deleteCourse(course._id)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 4. PAYMENTS */}
        {activeTab === 'payments' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Verify Payments & Enrollments</Text>
              <TouchableOpacity onPress={fetchAdminData}>
                <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'verified', label: 'Verified' },
                { key: 'rejected', label: 'Rejected' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, paymentFilter === f.key && styles.filterChipActive]}
                  onPress={() => setPaymentFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, paymentFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredPayments.map((payment) => (
              <View key={payment._id} style={styles.listItemCol}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>
                      Account: {payment.student?.firstName} {payment.student?.lastName}
                    </Text>
                    <Text style={[styles.listSub, { marginTop: 2 }]}>{payment.student?.email || 'Unknown user'}</Text>
                    {payment.payerNameOnSlip ? (
                      <Text style={[styles.listSub, { marginTop: 6, fontWeight: '600', color: theme.text }]}>
                        Name on slip: {payment.payerNameOnSlip}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.statValue, { color: theme.primary }]}>${payment.amount}</Text>
                </View>

                <View style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 10, marginBottom: 10 }}>
                  <Text style={[styles.listSub, { fontWeight: '600', color: theme.text }]}>
                    Course: {payment.course?.title || 'Unknown'}
                  </Text>
                  <Text style={[styles.listSub, { marginTop: 4 }]}>
                    Course ID: {payment.course?._id || '—'}
                    {payment.course?.courseCode ? ` · ${payment.course.courseCode}` : ''}
                  </Text>
                  {payment.notes ? (
                    <Text style={[styles.listSub, { fontStyle: 'italic', marginTop: 4 }]}>Note: {payment.notes}</Text>
                  ) : null}
                </View>

                {payment.paymentProof ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.listSub, { fontWeight: '700', marginBottom: 8 }]}>Payment slip preview</Text>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setReceiptModalUrl(payment.paymentProof)}>
                      <View style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                        <Image source={{ uri: resolveAssetUrl(payment.paymentProof) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <Text style={[styles.linkHint, { marginTop: 8 }]}>Tap to enlarge · view receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setReceiptModalUrl(payment.paymentProof)}>
                      <MaterialCommunityIcons name="receipt-text-outline" size={18} color={theme.primary} />
                      <Text style={styles.secondaryBtnText}>Full receipt viewer</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          payment.status === 'verified'
                            ? theme.secondarySoft
                            : payment.status === 'rejected'
                              ? 'rgba(220,38,38,0.12)'
                              : theme.accentSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            payment.status === 'verified'
                              ? theme.success
                              : payment.status === 'rejected'
                                ? theme.error
                                : theme.warning,
                          fontSize: 10,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {payment.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: theme.secondary, marginRight: 8 }]}
                          onPress={() => handleVerifyPayment(payment._id, 'verified')}
                        >
                          <Text style={styles.smallBtnText}>Accept / Verify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.error, marginRight: 8 }]} onPress={() => handleVerifyPayment(payment._id, 'rejected')}>
                          <Text style={styles.smallBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {payment.status !== 'pending' && (
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: theme.textSecondary }]}
                        onPress={() => handleVerifyPayment(payment._id, 'pending')}
                      >
                        <Text style={styles.smallBtnText}>Set pending again</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
            {filteredPayments.length === 0 && <Text style={styles.emptyText}>No payments for this filter.</Text>}

            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Enrollment Requests</Text>
            {enrollments.filter(e => e.status === 'pending').map(enr => (
              <View key={enr._id} style={styles.listItemCol}>
                <Text style={styles.listTitle}>{enr.student?.firstName || 'Student'} {enr.student?.lastName || ''}</Text>
                <Text style={styles.listSub}>Course: {enr.course?.title || 'Unknown'} • Status: {enr.status}</Text>
                <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
                  <TouchableOpacity style={[styles.sendBtn, { flex: 0.48, backgroundColor: theme.secondary, marginTop: 0 }]} onPress={() => handleEnrollmentStatus(enr._id, 'approved')}>
                    <Text style={styles.sendBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sendBtn, { flex: 0.48, backgroundColor: theme.error, marginTop: 0 }]} onPress={() => handleEnrollmentStatus(enr._id, 'rejected')}>
                    <Text style={styles.sendBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {enrollments.filter(e => e.status === 'pending').length === 0 && <Text style={styles.emptyText}>No pending enrollments.</Text>}
          </View>
        )}

        {/* 5. RESOURCES */}
        {activeTab === 'resources' && (
          <View>
            <Text style={styles.sectionTitle}>Add course material (link)</Text>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Resource Title" value={newResource.title} onChangeText={t => setNewResource({ ...newResource, title: t })} />
              <TextInput style={styles.input} placeholder="Course ID" value={newResource.courseId} onChangeText={t => setNewResource({ ...newResource, courseId: t })} />
              <TextInput style={styles.input} placeholder="Type: pdf | video | link | …" value={newResource.type} onChangeText={t => setNewResource({ ...newResource, type: t })} />
              
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.formLabel}>Option 1: Provide External Link</Text>
                <TextInput 
                  style={[styles.input, { marginBottom: 0 }]} 
                  placeholder="File URL (https://…)" 
                  autoCapitalize="none" 
                  value={newResource.fileUrl} 
                  onChangeText={t => {
                    setNewResource({ ...newResource, fileUrl: t });
                    if (t) setSelectedResourceFile(null);
                  }} 
                />
              </View>

              <View style={{ marginBottom: 15 }}>
                <Text style={styles.formLabel}>Option 2: Upload File</Text>
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center', alignItems: 'center', borderColor: selectedResourceFile ? theme.success : theme.border }]} 
                  onPress={handlePickResourceFile}
                >
                  <Text style={{ color: selectedResourceFile ? theme.success : theme.textSecondary, fontWeight: '600' }}>
                    <MaterialCommunityIcons name="paperclip" size={16} /> {selectedResourceFile ? `File Selected: ${selectedResourceFile.name}` : 'Choose Local File'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleCreateResource}>
                <Text style={styles.sendBtnText}>{editingResourceId ? 'Save resource changes' : 'Save resource link'}</Text>
              </TouchableOpacity>
              {editingResourceId && (
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: theme.textSecondary }]}
                  onPress={() => {
                    setEditingResourceId(null);
                    setNewResource({ title: '', type: 'pdf', courseId: '', fileUrl: '' });
                    setSelectedResourceFile(null);
                  }}
                >
                  <Text style={styles.sendBtnText}>Cancel edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>View Resources by Course</Text>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Enter Course ID to load resources" value={resourceBrowseCourseId} onChangeText={setResourceBrowseCourseId} />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={() => resourceBrowseCourseId && fetchResources(resourceBrowseCourseId.trim())}>
                <Text style={styles.sendBtnText}>Load Resources</Text>
              </TouchableOpacity>
            </View>

            {resources.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Uploaded Resources ({resources.length})</Text>
                {resources.map(r => (
                  <View key={r._id} style={styles.listItem}>
                    <View style={styles.listContent}>
                      <Text style={styles.listTitle}>{r.title}</Text>
                      <Text style={styles.listSub}>{r.type} • {r.fileSize ? (r.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.iconBtn, { backgroundColor: theme.surface, marginRight: 8 }]}
                      onPress={() => {
                        setEditingResourceId(r._id);
                        setNewResource({
                          title: r.title || '',
                          type: r.type || 'pdf',
                          courseId: r.course?._id || r.course || resourceBrowseCourseId,
                          fileUrl: r.fileUrl || '',
                        });
                        setSelectedResourceFile(null);
                      }}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(248,113,113,0.18)' }]} onPress={() => deleteResource(r._id)}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {resources.length === 0 && <Text style={styles.emptyText}>No resources loaded. Enter a Course ID above.</Text>}

            {/* STUDENT PROGRESS REPORTS */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 }}>
              <Text style={styles.sectionTitle}>Student Progress Reports</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.primary }]} onPress={() => {
                if (enrollments.length === 0) return showAlert('Info', 'No enrollment data to export');
                const header = 'Student,Email,Course,Progress %,Status,Enrolled Date\n';
                const rows = enrollments.map(e =>
                  `"${e.student?.firstName || ''} ${e.student?.lastName || ''}","${e.student?.email || ''}","${e.course?.title || ''}",${e.progress || 0}%,${e.status || ''},${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''}`
                ).join('\n');
                const csv = header + rows;
                if (typeof window !== 'undefined') {
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'student_progress_report.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                  showAlert('Success', 'Progress report CSV downloaded!');
                } else {
                  showAlert('Info', 'CSV download is available on web.');
                }
              }}>
                <Text style={styles.smallBtnText}>⬇ Download CSV</Text>
              </TouchableOpacity>
            </View>
            {enrollments.length > 0 ? enrollments.slice(0, 20).map(e => (
              <View key={e._id} style={styles.listItem}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{e.student?.firstName} {e.student?.lastName}</Text>
                  <Text style={styles.listSub}>{e.course?.title || 'Course'} · Progress: {e.progress || 0}% · Status: {e.status}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>No enrollment progress data.</Text>}
          </View>
        )}

        {/* 6. EXAMS */}
        {activeTab === 'exams' && (
          <View>
            <Text style={styles.sectionTitle}>Create New Exam & Questions</Text>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Exam Title" value={newExam.title} onChangeText={t => setNewExam({ ...newExam, title: t })} />
              <TextInput style={styles.input} placeholder="Course ID" value={newExam.courseId} onChangeText={t => setNewExam({ ...newExam, courseId: t })} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="Duration (mins)" keyboardType="numeric" value={newExam.duration} onChangeText={t => setNewExam({ ...newExam, duration: t })} />
                <TextInput style={[styles.input, { flex: 0.48 }]} placeholder="Total Marks" keyboardType="numeric" value={newExam.totalMarks} onChangeText={t => setNewExam({ ...newExam, totalMarks: t })} />
              </View>

              <View style={{ marginTop: 20, padding: 15, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontWeight: '700', color: theme.text, marginBottom: 10 }}>Add a Question</Text>
                <TextInput style={styles.input} placeholder="Question Text" value={currentQuestion.questionText} onChangeText={t => setCurrentQuestion({ ...currentQuestion, questionText: t })} />
                <TextInput style={styles.input} placeholder="Options (comma separated, leave empty for typed answer)" value={currentQuestion.options} onChangeText={t => setCurrentQuestion({ ...currentQuestion, options: t })} />
                <TextInput style={styles.input} placeholder="Correct Answer" value={currentQuestion.correctAnswer} onChangeText={t => setCurrentQuestion({ ...currentQuestion, correctAnswer: t })} />
                <TextInput style={[styles.input, { flex: 0.4 }]} placeholder="Marks" keyboardType="numeric" value={currentQuestion.marks} onChangeText={t => setCurrentQuestion({ ...currentQuestion, marks: t })} />
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.textSecondary }]} onPress={addQuestionToExam}>
                  <Text style={styles.sendBtnText}>+ Add Question to Exam</Text>
                </TouchableOpacity>
              </View>

              {/* PREVIEW before publishing */}
              {newExam.questions.length > 0 && (
                <View style={{ marginTop: 20, padding: 15, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.accent }}>
                  <Text style={{ fontWeight: '800', color: theme.accent, marginBottom: 12, fontSize: 15 }}>📋 Exam Preview ({newExam.questions.length} Questions)</Text>
                  <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 4 }}>{newExam.title || 'Untitled Exam'}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>Duration: {newExam.duration} min · Total Marks: {newExam.totalMarks}</Text>
                  {newExam.questions.map((q, idx) => (
                    <View key={idx} style={{ paddingVertical: 10, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: theme.border }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontWeight: '700', color: theme.text, flex: 1 }}>Q{idx + 1}. {q.questionText}</Text>
                        <TouchableOpacity onPress={() => {
                          setNewExam({ ...newExam, questions: newExam.questions.filter((_, i) => i !== idx) });
                        }}>
                          <MaterialCommunityIcons name="close-circle" size={22} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt, oi) => (
                          <Text key={oi} style={{ color: opt === q.correctAnswer ? theme.success : theme.textSecondary, marginLeft: 16, marginTop: 4, fontSize: 13 }}>
                            {opt === q.correctAnswer ? '✓ ' : '○ '}{opt}
                          </Text>
                        ))
                      ) : (
                        <Text style={{ color: theme.textTertiary, marginLeft: 16, marginTop: 4, fontSize: 12, fontStyle: 'italic' }}>Typed answer · Correct: {q.correctAnswer}</Text>
                      )}
                      <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>Marks: {q.marks}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ marginTop: 15 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Questions added: {newExam.questions.length}</Text>
              </View>

              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.error }]} onPress={handleCreateExam}>
                <Text style={styles.sendBtnText}>Publish Exam with {newExam.questions.length} Questions</Text>
              </TouchableOpacity>
            </View>

            {/* EXISTING EXAMS */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Existing Exams</Text>
              <TouchableOpacity onPress={fetchExamsAndResults}>
                <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
              </TouchableOpacity>
            </View>
            {exams.length > 0 ? exams.map(exam => (
              <View key={exam._id} style={styles.listItem}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{exam.title}</Text>
                  <Text style={styles.listSub}>{exam.course?.courseCode || ''} · {exam.questions?.length || 0} Qs · {exam.duration} min · {exam.totalMarks} marks</Text>
                </View>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(248,113,113,0.18)' }]} onPress={() => deleteExam(exam._id)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            )) : <Text style={styles.emptyText}>No exams yet. Tap refresh to load.</Text>}

            {/* STUDENT RESULTS */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Student Results</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.secondary }]} onPress={downloadResultsCSV}>
                <Text style={styles.smallBtnText}>⬇ Download CSV</Text>
              </TouchableOpacity>
            </View>
            {examResults.length > 0 ? examResults.map(r => (
              <View key={r._id} style={styles.listItemCol}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{r.student?.firstName} {r.student?.lastName}</Text>
                    <Text style={[styles.listSub, { marginTop: 2 }]}>{r.student?.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: r.isPassed ? theme.success : theme.error }}>{(r.percentage || 0).toFixed(0)}%</Text>
                    <View style={[styles.statusBadge, { backgroundColor: r.isPassed ? theme.secondarySoft : 'rgba(220,38,38,0.12)', marginTop: 4 }]}>
                      <Text style={[styles.statusText, { color: r.isPassed ? theme.success : theme.error }]}>{r.isPassed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ backgroundColor: theme.surface, padding: 10, borderRadius: 8, marginTop: 10 }}>
                  <Text style={[styles.listSub, { fontWeight: '600', color: theme.text }]}>Exam: {r.exam?.title}</Text>
                  <Text style={styles.listSub}>Course: {r.exam?.course?.title} · Score: {r.totalMarksObtained}/{r.exam?.totalMarks} · Grade: {r.grade}</Text>
                  <Text style={styles.listSub}>Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>No results yet. Tap refresh above to load.</Text>}
          </View>
        )}

        {/* 7. NOTIFICATIONS */}
        {activeTab === 'notify' && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Send Push Announcement</Text>
              <TextInput style={styles.inputArea} placeholder="Message to all students..." multiline value={notificationMsg} onChangeText={setNotificationMsg} />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendNotification}>
                <Text style={styles.sendBtnText}>Broadcast Message</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Manage Announcements</Text>
            {notifications.map(n => (
              <View key={n._id} style={styles.listItem}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{n.title}</Text>
                  <Text style={styles.listSub}>{n.message}</Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => deleteNotification(n._id)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
            {notifications.length === 0 && <Text style={styles.emptyText}>No announcements sent.</Text>}
          </View>
        )}

        {/* 8. CHATBOT LOGS */}
        {activeTab === 'chatbot' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Chatbot Query Logs</Text>
              <TouchableOpacity onPress={fetchAdminData}>
                <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
              </TouchableOpacity>
            </View>
            {chatLogs.map(log => (
              <View key={log._id} style={styles.listItemCol}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={styles.logUser}>{log.user?.email || 'Unknown User'}</Text>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: 'rgba(248,113,113,0.18)' }]}
                    onPress={() => {
                      triggerConfirm('Delete Chat Log', `Delete all chat history for ${log.user?.email || 'this user'}?`, async () => {
                        try {
                          await apiClient.delete(`/chat/admin/logs/${log._id}`);
                          setChatLogs(chatLogs.filter(c => c._id !== log._id));
                          showAlert('Success', 'Chat log deleted');
                        } catch (err) { showAlert('Error', 'Failed to delete chat log'); }
                      }, 'Delete');
                    }}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
                {log.messages.map((m, i) => (
                  <Text key={i} style={m.sender === 'User' ? styles.logUserMsg : styles.logBotMsg}>
                    [{m.sender}]: {m.text}
                  </Text>
                ))}
              </View>
            ))}
            {chatLogs.length === 0 && <Text style={styles.emptyText}>No chat queries recorded.</Text>}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;
