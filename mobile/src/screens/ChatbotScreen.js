import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { showAlert, showConfirm } from '../utils/webAlert';
import { useTheme, cardShadowStyle } from '../context/ThemeContext';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const ChatbotScreen = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I'm your LMS Assistant. How can I help you today?", sender: 'Bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Voice.onSpeechStart = () => setIsListening(true);
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechError = (e) => {
        setIsListening(false);
        console.log('Voice Error:', e);
      };
      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
          setInputText(e.value[0]);
        }
      };
      
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
        Tts.stop();
      };
    }
  }, []);

  const startVoiceInput = async () => {
    if (isListening) {
      if (Platform.OS !== 'web') {
        try {
          await Voice.stop();
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsListening(false);
      }
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
        showAlert('Voice Error', 'Could not recognize speech. Please try again.');
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else if (Platform.OS !== 'web') {
      try {
        setIsListening(true);
        await Voice.start('en-US');
      } catch (e) {
        setIsListening(false);
        console.error('Voice Start Error:', e);
        showAlert('Voice Error', 'Speech recognition is not available or permission denied.');
      }
    } else {
      showAlert('Voice Input', 'Voice input is not supported on this device/browser.');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiClient.get('/chat/history');
      const history = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(history)) {
        const historyMsgs = history.map((m, i) => ({
          id: `history-${i}`,
          text: m.text,
          sender: m.sender,
        }));
        if (historyMsgs.length > 0) {
          setMessages(historyMsgs);
        }
      }
    } catch {
      console.log('No chat history yet');
    }
  };

  const clearChat = () => {
    showConfirm(
      'Clear Chat',
      'Delete all chat history?',
      async () => {
        try {
          await apiClient.delete('/chat/clear');
          setMessages([
            { id: '1', text: "Hello! I'm your LMS Assistant. How can I help you today?", sender: 'Bot' },
          ]);
        } catch {
          showAlert('Error', 'Failed to clear chat');
        }
      },
      'Clear'
    );
  };

  const speakText = (text) => {
    // Strip markdown formatting for cleaner speech
    const clean = text.replace(/[*#_`\[\]()]/g, '').replace(/\\n/g, '. ');
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel(); // stop any previous speech
      window.speechSynthesis.speak(utterance);
    } else if (Platform.OS !== 'web') {
      Tts.stop();
      Tts.speak(clean);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || sending) return;

    const userMsg = { id: Date.now().toString(), text: inputText, sender: 'User' };
    setMessages((prev) => [...prev, userMsg]);
    const msgText = inputText;
    setInputText('');
    setSending(true);

    try {
      const response = await apiClient.post('/chat/message', { text: msgText });
      const botReply = response.data.response;
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: 'Bot',
      };
      setMessages((prev) => [...prev, botMsg]);
      speakText(botReply);
    } catch {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now.",
        sender: 'Bot',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.chatHeader, cardShadowStyle(theme)]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.robotDot, { backgroundColor: theme.primarySoft }]}>
            <MaterialCommunityIcons name="robot" size={22} color={theme.primary} />
          </View>
          <View>
            <Text style={styles.chatHeaderTitle}>LMS Assistant</Text>
            <Text style={styles.chatHeaderHint}>Ask about courses or how to navigate the app.</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { borderColor: theme.border }]}>
          <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={theme.error} />
          <Text style={[styles.clearBtnText, { color: theme.error }]}>Clear</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <View
              style={[styles.msgContainer, item.sender === 'User' ? styles.userContainer : styles.botContainer]}
            >
              {item.sender === 'Bot' && (
                <View style={[styles.botAvatar, { backgroundColor: theme.primary }]}>
                  <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
                </View>
              )}
              <View
                style={[
                  styles.msgBox,
                  item.sender === 'User'
                    ? { backgroundColor: theme.primary, borderBottomRightRadius: 6 }
                    : { backgroundColor: theme.card, borderColor: theme.border, borderBottomLeftRadius: 6 },
                  cardShadowStyle(theme),
                ]}
              >
                <Text
                  style={[styles.msgText, { color: item.sender === 'User' ? '#FFFFFF' : theme.text }]}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={[styles.inputArea, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me something..."
            placeholderTextColor={theme.textTertiary}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={startVoiceInput}
            style={[
              styles.micBtn,
              {
                backgroundColor: isListening ? theme.error : theme.textSecondary,
              },
            ]}
          >
            <MaterialCommunityIcons name={isListening ? 'microphone' : 'microphone-outline'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: sending ? 0.5 : 1 }]}
            disabled={sending}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      zIndex: 1,
    },
    robotDot: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    chatHeaderTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    chatHeaderHint: { fontSize: 12, color: theme.textTertiary, marginTop: 2 },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      backgroundColor: theme.surface,
    },
    clearBtnText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
    chatList: { padding: 18, paddingBottom: 28 },
    msgContainer: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-end' },
    userContainer: { justifyContent: 'flex-end' },
    botContainer: { justifyContent: 'flex-start' },
    botAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      marginBottom: 4,
    },
    msgBox: {
      maxWidth: '78%',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: theme.radiusLg,
      borderBottomRightRadius: 6,
      borderBottomLeftRadius: 6,
    },
    msgText: { fontSize: 15, lineHeight: 23 },
    inputArea: {
      flexDirection: 'row',
      padding: 14,
      borderTopWidth: 1,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      borderRadius: 22,
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 11,
      marginRight: 10,
      fontSize: 15,
      maxHeight: 112,
    },
    micBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      marginBottom: 2,
    },
    sendBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
  });
}

export default ChatbotScreen;
