import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  FlatList,
  Alert,
  Clipboard // 添加Clipboard用于复制URL
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { WorkflowDetail } from '../types/workflow';

import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SETTINGS_KEY = 'appSettings';
const ERROR_LOGS_KEY = 'errorLogs';

// 保存错误日志到本地存储
const saveErrorLog = async (errorLog: any) => {
  try {
    const maxErrorLogs = 100; // 默认最大错误日志数
    
    // 获取现有的错误日志
    let existingLogs = [];
    if (Platform.OS === 'web') {
      const logsString = localStorage.getItem(ERROR_LOGS_KEY);
      existingLogs = logsString ? JSON.parse(logsString) : [];
    } else {
      const logsString = await AsyncStorage.getItem(ERROR_LOGS_KEY);
      existingLogs = logsString ? JSON.parse(logsString) : [];
    }
    
    // 确保错误日志包含调用堆栈信息
    const logWithStack = {
      ...errorLog,
      stack: errorLog.error ? errorLog.error.stack : undefined,
    };
    
    // 添加新的错误日志
    const updatedLogs = [logWithStack, ...existingLogs].slice(0, maxErrorLogs);
    
    // 保存更新后的日志
    if (Platform.OS === 'web') {
      localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
    } else {
      await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
    }
  } catch (error) {
    console.error('Error saving error log:', error);
  }
};

// 构建带认证的请求头
const buildAuthHeaders = (auth: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth && auth.type) {
    switch (auth.type) {
      case 'basic':
        if (auth.basic && auth.basic.username && auth.basic.password) {
          // React Native不支持btoa，需要使用Buffer
          const credentials = `${auth.basic.username}:${auth.basic.password}`;
          const encodedCredentials = Platform.OS === 'web' ? btoa(credentials) : Buffer.from(credentials).toString('base64');
          headers['Authorization'] = `Basic ${encodedCredentials}`;
        }
        break;
      case 'header':
        if (auth.header && auth.header.key && auth.header.value) {
          headers[auth.header.key] = auth.header.value;
        }
        break;
      case 'jwt':
        if (auth.jwt && auth.jwt.token) {
          headers['Authorization'] = `Bearer ${auth.jwt.token}`;
        }
        break;
      default:
        break;
    }
  }

  return headers;
};

type WorkflowDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkflowDetail'>;
type WorkflowDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkflowDetail'> & {
  navigate: NativeStackNavigationProp<RootStackParamList, 'Main'>['navigate'] & {
    (name: 'Settings'): void;
  };
};

type Props = {
  route: WorkflowDetailScreenRouteProp;
  navigation: WorkflowDetailScreenNavigationProp;
};

const WorkflowDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const { workflow } = route.params;
  
  const [n8nUrl, setN8nUrl] = useState(''); // 移除默认URL
  const [auth, setAuth] = useState<any>(null); // 添加认证状态
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [activeTab, setActiveTab] = useState<'nodes' | 'logs'>('nodes'); // 添加标签状态

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 检查是否在浏览器环境中
      if (Platform.OS === 'web') {
        // 从localStorage加载设置
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setN8nUrl(parsedSettings.n8nUrl || '');
          setAuth(parsedSettings.auth || null);
        }
      } else {
        // 在原生环境中，使用 AsyncStorage
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setN8nUrl(parsedSettings.n8nUrl || '');
          setAuth(parsedSettings.auth || null);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('激活');
      case 'inactive': return t('未激活');
      case 'error': return t('错误');
      case 'running': return t('激活');
      default: return status;
    }
  };

  // 获取状态显示样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'error': return styles.statusError;
      case 'running': return styles.statusRunning;
      default: return {};
    }
  };

  // 格式化日期显示
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return t('无');
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 渲染节点信息
  const renderNodeItem = ({ item }: { item: any }) => (
    <View style={[styles.nodeItem, isDarkMode && styles.darkNodeItem]}>
      <Text style={[styles.nodeItemText, isDarkMode && styles.darkText]}>{item.name}</Text>
      <Text style={[styles.nodeItemType, isDarkMode && styles.darkTextSecondary]}>{item.type}</Text>
    </View>
  );

  // 渲染日志项
  const renderLogItem = ({ item }: { item: any }) => (
    <View style={[styles.logItem, isDarkMode && styles.darkLogItem]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logStatus, isDarkMode && styles.darkText]}>
          {item.status === 'success' ? '✅' + t('成功') : item.status === 'error' ? '❌' + t('错误') : '⏳' + t('运行中')}
        </Text>
        <Text style={[styles.logTime, isDarkMode && styles.darkTextSecondary]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      {item.errorMessage && (
        <Text style={[styles.logError, isDarkMode && styles.darkTextSecondary]} numberOfLines={2}>
          {item.errorMessage}
        </Text>
      )}
      {item.result && (
        <Text style={[styles.logResult, isDarkMode && styles.darkTextSecondary]} numberOfLines={2}>
          {item.result}
        </Text>
      )}
    </View>
  );

  // 手动触发工作流
  const triggerWorkflow = async () => {
    if (!workflow.manualTriggerUrl) {
      Alert.alert(t('错误'), t('该工作流不支持手动触发'));
      return;
    }

    try {
      // 构建带认证的请求头
      const headers = buildAuthHeaders(auth);
      
      const response = await fetch(workflow.manualTriggerUrl, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        Alert.alert(t('成功'), t('已成功触发工作流执行'));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('触发工作流失败:', error);
      Alert.alert(t('错误'), `${t('触发工作流失败')}: ${error.message}`);
    }
  };

  // 复制URL到剪贴板
  const copyUrlToClipboard = async () => {
    if (!workflow.manualTriggerUrl) {
      Alert.alert(t('错误'), t('该工作流不支持手动触发'));
      return;
    }

    try {
      await Clipboard.setString(workflow.manualTriggerUrl);
      Alert.alert(t('成功'), t('URL已复制到剪贴板'));
    } catch (error) {
      console.error('复制URL失败:', error);
      Alert.alert(t('错误'), t('复制URL失败'));
    }
  };

  const handleRefresh = () => {
    // 在实际应用中，这里应该重新获取工作流详情
    // 记录日志而不是显示Alert
    saveErrorLog({
      id: Date.now().toString(),
      workflowId: workflow.id,
      timestamp: new Date(),
      status: 'info',
      result: 'User attempted to refresh workflow details',
    });
  };

  const handleManualTrigger = async () => {
    // 检查URL是否已设置
    if (!n8nUrl) {
      console.error('n8n server URL not configured, please configure in settings');
      // 记录错误日志
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: workflow.id,
        timestamp: new Date(),
        status: 'error',
        errorMessage: 'n8n server URL not configured, please configure in settings',
      });
      return;
    }
    
    if (!workflow.manualTriggerUrl) {
      // 记录错误日志
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: workflow.id,
        timestamp: new Date(),
        status: 'error',
        errorMessage: 'Manual trigger URL not found',
      });
      return;
    }
    
    try {
      const response = await fetch(`${n8nUrl}/webhook/workflows/data?type=trigger&workflowId=${workflow.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 记录成功日志
          saveErrorLog({
            id: Date.now().toString(),
            workflowId: workflow.id,
            timestamp: new Date(),
            status: 'success',
            result: 'Workflow triggered',
          });
        } else {
          throw new Error(result.error || 'Trigger failed');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Network error when triggering workflow:', error);
      // 记录错误日志
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: workflow.id,
        timestamp: new Date(),
        status: 'error',
        errorMessage: 'Network error when triggering workflow: ' + (error as Error).message,
      });
    }
  };

  if (loadingSettings) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* 使用FlatList替代ScrollView，设置ListHeaderComponent来显示页面头部内容 */}
      <FlatList
        data={activeTab === 'nodes' ? (workflow.nodes || []) : (workflow.executionLogs || [])}
        renderItem={activeTab === 'nodes' ? renderNodeItem : renderLogItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* 基本信息 */}
            <View style={[styles.section, isDarkMode && styles.darkSection]}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('基本信息')}</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t('名称')}:</Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{workflow.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t('描述')}:</Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{workflow.description || t('无')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t('状态')}:</Text>
                <Text style={[styles.status, getStatusStyle(workflow.status), isDarkMode && styles.darkText]}>
                  {getStatusText(workflow.status)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t('创建时间')}:</Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{formatDate(workflow.createdAt.toString())}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t('更新时间')}:</Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{formatDate(workflow.updatedAt.toString())}</Text>
              </View>
            </View>

            {/* 执行统计 */}
            <View style={[styles.section, isDarkMode && styles.darkSection]}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('执行统计')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{workflow.executionCount}</Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.darkTextSecondary]}>{t('执行次数')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{(workflow.successRate * 100).toFixed(1)}%</Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.darkTextSecondary]}>{t('成功率')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
                    {workflow.lastExecution ? formatDate(workflow.lastExecution.toString()) : t('无')}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.darkTextSecondary]}>{t('最近执行')}</Text>
                </View>
              </View>
            </View>

            {/* 节点信息 */}
            <View style={[styles.section, isDarkMode && styles.darkSection]}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('节点信息')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{Array.isArray(workflow.nodes) ? workflow.nodes.length : 0}</Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.darkTextSecondary]}>{t('节点数')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{workflow.connections?.length || 0}</Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.darkTextSecondary]}>{t('连接数')}</Text>
                </View>
              </View>
              
              {/* 手动触发按钮 */}
              {workflow.manualTriggerUrl ? (
                <View style={[styles.manualTriggerSection, isDarkMode && styles.darkManualTriggerSection]}>
                  <View style={styles.manualTriggerButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.triggerButton]}
                      onPress={triggerWorkflow}
                    >
                      <Text style={styles.actionButtonText}>{t('触发执行')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.copyButton]}
                      onPress={copyUrlToClipboard}
                    >
                      <Text style={styles.actionButtonText}>{t('复制URL')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.manualTriggerSection, isDarkMode && styles.darkManualTriggerSection]}>
                  <View style={[styles.disabledButtonContainer, isDarkMode && styles.darkDisabledButtonContainer]}>
                    <Text style={[styles.disabledButtonText, isDarkMode && styles.darkDisabledButtonText]}>{t('手动触发')}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 标签导航 */}
            <View style={[styles.tabs, isDarkMode && styles.darkTabs]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'nodes' && styles.activeTab, isDarkMode && styles.darkTab, activeTab === 'nodes' && isDarkMode && styles.darkActiveTab]}
                onPress={() => setActiveTab('nodes')}
              >
                <Text style={[styles.tabText, activeTab === 'nodes' && styles.activeTabText, isDarkMode && styles.darkText, activeTab === 'nodes' && isDarkMode && styles.darkActiveTabText]}>
                  {t('节点信息')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'logs' && styles.activeTab, isDarkMode && styles.darkTab, activeTab === 'logs' && isDarkMode && styles.darkActiveTab]}
                onPress={() => setActiveTab('logs')}
              >
                <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText, isDarkMode && styles.darkText, activeTab === 'logs' && isDarkMode && styles.darkActiveTabText]}>
                  {t('执行日志')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 标签内容标题 */}
            <View style={[styles.tabContentHeader, isDarkMode && styles.darkTabContent]}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                {activeTab === 'nodes' ? t('节点列表') : t('执行日志列表')}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
              {activeTab === 'nodes' ? t('暂无节点信息') : t('暂无执行日志')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.contentContainer}
      />
    </View>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  darkHeader: {
    backgroundColor: '#1E1E1E',
  },
  workflowName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkTextSecondary: {
    color: '#D1D5DB',
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    borderColor: '#9CA3AF',
    borderWidth: 1,
  },
  statusError: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  statusRunning: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  darkSection: {
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  manualTriggerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  darkManualTriggerSection: {
    borderTopColor: '#374151',
  },
  manualTriggerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  triggerButton: {
    backgroundColor: '#3B82F6',
  },
  copyButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButtonContainer: {
    backgroundColor: '#9CA3AF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
    opacity: 0.8,
  },
  darkDisabledButtonContainer: {
    backgroundColor: '#4B5563',
  },
  disabledButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  darkDisabledButtonText: {
    color: '#D1D5DB',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  darkTabs: {
    backgroundColor: '#1E1E1E',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  darkTab: {
  },
  darkActiveTab: {
    borderBottomColor: '#60A5FA',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  darkActiveTabText: {
    color: '#60A5FA',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  darkTabContent: {
  },
  list: {
    flex: 1,
  },
  nodeItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  darkNodeItem: {
    backgroundColor: '#2D2D2D',
    borderLeftColor: '#60A5FA',
  },
  nodeItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  nodeItemType: {
    fontSize: 14,
    color: '#6B7280',
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  darkLogItem: {
    backgroundColor: '#2D2D2D',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  logError: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  logResult: {
    fontSize: 14,
    color: '#059669',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 30,
  },
  // 新增样式
  tabContentHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WorkflowDetailScreen;