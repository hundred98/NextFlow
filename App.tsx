import React, { useEffect } from 'react';
import {StatusBar, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import WorkflowListScreen from './src/screens/WorkflowListScreen';
import WorkflowDetailScreen from './src/screens/WorkflowDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ErrorLogsListScreen from './src/screens/ErrorLogsListScreen';
import LockScreen from './src/screens/LockScreen';
import PasswordSetupScreen from './src/screens/PasswordSetupScreen';
import PasswordConfirmScreen from './src/screens/PasswordConfirmScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import CustomIcon from './src/components/CustomIcon';
import { DarkModeProvider, useDarkMode } from './src/contexts/DarkModeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { AppLockProvider, useAppLock } from './src/contexts/AppLockContext';
import {WorkflowDetail} from './src/types/workflow';

// 定义底部导航的参数类型
export type RootTabParamList = {
  WorkflowList: undefined;
  Settings: undefined;
};

// 定义堆栈导航的参数类型
export type RootStackParamList = {
  Main: undefined; // 底部导航作为主屏幕
  WorkflowDetail: {workflow: WorkflowDetail};
  ErrorLogsList: undefined;
  LockScreen: undefined;
  PasswordSetup: undefined;
  PasswordConfirm: {firstPassword: string};
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// 创建底部导航栏
function HomeTabs() {
  const { isDarkMode } = useDarkMode();
  const { t, language } = useLanguage();
  
  // 在Web平台上注入全局CSS来隐藏title提示
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        [role="tab"] {
          title: "";
        }
        .rn-icon-button {
          title: "";
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          paddingTop: 5,
          // 确保内容不被设备底部安全区域遮挡
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 80 : 70,
        },
        tabBarHideOnKeyboard: true,
        // 确保标签文字大小合适
        tabBarLabelStyle: {
          fontSize: 14,
          marginBottom: 2,
        },
      }}>
      <Tab.Screen
        name="WorkflowList"
        component={WorkflowListScreen}
        options={{
          title: t('工作流'),
          tabBarLabel: t('工作流'),
          tabBarIcon: ({ color, size }) => (
            <CustomIcon name="workflow" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('设置'),
          tabBarLabel: t('设置'),
          tabBarIcon: ({ color, size }) => (
            <CustomIcon name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const { isLocked, lockApp, hasPasswordSet } = useAppLock();
  const [appReady, setAppReady] = React.useState(false);
  
  const theme = isDarkMode ? DarkTheme : DefaultTheme;

  // 应用启动时检查应用锁状态
  React.useEffect(() => {
    const checkAppLockOnStartup = async () => {
      try {
        // 检查是否启用了应用锁并且已设置密码
        const enabled = await AsyncStorage.getItem('appLockEnabled');
        const password = await AsyncStorage.getItem('app_lock_password');
        
        if (enabled === 'true' && password) {
          // 如果启用了应用锁且有密码，立即锁定应用
          lockApp();
        }
      } catch (error) {
        console.error('Failed to check app lock on startup:', error);
      } finally {
        // 确保应用准备就绪
        setAppReady(true);
      }
    };

    checkAppLockOnStartup();
  }, []);
  
  // 移除在设置密码后自动锁定应用的逻辑
  // 这样用户在设置完密码后可以直接进入应用而不需要再次解锁

  // 等待应用锁状态检查完成
  if (!appReady) {
    return null; // 或者返回一个加载指示器
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLocked ? (
          <Stack.Screen name="LockScreen" component={LockScreen} />
        ) : (
          [
            <Stack.Screen
              key="Main"
              name="Main"
              component={HomeTabs}
            />,
            <Stack.Screen
              key="WorkflowDetail"
              name="WorkflowDetail"
              component={WorkflowDetailScreen}
              options={{title: t('工作流详情'), headerShown: true}}
            />,
            <Stack.Screen
              key="ErrorLogsList"
              name="ErrorLogsList"
              component={ErrorLogsListScreen}
            />,
            <Stack.Screen
              key="PasswordSetup"
              name="PasswordSetup"
              component={PasswordSetupScreen}
              options={{title: t('设置密码'), headerShown: true, headerBackVisible: false}}
            />,
            <Stack.Screen
              key="PasswordConfirm"
              name="PasswordConfirm"
              component={PasswordConfirmScreen}
              options={{title: t('确认密码'), headerShown: true}}
            />,
            <Stack.Screen
              key="PrivacyPolicy"
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{title: t('隐私政策'), headerShown: true}}
            />,
            <Stack.Screen
              key="TermsOfService"
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{title: t('服务条款'), headerShown: true}}
            />
          ]
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <LanguageProvider>
        <AppLockProvider>
          <AppContent />
        </AppLockProvider>
      </LanguageProvider>
    </DarkModeProvider>
  );
}