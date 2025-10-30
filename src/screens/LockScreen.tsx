import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppLock } from '../contexts/AppLockContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import DigitInputs from '../components/DigitInputs';

const LockScreen: React.FC = () => {
  const [password, setPassword] = useState<string[]>(['', '', '', '']);
  const { unlockApp } = useAppLock();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  
  // 检查是否所有密码都已输入
  useEffect(() => {
    const fullPassword = password.join('');
    if (fullPassword.length === 4) {
      handleUnlock(fullPassword);
    }
  }, [password]);
  
  const handleUnlock = async (fullPassword: string) => {
    try {
      const success = await unlockApp(fullPassword);
      if (!success) {
        Alert.alert(t('错误'), t('密码错误，请重试'));
        // 清空密码，DigitInputs组件会自动处理聚焦
        setPassword(['', '', '', '']);
      }
    } catch (error) {
      Alert.alert(t('错误'), t('解锁失败'));
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.darkContainer]}
      keyboardVerticalOffset={80}
    >
      <View style={styles.contentWrapper}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>{t('请输入密码')}</Text>
        
        <DigitInputs 
          value={password}
          onChange={setPassword}
          isDarkMode={isDarkMode}
          immediateSecure={true} // 登录/解锁时立即显示密文
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1E1E1E',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
});

export default LockScreen;