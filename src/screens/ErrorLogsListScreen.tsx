import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ExecutionLog } from '../types/workflow';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const SETTINGS_KEY = 'appSettings';
const ERROR_LOGS_KEY = 'errorLogs';

type ErrorLogsListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

interface ErrorLogsListScreenProps {
  navigation: ErrorLogsListScreenNavigationProp;
}

const ErrorLogsListScreen: React.FC<ErrorLogsListScreenProps> = ({ navigation }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const [errorLogs, setErrorLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maxErrorLogs, setMaxErrorLogs] = useState(100);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const saveErrorLog = async (errorLog: any) => {
    try {
      const maxLogs = maxErrorLogs;
      
      // 获取现有的错误日志
      let existingLogs = [];
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
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
      const updatedLogs = [logWithStack, ...existingLogs].slice(0, maxLogs);
      
      // 保存更新后的日志
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
      } else {
        await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
      }
    } catch (error) {
      console.error('Error saving error log:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    loadErrorLogs();
  }, []);

  const loadSettings = async () => {
    try {
      let settingsString = '';
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        settingsString = localStorage.getItem(SETTINGS_KEY) || '';
      } else {
        settingsString = await AsyncStorage.getItem(SETTINGS_KEY) || '';
      }

      if (settingsString) {
        const settings = JSON.parse(settingsString);
        if (settings.maxErrorLogs !== undefined) {
          setMaxErrorLogs(settings.maxErrorLogs);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadErrorLogs = async () => {
    if (!loading) {
      setRefreshing(true);
    }

    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        // 为Web平台添加更健壮的处理
        const rawData = localStorage.getItem(ERROR_LOGS_KEY);
        console.log('加载日志数据:', rawData);
        
        if (rawData) {
          try {
            const parsedData = JSON.parse(rawData);
            // 确保返回的是数组
            if (Array.isArray(parsedData)) {
              setErrorLogs(parsedData);
            } else {
              console.error('日志数据格式错误，期望数组但得到:', typeof parsedData);
              setErrorLogs([]);
            }
          } catch (parseError) {
            console.error('解析日志失败:', parseError);
            setErrorLogs([]);
          }
        } else {
          setErrorLogs([]);
        }
      } else {
        const logsString = await AsyncStorage.getItem(ERROR_LOGS_KEY) || '';
        if (logsString) {
          const logs = JSON.parse(logsString);
          setErrorLogs(logs);
        } else {
          setErrorLogs([]);
        }
      }
    } catch (error) {
      console.error('Error loading error logs:', error);
      setErrorLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearErrorLogs = async () => {
    Alert.alert(
      t('确认清除'),
      t('确定要清除所有错误日志吗？'),
      [
        {
          text: t('取消'),
          style: 'cancel'
        },
        {
          text: t('确定'),
          onPress: async () => {
            try {
              // 为web平台提供更可靠的localStorage支持
              if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
                // 先移除再设置，确保完全清除
                window.localStorage.removeItem(ERROR_LOGS_KEY);
                // 强制刷新localStorage缓存
                window.localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify([]));
                
                // 立即验证存储状态
                const verifyLogs = window.localStorage.getItem(ERROR_LOGS_KEY);
                console.log('清除后验证:', verifyLogs);
                
                // 立即清空展开状态
                setExpandedLogs({});
              } else {
                await AsyncStorage.removeItem(ERROR_LOGS_KEY);
              }
              
              // 同步更新UI状态
              setErrorLogs([]);
              
              // 强制重新加载以确保UI完全更新
              setTimeout(() => {
                // 双重确认，确保状态更新
                setErrorLogs([]);
                loadErrorLogs();
              }, 100);
              
              Alert.alert(t('成功'), t('错误日志已清除'));
              
              // 记录操作日志
              saveErrorLog({
                id: Date.now().toString(),
                workflowId: '',
                timestamp: new Date(),
                status: 'success',
                result: 'Error logs cleared',
              });
            } catch (error) {
              console.error('Error clearing error logs:', error);
              Alert.alert(t('错误'), t('清除错误日志失败'));
              
              // 记录错误日志
              saveErrorLog({
                id: Date.now().toString(),
                workflowId: '',
                timestamp: new Date(),
                status: 'error',
                errorMessage: 'Failed to clear error logs: ' + (error as Error).message,
                error: error
              });
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderErrorLog = ({ item }: { item: ExecutionLog }) => {
    const isExpanded = expandedLogs[item.id] || false;
    
    return (
      <View style={[styles.logItem, isDarkMode && styles.darkLogItem]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logStatus, isDarkMode && styles.darkText]}>
            {item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : '⏳'}
            {item.status === 'success' ? t('成功') : item.status === 'error' ? t('错误') : t('运行中')}
          </Text>
          <Text style={[styles.logTime, isDarkMode && styles.darkTextSecondary]}>
            {formatDate(item.timestamp.toString())}
          </Text>
        </View>
        
        {item.errorMessage && (
          <>
            <Text style={[styles.logErrorTitle, isDarkMode && styles.darkText]}>{t('错误信息')}:</Text>
            <Text style={[styles.logError, isDarkMode && styles.darkTextSecondary]} numberOfLines={isExpanded ? undefined : 3}>
              {item.errorMessage}
            </Text>
          </>
        )}
        
        {item.stack && isExpanded && (
          <>
            <Text style={[styles.logStackTitle, isDarkMode && styles.darkText]}>{t('调用堆栈')}:</Text>
            <Text style={[styles.logStack, isDarkMode && styles.darkTextSecondary]}>
              {item.stack}
            </Text>
          </>
        )}
        
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleLogExpansion(item.id)}
        >
          <Text style={[styles.expandButtonText, isDarkMode && styles.darkText]}>
            {isExpanded ? t('收起') : t('展开')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, isDarkMode && styles.darkText]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>{t('错误日志')}</Text>
        <View style={styles.clearButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.clearButton, 
              isDarkMode && styles.darkClearButton,
              errorLogs.length === 0 && styles.disabledClearButton,
              errorLogs.length === 0 && isDarkMode && styles.darkDisabledClearButton
            ]}
            onPress={clearErrorLogs}
            disabled={errorLogs.length === 0}
          >
            <Text style={[
              styles.clearButtonText, 
              isDarkMode && styles.darkText,
              errorLogs.length === 0 && styles.disabledClearButtonText,
              errorLogs.length === 0 && isDarkMode && styles.darkDisabledClearButtonText
            ]}>{t('清空日志')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>{t('加载中...')}</Text>
        </View>
      ) : errorLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>{t('没有错误日志')}</Text>
        </View>
      ) : (
        <FlatList
          data={errorLogs}
          renderItem={renderErrorLog}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadErrorLogs} />
          }
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#1F2937',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  clearButtonContainer: {
    paddingLeft: 12,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkTextSecondary: {
    color: '#D1D5DB',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  darkClearButton: {
    backgroundColor: '#7F1D1D',
  },
  disabledClearButton: {
    backgroundColor: '#E5E7EB',
  },
  darkDisabledClearButton: {
    backgroundColor: '#374151',
  },
  disabledClearButtonText: {
    color: '#9CA3AF',
  },
  darkDisabledClearButtonText: {
    color: '#6B7280',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
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
  darkLogItem: {
    backgroundColor: '#1E1E1E',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  logErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  logError: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 12,
    lineHeight: 20,
  },
  logStackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  logStack: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  expandButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  darkExpandButton: {
    backgroundColor: '#374151',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});

export default ErrorLogsListScreen;