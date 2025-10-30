import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppLock } from '../contexts/AppLockContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import DigitInputs from '../components/DigitInputs';

type PasswordConfirmScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PasswordConfirm'>;
type PasswordConfirmScreenRouteProp = RouteProp<RootStackParamList, 'PasswordConfirm'>;

const PasswordConfirmScreen: React.FC = () => {
  const [confirmPassword, setConfirmPassword] = useState<string[]>(['', '', '', '']);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const navigation = useNavigation<PasswordConfirmScreenNavigationProp>();
  const route = useRoute<PasswordConfirmScreenRouteProp>();
  const { setupPassword } = useAppLock();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  
  // 从路由参数中获取第一次输入的密码
  const firstPassword = route.params?.firstPassword || '';
  
  // 监听键盘事件，调整键盘偏移量
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOffset(0);
    });
    
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  const handleConfirm = async () => {
    const confirmPasswordStr = confirmPassword.join('');
    // console.log('确认密码长度:', confirmPasswordStr.length);
    // console.log('确认密码值:', confirmPasswordStr);
    // console.log('第一次密码值:', firstPassword);
    
    // 检查是否所有四个输入框都有值
    if (confirmPassword.some(digit => !digit) || confirmPasswordStr.length !== 4) {
      Alert.alert(t('错误'), t('请输入4位确认密码'));
      return;
    }
    
    if (firstPassword !== confirmPasswordStr) {
      Alert.alert(t('错误'), t('两次输入的密码不一致'));
      // 清空确认密码
      setConfirmPassword(['', '', '', '']);
      return;
    }
    
    try {
      await setupPassword(firstPassword);
      // console.log('密码设置成功，准备导航到主页面');
      // 直接导航，不等待用户点击Alert按钮
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      // 也可以保留Alert提示，但不依赖它进行导航
      Alert.alert(t('成功'), t('密码设置成功'));
    } catch (error) {
      // console.error('设置密码失败:', error);
      Alert.alert(t('错误'), t('设置密码失败'));
    }
  };
  
  const handleBack = () => {
    // 返回上一页（密码设置页面）
    navigation.goBack();
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.darkContainer]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contentWrapper, { paddingBottom: keyboardOffset }]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>{t('确认密码')}</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>{t('请再次输入4位数字密码')}</Text>
          
          <View style={styles.digitInputContainer}>
            <DigitInputs 
              value={confirmPassword} 
              onChange={setConfirmPassword} 
              isDarkMode={isDarkMode} 
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
              <Text style={[styles.buttonText, styles.backButtonText]}>{t('返回')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={styles.buttonText}>{t('确认')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
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
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    color: '#666',
  },
  digitInputContainer: {
    marginVertical: 30,
  },
  darkText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkBackButton: {
    borderColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#3B82F6',
  },
});

export default PasswordConfirmScreen;