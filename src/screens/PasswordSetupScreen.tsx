import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import DigitInputs from '../components/DigitInputs';

type PasswordSetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PasswordSetup'>;

const PasswordSetupScreen: React.FC = () => {
  const [password, setPassword] = useState<string[]>(['', '', '', '']);
  const navigation = useNavigation<PasswordSetupScreenNavigationProp>();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  
  const handleNext = () => {
    const passwordStr = password.join('');
    
    if (passwordStr.length < 4) {
      Alert.alert(t('错误'), t('密码长度必须为4位'));
      return;
    }
    
    navigation.navigate('PasswordConfirm', { firstPassword: passwordStr });
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.darkContainer]}
      keyboardVerticalOffset={80}
    >
      <View style={styles.contentWrapper}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>{t('设置应用锁密码')}</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>{t('请输入4位数字密码')}</Text>
        
        <DigitInputs 
          value={password} 
          onChange={setPassword} 
          isDarkMode={isDarkMode} 
        />
        
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
          <Text style={styles.buttonText}>{t('下一步')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1E1E1E',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  darkText: {
    color: '#fff',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 40,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PasswordSetupScreen;