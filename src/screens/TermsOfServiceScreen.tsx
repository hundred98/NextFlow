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

const TermsOfServiceScreen = ({ navigation }: any) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();

  const handleOpenEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          {t('服务条款')}
        </Text>
        
        <Text style={[styles.lastUpdated, isDarkMode && styles.darkText]}>
          {t('最后更新')}: 2024-10-24
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('1. 接受条款')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Terms of Service / 服务条款
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            By downloading, installing, or using the NextFlow app (hereinafter referred to as "the App"), you agree to comply with these terms of service. If you do not agree to these terms, please do not use the App. / 通过下载、安装或使用NextFlow应用（以下简称"本应用"），即表示您同意遵守本服务条款。如果您不同意这些条款，请不要使用本应用。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('2. 服务描述')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Service Description / 服务描述
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            This app is a mobile tool for connecting and managing the N8N automation workflow platform. The app itself does not provide automation services, but serves as a client tool for the N8N platform. / 本应用是一个移动端工具，用于连接和管理N8N自动化工作流平台。本应用本身不提供自动化服务，而是作为N8N平台的客户端工具。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('3. 用户责任')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            User Responsibilities / 用户责任
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            You are responsible for: / 您有责任：
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Ensuring you have the right to access and configure the N8N server / 确保您有权访问和配置的N8N服务器
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Safeguarding your authentication information / 妥善保管您的认证信息
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Complying with all applicable laws and regulations / 遵守所有适用的法律法规
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Not using the app for illegal purposes / 不将本应用用于非法目的
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('4. 知识产权')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Intellectual Property / 知识产权
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            The intellectual property rights of the source code, design, interface, and related documentation of this app belong to the developer. N8N is a trademark of n8n.io. / 本应用的源代码、设计、界面和相关文档的知识产权归开发者所有。N8N是n8n.io的商标。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('5. 免责声明')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Disclaimer / 免责声明
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            The app is provided "as is" without any warranties of any kind. The developer is not responsible for: / 本应用按"原样"提供，不提供任何形式的担保。开发者不对以下情况负责：
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Any direct or indirect losses caused by using the app / 因使用本应用导致的任何直接或间接损失
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Availability or performance issues of the N8N server / N8N服务器的可用性或性能问题
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Data loss or leakage / 数据丢失或泄露
          </Text>
          <Text style={[styles.listItem, isDarkMode && styles.darkText]}>
            • Availability of third-party services / 第三方服务的可用性
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('6. 服务变更和中止')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Service Changes and Termination / 服务变更和中止
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            We reserve the right to modify, suspend, or terminate the app service at any time without prior notice. / 我们保留随时修改、暂停或终止本应用服务的权利，恕不另行通知。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('7. 适用法律')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Governing Law / 适用法律
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            These terms are governed by the laws of the People's Republic of China. Any disputes shall be resolved through friendly consultation. If no settlement can be reached, the dispute shall be submitted to the people's court with jurisdiction for litigation. / 本条款受中华人民共和国法律管辖。任何争议应通过友好协商解决，协商不成的，提交有管辖权的人民法院诉讼解决。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('8. 条款变更')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Changes to Terms / 条款变更
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            We may update these terms of service from time to time. Major changes will be notified within the app. Continued use of the app indicates your acceptance of the updated terms. / 我们可能会不时更新本服务条款。重大变更将在应用内通知。继续使用本应用即表示您接受更新后的条款。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            {t('9. 联系我们')}
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            Contact Us / 联系我们
          </Text>
          <Text style={[styles.text, isDarkMode && styles.darkText]}>
            If you have any questions about these terms of service, please contact: / 如果您对本服务条款有任何疑问，请联系：
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
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginLeft: 15,
    marginBottom: 5,
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

export default TermsOfServiceScreen;