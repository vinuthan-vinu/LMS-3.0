import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme, navThemeFrom } from './src/context/ThemeContext';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import ExamsScreen from './src/screens/ExamsScreen';
import ExamSessionScreen from './src/screens/ExamSessionScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import TimetableScreen from './src/screens/TimetableScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-circle-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'Courses') iconName = focused ? 'school' : 'school-outline';
          else if (route.name === 'Resources') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
          
          return <MaterialCommunityIcons name={iconName} size={size - 2} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          paddingHorizontal: 8,
          backgroundColor: theme.card,
          borderTopWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#0B1220',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: { elevation: 16 },
            web: { boxShadow: '0 -8px 40px rgba(11, 18, 32, 0.06)' },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const NavigationWrapper = () => {
  const { isDarkMode, theme } = useTheme();
  const navTheme = navThemeFrom(theme, isDarkMode);

  const stackHeader = {
    headerStyle: {
      backgroundColor: theme.card,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 17,
      letterSpacing: -0.2,
      color: theme.text,
    },
    headerTintColor: theme.primary,
    headerBackTitleVisible: false,
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: 'Exams & Results', ...stackHeader }} />
        <Stack.Screen name="ExamSession" component={ExamSessionScreen} options={{ title: 'Exam Session', headerShown: false }} />
        <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments', ...stackHeader }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'Assistant', ...stackHeader }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', ...stackHeader }} />
        <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable', ...stackHeader }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <NavigationWrapper />
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
