import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Web环境下使用localStorage，原生环境下使用AsyncStorage
let AsyncStorage: any;
if (Platform.OS === 'web') {
  AsyncStorage = {
    getItem: async (key: string) => {
      return localStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      localStorage.removeItem(key);
    },
  };
} else {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}
// 导入调整过的AppSettings类型（已移除biometricAuth和autoLogoutTime属性）
import { AppSettings, AuthType, AuthSettings } from '../types/workflow';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppLock } from '../contexts/AppLockContext';

const SETTINGS_KEY = 'appSettings';

// 默认设置
const defaultSettings: AppSettings = {
  n8nUrl: 'http://localhost:5678',
  auth: {
    type: 'none',
  },
  darkMode: false,
  appLock: false,
  maxErrorLogs: 100, // 默认最多保存100条错误日志
  // biometricAuth和autoLogoutTime已移至三期开发
};

// 移除了不再需要的本地计算函数，现在直接使用AppLockContext中的appLockEnabled状态

const SettingsScreen = ({ navigation }: any) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const { hasPasswordSet, clearPassword, lockApp, appLockEnabled, updateAppLockEnabled } = useAppLock();
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [tempAuth, setTempAuth] = useState<AuthSettings>({ type: 'none' });
  // 自动登出时间相关状态已移除
  const [isEditingMaxErrorLogs, setIsEditingMaxErrorLogs] = useState(false);
  const [tempMaxErrorLogs, setTempMaxErrorLogs] = useState('');
  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false);
  
  // 监听深色模式变化
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode
    }));
  }, [isDarkMode]);

  // 监听appLockEnabled变化，更新本地设置状态
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appLock: appLockEnabled
    }));
  }, [appLockEnabled]);

  // 额外的useEffect来监听导航事件，确保从密码设置页面返回时开关状态正确
  useEffect(() => {
    // 当页面获得焦点时，已经通过appLockEnabled的变化更新了状态
    // 不需要额外的操作，因为AppLockContext中的状态已经是最新的
    return () => {};
  }, [navigation]);

  // 加载保存的设置
  useEffect(() => {
    loadSettings();
  }, []);

  // 当设置发生变化时自动保存（除了深色模式，它由DarkModeContext处理）
  useEffect(() => {
    // 创建不包含darkMode的设置对象用于比较
    const { darkMode: _, ...settingsWithoutDarkMode } = settings;
    const { darkMode: __, ...defaultSettingsWithoutDarkMode } = defaultSettings;
    
    // 检查是否有需要保存的设置变化（不包括darkMode）
    if (JSON.stringify(settingsWithoutDarkMode) !== JSON.stringify(defaultSettingsWithoutDarkMode)) {
      saveSettings();
    }
  }, [settings]);

  // 加载保存的设置，但使用AppLockContext中的appLockEnabled状态
  const loadSettings = async () => {
    try {
      // 检查是否在浏览器环境中
      if (Platform.OS === 'web') {
        // 从localStorage加载设置
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // 确保所有设置项都存在，并为布尔值设置添加明确的类型转换
          const mergedSettings = {
            ...defaultSettings,
            ...parsedSettings,
            darkMode: Boolean(parsedSettings.darkMode),
            appLock: appLockEnabled, // 使用Context中的应用锁状态
            maxErrorLogs: parsedSettings.maxErrorLogs !== undefined ? parsedSettings.maxErrorLogs : defaultSettings.maxErrorLogs
          };
          setSettings(mergedSettings);
        } else {
          // 没有保存的设置时，使用Context中的应用锁状态
          setSettings(prev => ({
            ...prev,
            appLock: appLockEnabled
          }));
        }
      } else {
        // 在React Native环境中，使用AsyncStorage
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // 确保所有设置项都存在，并为布尔值设置添加明确的类型转换
          const mergedSettings = {
            ...defaultSettings,
            ...parsedSettings,
            darkMode: Boolean(parsedSettings.darkMode),
            appLock: appLockEnabled, // 使用Context中的应用锁状态
            maxErrorLogs: parsedSettings.maxErrorLogs !== undefined ? parsedSettings.maxErrorLogs : defaultSettings.maxErrorLogs
          };
          setSettings(mergedSettings);
        } else {
          // 没有保存的设置时，使用Context中的应用锁状态
          setSettings(prev => ({
            ...prev,
            appLock: appLockEnabled
          }));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // 出错时使用Context中的应用锁状态
      setSettings(prev => ({
        ...prev,
        appLock: appLockEnabled
      }));
    }
  };

  const saveSettings = async () => {
    try {
      // 创建不包含darkMode的设置对象用于保存
      const { darkMode: _, ...settingsToSave } = settings;
      
      // 检查是否在浏览器环境中
      if (Platform.OS === 'web') {
        // 获取现有的设置
        const existingSettings = localStorage.getItem(SETTINGS_KEY);
        let mergedSettings = {
          ...defaultSettings,
          ...settings
        };
        
        // 如果存在现有设置，则合并它们
        if (existingSettings) {
          const parsedExistingSettings = JSON.parse(existingSettings);
          mergedSettings = {
            ...parsedExistingSettings,
            ...settings
          };
        }
        
        // 保存设置到localStorage
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
        // console.log('设置已自动保存到localStorage:', mergedSettings);
      } else {
        // 在React Native环境中，使用AsyncStorage
        // 获取现有的设置
        const existingSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        let mergedSettings = {
          ...defaultSettings,
          ...settings
        };
        
        // 如果存在现有设置，则合并它们
        if (existingSettings) {
          const parsedExistingSettings = JSON.parse(existingSettings);
          mergedSettings = {
            ...parsedExistingSettings,
            ...settings
          };
        }
        
        // 保存设置到AsyncStorage
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
        // console.log('设置已自动保存到AsyncStorage:', mergedSettings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const startEditUrl = () => {
    setTempUrl(settings.n8nUrl);
    setIsEditingUrl(true);
  };

  const confirmEditUrl = () => {
    if (tempUrl.trim() !== '') {
      const newUrl = tempUrl.trim();
      setSettings({
        ...settings,
        n8nUrl: newUrl,
      });
      
      // 保存设置后通知其他组件URL已更改
      if (Platform.OS === 'web') {
        try {
          // 保存到localStorage
          const settingsToSave = { ...settings, n8nUrl: newUrl };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
          
          // 发送自定义事件通知URL更改
          window.dispatchEvent(new CustomEvent('n8nUrlChanged', { detail: newUrl }));
        } catch (e) {
          console.error('Failed to send URL change event:', e);
        }
      } else {
        // 在React Native环境中，使用AsyncStorage
        try {
          // 保存到AsyncStorage
          const settingsToSave = { ...settings, n8nUrl: newUrl };
          AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
          
          // 在React Native中触发一个自定义事件，通知其他组件URL已更改
          // 由于React Native没有window对象，我们使用DeviceEventEmitter
          const { DeviceEventEmitter } = require('react-native');
          if (DeviceEventEmitter) {
            DeviceEventEmitter.emit('n8nUrlChanged', newUrl);
          }
        } catch (e) {
          console.error('Failed to save URL to AsyncStorage:', e);
        }
      }
    }
    
    setIsEditingUrl(false);
  };

  const startEditAuth = () => {
    setTempAuth({ ...settings.auth });
    setIsEditingAuth(true);
  };

  const confirmEditAuth = () => {
    setSettings({
      ...settings,
      auth: tempAuth,
    });
    
    // 保存设置后通知其他组件认证信息已更改
    if (Platform.OS === 'web') {
      try {
        // 保存到localStorage
        const settingsToSave = { ...settings, auth: tempAuth };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
        
        // 发送自定义事件通知认证信息更改
        window.dispatchEvent(new CustomEvent('n8nAuthChanged', { detail: tempAuth }));
      } catch (e) {
        console.error('Failed to send auth change event:', e);
      }
    } else {
      // 在React Native环境中，使用AsyncStorage
      try {
        // 保存到AsyncStorage
        const settingsToSave = { ...settings, auth: tempAuth };
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
        
        // 在React Native中触发一个自定义事件，通知其他组件认证信息已更改
        const { DeviceEventEmitter } = require('react-native');
        if (DeviceEventEmitter) {
          DeviceEventEmitter.emit('n8nAuthChanged', tempAuth);
        }
      } catch (e) {
        console.error('Failed to save auth to AsyncStorage:', e);
      }
    }
    
    setIsEditingAuth(false);
  };

  const cancelEditUrl = () => {
    setIsEditingUrl(false);
  };

  const cancelEditAuth = () => {
    setIsEditingAuth(false);
  };

  // 自动登出时间功能已移至三期开发

  const startEditMaxErrorLogs = () => {
    setTempMaxErrorLogs(settings.maxErrorLogs.toString());
    setIsEditingMaxErrorLogs(true);
  };

  const confirmEditMaxErrorLogs = () => {
    const maxLogs = parseInt(tempMaxErrorLogs, 10);
    if (!isNaN(maxLogs) && maxLogs >= 0) {
      setSettings({
        ...settings,
        maxErrorLogs: maxLogs,
      });
      setIsEditingMaxErrorLogs(false);
    } else {
      Alert.alert('无效输入', '请输入一个有效的数字');
    }
  };

  const cancelEditMaxErrorLogs = () => {
    setIsEditingMaxErrorLogs(false);
  };

  const handleToggleDarkMode = (value: boolean) => {
    setSettings({
      ...settings,
      darkMode: value,
    });
    toggleDarkMode(); // 调用DarkModeContext中的切换方法
  };

  // 生物识别认证功能已移至三期开发

  const handleToggleAppLock = async (value: boolean) => {
    // 检查是否要启用应用锁
    if (value) {
      // 启用应用锁时，检查是否已设置密码
      if (!hasPasswordSet) {
        // 如果没有设置密码，导航到密码设置页面，但先设置appLock为true
        setSettings({
          ...settings,
          appLock: value,
        });
        navigation.navigate('PasswordSetup');
      } else {
        // 如果已有密码，直接启用应用锁
        setSettings({
          ...settings,
          appLock: value,
        });
        // 立即锁定应用
        lockApp();
      }
    } else {
      // 禁用应用锁时，清除密码
      try {
        await clearPassword();
        setSettings({
          ...settings,
          appLock: value,
        });
      } catch (error) {
        console.error('禁用应用锁失败:', error);
      }
    }
  };

  const selectLanguage = (langCode: string) => {
    setLanguage(langCode);
    setIsSelectingLanguage(false);
  };

  // 处理认证类型更改
  const handleAuthTypeChange = (type: AuthType) => {
    setTempAuth({
      ...tempAuth,
      type,
    });
  };

  // 处理Basic Auth用户名更改
  const handleBasicUsernameChange = (username: string) => {
    const basicAuth = tempAuth.basic || { username: '', password: '' };
    setTempAuth({
      ...tempAuth,
      basic: {
        ...basicAuth,
        username,
      },
    });
  };

  // 处理Basic Auth密码更改
  const handleBasicPasswordChange = (password: string) => {
    const basicAuth = tempAuth.basic || { username: '', password: '' };
    setTempAuth({
      ...tempAuth,
      basic: {
        ...basicAuth,
        password,
      },
    });
  };

  // 处理Header Auth键更改
  const handleHeaderKeyChange = (key: string) => {
    const headerAuth = tempAuth.header || { key: '', value: '' };
    setTempAuth({
      ...tempAuth,
      header: {
        ...headerAuth,
        key,
      },
    });
  };

  // 处理Header Auth值更改
  const handleHeaderValueChange = (value: string) => {
    const headerAuth = tempAuth.header || { key: '', value: '' };
    setTempAuth({
      ...tempAuth,
      header: {
        ...headerAuth,
        value,
      },
    });
  };

  // 处理JWT Token更改
  const handleJwtTokenChange = (token: string) => {
    const jwtAuth = tempAuth.jwt || { token: '' };
    setTempAuth({
      ...tempAuth,
      jwt: {
        ...jwtAuth,
        token,
      },
    });
  };

  // 新增状态用于控制认证设置模态框
  const [isEditingAuth, setIsEditingAuth] = useState(false);

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('连接设置')}</Text>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('n8n服务器URL')}</Text>
          <Text style={[styles.settingValue, isDarkMode && styles.darkText]} numberOfLines={1}>{settings.n8nUrl}</Text>
          <TouchableOpacity style={styles.editButton} onPress={startEditUrl}>
            <Text style={styles.editButtonText}>{t('编辑')}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('认证设置')}</Text>
          <Text style={[styles.settingValue, isDarkMode && styles.darkText]}>
            {settings.auth.type === 'none' && t('无认证')}
            {settings.auth.type === 'basic' && t('Basic认证')}
            {settings.auth.type === 'header' && t('Header认证')}
            {settings.auth.type === 'jwt' && t('JWT认证')}
          </Text>
          <TouchableOpacity style={styles.editButton} onPress={startEditAuth}>
            <Text style={styles.editButtonText}>{t('编辑')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('用户界面')}</Text>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('深色模式')}</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={handleToggleDarkMode}
            trackColor={{
              false: isDarkMode ? '#4a4a4a' : '#767577',
              true: isDarkMode ? '#5e92f3' : '#81b0ff'
            }}
            thumbColor={
              isDarkMode 
                ? settings.darkMode ? '#33a000ff' : '#e0e0e0'
                : settings.darkMode ? '#33a000ff' : '#cecbcbff'
            }
            ios_backgroundColor={isDarkMode ? '#3e3e3e' : '#e0e0e0'}
          />
        </View>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{'语言/Language'}</Text>
          <Text style={[styles.settingValue, isDarkMode && styles.darkText]}>
            {supportedLanguages.find(lang => lang.code === language)?.name || 'English'}
          </Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsSelectingLanguage(true)}>
            <Text style={styles.editButtonText}>{t('选择')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('安全设置')}</Text>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('应用锁')}</Text>
          <Switch
            value={settings.appLock}
            onValueChange={handleToggleAppLock}
            trackColor={{
              false: isDarkMode ? '#4a4a4a' : '#767577',
              true: isDarkMode ? '#5e92f3' : '#81b0ff'
            }}
            thumbColor={
              isDarkMode 
                ? settings.appLock ? '#33a000ff' : '#e0e0e0'
                : settings.appLock ? '#33a000ff' : '#cecbcbff'
            }
            ios_backgroundColor={isDarkMode ? '#3e3e3e' : '#e0e0e0'}
            disabled={false}
          />
        </View>
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('系统设置')}</Text>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('最大错误日志数')}</Text>
          <Text style={[styles.settingValue, isDarkMode && styles.darkText]}>{settings.maxErrorLogs}{t('条')}</Text>
          <TouchableOpacity style={styles.editButton} onPress={startEditMaxErrorLogs}>
            <Text style={styles.editButtonText}>{t('编辑')}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('查看错误日志')}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('ErrorLogsList')}>
            <Text style={styles.editButtonText}>{t('查看')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 法律条款 */}
      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('法律条款')}</Text>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('隐私政策')}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.editButtonText}>{t('查看')}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('服务条款')}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('TermsOfService')}>
            <Text style={styles.editButtonText}>{t('查看')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 关于项 */}
      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('关于')}</Text>
        <View style={language === 'zh' ? [styles.aboutImageContainer, isDarkMode && styles.darkAboutImageContainer] : [styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          {language === 'zh' ? (
            <Image 
              source={require('../../assets/gzh02.jpg')} 
              style={styles.aboutImage}
              resizeMode="contain"
            />
          ) : (
          <View>
            <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>Email：liuxinchao40@gmail.com</Text>
            <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>Email：hundred98@163.com</Text>
          </View>
          )}
        </View>
      </View>

      {/* 编辑URL的模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingUrl}
        onRequestClose={() => {}} // 禁用硬件返回键关闭
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{t('编辑n8n服务器URL')}</Text>
            <TextInput
              style={[styles.textInput, isDarkMode && styles.darkTextInput]}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder={t('输入n8n服务器URL')}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelEditUrl}
              >
                <Text style={styles.modalButtonText}>{t('取消')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]} 
                onPress={confirmEditUrl}
              >
                <Text style={styles.modalButtonText}>{t('确定')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 认证设置模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingAuth}
        onRequestClose={() => {}} // 禁用硬件返回键关闭
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{t('认证设置')}</Text>
            
            {/* 认证类型选择 */}
            <View style={{ marginVertical: 10 }}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{t('认证类型')}</Text>
              <Picker
                selectedValue={tempAuth.type}
                onValueChange={handleAuthTypeChange}
                style={[styles.picker, isDarkMode && styles.darkPicker]}
              >
                <Picker.Item label={t('无认证')} value="none" />
                <Picker.Item label={t('Basic认证')} value="basic" />
                <Picker.Item label={t('Header认证')} value="header" />
                <Picker.Item label={t('JWT认证')} value="jwt" />
              </Picker>
            </View>
            
            {/* Basic Auth */}
            {tempAuth.type === 'basic' && (
              <>
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput, { marginTop: 10 }]}
                  value={tempAuth.basic?.username || ''}
                  onChangeText={handleBasicUsernameChange}
                  placeholder={t('用户名')}
                />
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput, { marginTop: 10 }]}
                  value={tempAuth.basic?.password || ''}
                  onChangeText={handleBasicPasswordChange}
                  placeholder={t('密码')}
                  secureTextEntry
                />
              </>
            )}
            
            {/* Header Auth */}
            {tempAuth.type === 'header' && (
              <>
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput, { marginTop: 10 }]}
                  value={tempAuth.header?.key || ''}
                  onChangeText={handleHeaderKeyChange}
                  placeholder={t('Header键')}
                />
                <TextInput
                  style={[styles.textInput, isDarkMode && styles.darkTextInput, { marginTop: 10 }]}
                  value={tempAuth.header?.value || ''}
                  onChangeText={handleHeaderValueChange}
                  placeholder={t('Header值')}
                />
              </>
            )}
            
            {/* JWT Auth */}
            {tempAuth.type === 'jwt' && (
              <TextInput
                style={[styles.textInput, isDarkMode && styles.darkTextInput, { marginTop: 10 }]}
                value={tempAuth.jwt?.token || ''}
                onChangeText={handleJwtTokenChange}
                placeholder={t('JWT Token')}
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelEditAuth}
              >
                <Text style={styles.modalButtonText}>{t('取消')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]} 
                onPress={confirmEditAuth}
              >
                <Text style={styles.modalButtonText}>{t('确定')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 自动登出时间模态框已移除 */}

      {/* 编辑最大错误日志数的模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingMaxErrorLogs}
        onRequestClose={() => {}} // 禁用硬件返回键关闭
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{t('编辑最大错误日志数')}</Text>
            <TextInput
              style={[styles.textInput, isDarkMode && styles.darkTextInput]}
              value={tempMaxErrorLogs}
              onChangeText={setTempMaxErrorLogs}
              placeholder={t('输入最大错误日志数')}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelEditMaxErrorLogs}
              >
                <Text style={styles.modalButtonText}>{t('取消')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]} 
                onPress={confirmEditMaxErrorLogs}
              >
                <Text style={styles.modalButtonText}>{t('确定')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 语言选择模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSelectingLanguage}
        onRequestClose={() => setIsSelectingLanguage(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{t('选择语言')}</Text>
            {supportedLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageOption, isDarkMode && styles.darkSettingItem]}
                onPress={() => selectLanguage(lang.code)}
              >
                <Text style={[styles.languageOptionText, isDarkMode && styles.darkText, language === lang.code && styles.selectedLanguage]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsSelectingLanguage(false)}
              >
                <Text style={styles.modalButtonText}>{t('取消')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  darkHeader: {
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  darkText: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 16,
  },
  darkSection: {
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkSettingItem: {
    borderBottomColor: '#444444',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: '#6B7280',
    flex: 2,
    textAlign: 'right',
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#1E1E1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  darkTextInput: {
    borderColor: '#444444',
    color: '#FFFFFF',
    backgroundColor: '#333333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  languageOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedLanguage: {
    fontWeight: '700',
    color: '#3B82F6',
  },
  aboutImageContainer: {
    alignItems: 'center',
    padding: 10,
  },
  darkAboutImageContainer: {
    backgroundColor: '#333333',
  },
  aboutImage: {
    width: '100%',
    height: 200,
  },
  picker: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  darkPicker: {
    borderColor: '#444444',
    color: '#FFFFFF',
    backgroundColor: '#333333',
  },
});

export default SettingsScreen;