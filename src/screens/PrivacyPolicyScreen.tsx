import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking
} from 'react-native';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

const PrivacyPolicyScreen = ({ navigation }: any) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();

  const handleOpenEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          {t('隐私政策')}
        </Text>
        
        <Text style={[styles.lastUpdated, isDarkMode && styles.darkText]}>
          {t('最后更新')}: 2024-10-24
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('1. 信息收集')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Privacy Policy / 隐私政策
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            NextFlow respects and protects your privacy. The app does not collect or store any personally identifiable information. All setting data (such as server URL, authentication information, etc.) is stored locally on your device. / NextFlow应用尊重并保护您的隐私。本应用不会收集或存储任何个人身份信息。所有设置数据（如服务器URL、认证信息等）仅存储在您的设备本地。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('2. 数据存储')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Data Storage / 数据存储
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            All app data (including settings, workflow information, error logs, etc.) is stored locally on your device. We do not transmit any data to third-party servers unless you explicitly configure an N8N server address. / 所有应用数据（包括设置、工作流信息、错误日志等）仅存储在您的设备本地。我们不会将任何数据传输到第三方服务器，除非您明确配置了N8N服务器地址。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('3. 网络连接')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Network Connection / 网络连接
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            The app requires network permissions to connect to your configured N8N server. All network requests are sent directly to your specified server without passing through our servers. / 应用需要网络权限来连接您配置的N8N服务器。所有网络请求都直接发送到您指定的服务器，不会经过我们的服务器中转。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('4. 应用锁功能')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            App Lock Feature / 应用锁功能
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            The password for the app lock feature is stored locally on the device only, for protecting app access. We cannot access or recover your password. / 应用锁功能的密码仅存储在设备本地，用于保护应用访问。我们无法访问或恢复您的密码。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('5. 第三方服务')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Third-Party Services / 第三方服务
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            This app does not contain any third-party analytics, advertising, or tracking services. / 本应用不包含任何第三方分析、广告或跟踪服务。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('6. 儿童隐私')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Children's Privacy / 儿童隐私
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            This app is not intended for children under 13 years of age and does not knowingly collect personal information from children under 13. / 本应用不面向13岁以下儿童，也不会故意收集13岁以下儿童的个人信息。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('7. 政策变更')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Policy Changes / 政策变更
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            We may update this privacy policy from time to time. Major changes will be notified within the app. / 我们可能会不时更新本隐私政策。重大变更将在应用内通知。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('8. 联系我们')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Contact Us / 联系我们
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            If you have any questions about this privacy policy, please contact: / 如果您对本隐私政策有任何疑问，请联系：
          </Text>
          <TouchableOpacity onPress={() => handleOpenEmail('liuxinchao40@gmail.com')}>
            <Text style={[styles.email, isDarkMode && styles.darkText]}>
              liuxinchao40@gmail.com
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenEmail('hundred98@163.com')}>
            <Text style={[styles.email, isDarkMode && styles.darkText]}>
              hundred98@163.com
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDarkMode && styles.darkText]}>
            © 2024 NextFlow. All rights reserved. / © 2024 NextFlow. 保留所有权利。
          </Text>
        </View>
      </View>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  darkText: {
    color: '#FFFFFF',
  },
  email: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  darkFooter: {
    borderTopColor: '#2D2D2D',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;