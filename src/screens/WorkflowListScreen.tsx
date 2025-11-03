import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkflowList from '../components/WorkflowList';
import { Workflow, WorkflowDetail, WorkflowStatus } from '../types/workflow';
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
          const credentials = `${auth.basic.username}:${auth.basic.password}`;
          const encodedCredentials = btoa(credentials);
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

interface WorkflowListScreenProps {
  navigation: any;
}

const WorkflowListScreen: React.FC<WorkflowListScreenProps> = ({
  navigation,
}) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useLanguage();
  const [n8nUrl, setN8nUrl] = useState(''); // 移除默认URL
  const [auth, setAuth] = useState<any>(null); // 添加认证状态
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    running: 0,
  });
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortedWorkflows, setSortedWorkflows] = useState<Workflow[]>([]);

  // 加载设置
  useEffect(() => {
    loadSettings();
    
    // 监听URL更改事件
    const handleUrlChange = () => {
      loadSettings().then((settings) => {
        // 确保在设置加载完成后重新加载工作流数据
        if (settings.url) {
          setN8nUrl(settings.url);
          setAuth(settings.auth);
          loadWorkflows();
        }
      });
    };
    
    // 监听认证信息更改事件
    const handleAuthChange = () => {
      loadSettings().then((settings) => {
        // 确保在设置加载完成后重新加载工作流数据
        if (settings.url) {
          setN8nUrl(settings.url);
          setAuth(settings.auth);
          loadWorkflows();
        }
      });
    };
    
    let deviceEventSubscription: any;
    let authDeviceEventSubscription: any;
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('n8nUrlChanged', handleUrlChange);
      window.addEventListener('n8nAuthChanged', handleAuthChange);
    } else if (Platform.OS !== 'web') {
      // 在React Native环境中监听DeviceEventEmitter事件
      try {
        const { DeviceEventEmitter } = require('react-native');
        deviceEventSubscription = DeviceEventEmitter.addListener('n8nUrlChanged', handleUrlChange);
        authDeviceEventSubscription = DeviceEventEmitter.addListener('n8nAuthChanged', handleAuthChange);
      } catch (e) {
        console.warn('Unable to add DeviceEventEmitter listener:', e);
      }
    }
    
    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('n8nUrlChanged', handleUrlChange);
        window.removeEventListener('n8nAuthChanged', handleAuthChange);
      } else if (deviceEventSubscription) {
        deviceEventSubscription.remove();
        if (authDeviceEventSubscription) {
          authDeviceEventSubscription.remove();
        }
      }
    };
  }, []);

  // 当n8nUrl改变时重新加载工作流数据
  useEffect(() => {
    // 只有当n8nUrl有实际值（非空字符串）时才尝试加载
    if (n8nUrl && n8nUrl.trim() !== '') {
      loadWorkflows();
    }
  }, [n8nUrl, auth]);

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
          return { url: parsedSettings.n8nUrl || '', auth: parsedSettings.auth || null }; // 返回URL和认证信息
        } else {
          // If no saved settings are found, don't show error immediately
          // Only log to console
          console.log('No saved settings found');
          setN8nUrl('');
          setAuth(null);
          return { url: '', auth: null };
        }
      } else {
        // 在原生环境中，使用 AsyncStorage
        try {
          const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            setN8nUrl(parsedSettings.n8nUrl || '');
            setAuth(parsedSettings.auth || null);
            return { url: parsedSettings.n8nUrl || '', auth: parsedSettings.auth || null }; // 返回URL和认证信息
          } else {
            // If no saved settings are found, don't show error immediately
            // Only log to console
            console.log('No saved settings found');
            setN8nUrl(''); // 确保设置为空
            setAuth(null);
            return { url: '', auth: null }; // 返回空URL和认证信息
          }
        } catch (e) {
          console.error('Failed to load settings in native environment:', e);
          setN8nUrl('');
          setAuth(null);
          return { url: '', auth: null }; // 返回空URL和认证信息
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // 出错时使用空URL
      setN8nUrl('');
      setAuth(null);
      return { url: '', auth: null }; // 返回空URL和认证信息
    }
  };

  // 从API获取流程数据
  const fetchWorkflows = async (includeDisabled: boolean = true) => {
    try {
      // Check if URL is configured
      if (!n8nUrl) {
        throw new Error('n8n server URL not configured, please configure in settings');
      }
      
      // 验证URL格式是否有效
      try {
        new URL(n8nUrl);
      } catch (e) {
        throw new Error('Invalid URL format');
      }
      
      // 设置请求超时时间，防止网络请求无限等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      // 构建请求头
      const headers = buildAuthHeaders(auth);
      
      const response = await fetch(`${n8nUrl}/webhook/workflows/data?type=workflows&includeDisabled=${includeDisabled}`, {
        signal: controller.signal,
        headers: headers
      });
      
      clearTimeout(timeoutId); // 清除超时定时器
      
      // 检查HTTP响应状态
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // 如果无法解析错误响应，则使用默认消息
        }
        
        // 特别处理认证错误
        if (response.status === 401) {
          throw new Error('Authentication failed, please check authentication settings');
        } else if (response.status === 403) {
          throw new Error('Access forbidden, please check permissions');
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // 处理返回的数据
      if (result && result.success && Array.isArray(result.data)) {
        return result.data.map((workflow: any) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          status: workflow.active ? 'active' : 'inactive',
          lastExecution: workflow.lastExecution ? new Date(workflow.lastExecution) : undefined,
          executionCount: workflow.executionCount || 0,
          successRate: workflow.successRate || 0,
          tags: workflow.tags || [],
          createdAt: new Date(workflow.createdAt),
          updatedAt: new Date(workflow.updatedAt),
          manualTrigger: workflow.manualTrigger,
          manualTriggerUrl: workflow.manualTriggerUrl,
          includeManualNodes: workflow.includeManualNodes,
          manualTriggerNodes: workflow.manualTriggerNodes,
        })) as Workflow[];
      } else {
        throw new Error('Returned data format is incorrect');
      }
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      
      // 保存错误日志
      await saveErrorLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        error: error,
        message: `获取工作流失败: ${error.message}`,
        url: `${n8nUrl}/webhook/workflows/data?type=workflows&includeDisabled=${includeDisabled}`
      });
      
      // 如果是认证错误，显示特定的错误消息
      if (error.message && (error.message.includes('401') || error.message.includes('Authentication'))) {
        throw new Error('Authentication failed, please check authentication settings');
      }
      
      throw error;
    }
  };

  // 获取流程详情数据
  const fetchWorkflowDetail = async (workflowId: string): Promise<WorkflowDetail> => {
    try {
      // Check if URL is configured
      if (!n8nUrl) {
        throw new Error('n8n server URL not configured, please configure in settings');
      }
      
      // 验证URL格式是否有效
      try {
        new URL(n8nUrl);
      } catch (e) {
        throw new Error('Invalid URL format');
      }
      
      // 设置请求超时时间，防止网络请求无限等待
      const workflowController = new AbortController();
      const workflowTimeoutId = setTimeout(() => workflowController.abort(), 10000); // 10秒超时
      
      // 获取流程详细信息
      // 构建带认证的请求头
      const headers = buildAuthHeaders(auth);
      
      const workflowResponse = await fetch(`${n8nUrl}/webhook/workflows/data?type=workflows&includeDisabled=true&workflowId=${workflowId}`, {
        signal: workflowController.signal,
        headers: headers
      });
      
      clearTimeout(workflowTimeoutId); // 清除超时定时器
      
      // 检查HTTP响应状态
      if (!workflowResponse.ok) {
        throw new Error(`HTTP error! status: ${workflowResponse.status}`);
      }
      
      const workflowResult = await workflowResponse.json();
      
      // 验证响应数据结构是否正确
      if (!workflowResult || typeof workflowResult.success !== 'boolean') {
        throw new Error('Invalid API response format');
      }
      
      if (workflowResult.success && workflowResult.data && workflowResult.data[0]) {
        const workflowData = workflowResult.data[0];

        // 为执行日志请求设置超时
        const executionsController = new AbortController();
        const executionsTimeoutId = setTimeout(() => executionsController.abort(), 10000); // 10秒超时
        
        // 获取执行日志
        const executionsResponse = await fetch(`${n8nUrl}/webhook/workflows/data?type=executions&workflowId=${workflowId}&limit=10`, {
          signal: executionsController.signal,
          headers: headers
        });
        
        clearTimeout(executionsTimeoutId); // 清除超时定时器
        
        // 检查HTTP响应状态
        if (!executionsResponse.ok) {
          throw new Error(`HTTP错误! 状态: ${executionsResponse.status}`);
        }
        
        const executionsResult = await executionsResponse.json();
        
        // 验证响应数据结构是否正确
        if (!executionsResult || typeof executionsResult.success !== 'boolean') {
          throw new Error('Invalid execution logs response format');
        }
        
        let executionsData: any[] = [];
        if (executionsResult.success) {
          executionsData = executionsResult.data;
        }

        // 构造WorkflowDetail对象
        return {
          id: workflowData.id,
          name: workflowData.name,
          description: workflowData.description || '',
          status: workflowData.active ? 'active' : 'inactive',
          lastExecution: workflowData.lastExecution ? new Date(workflowData.lastExecution) : undefined,
          executionCount: workflowData.executionCount || 0,
          successRate: workflowData.successRate || 0,
          tags: workflowData.tags || [],
          createdAt: new Date(workflowData.createdAt),
          updatedAt: new Date(workflowData.updatedAt),
          // 直接使用API返回的includeManualNodes参数
          manualTrigger: workflowData.includeManualNodes || false,
          // 如果有手动触发URL则保存
          manualTriggerUrl: workflowData.manualTriggerUrl || null,
          // 触发节点信息
          includeManualNodes: workflowData.includeManualNodes || false,
          manualTriggerNodes: workflowData.manualTriggerNodes || [],
          nodes: workflowData.nodes || workflowData.nodeData || [],
          connections: workflowData.connections || workflowData.connectionData || {},
          executionLogs: executionsData.map((exec: any) => ({
            id: exec.id,
            workflowId: exec.workflowId,
            timestamp: new Date(exec.startedAt),
            status: exec.status,
            duration: exec.stoppedAt ? new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime() : undefined,
            result: exec.result || '',
            errorMessage: exec.errorMessage || undefined,
          })),
        }
      } else {
        throw new Error(workflowResult.error || 'Workflow data not found');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Handle timeout case with more detailed error message
        console.error('Request timeout:', error);
        throw new Error('Request timeout, please check network connection or if server address is correct');
      }
      console.error('Error fetching workflow details:', error);
      throw error;
    }
  }

  // 设置流程状态（启用/禁用）
  const setWorkflowStatus = async (workflowId: string, active: boolean) => {
    try {
      // 检查URL是否已设置
      if (!n8nUrl) {
        throw new Error('n8n server URL not configured, please configure in settings');
      }
      
      // 构建带认证的请求头
      const headers = buildAuthHeaders(auth);
      
      const response = await fetch(`${n8nUrl}/webhook/workflows/set`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          workflowId: workflowId,  // 使用workflowId而不是id
          operationType: 'setStatus',
          status: active,  // 使用status而不是active
        }),
      });
      
      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || 'Failed to update workflow status');
      }
    } catch (error) {
      console.error('Error updating workflow status:', error);
      throw error;
    }
  }

  // 加载流程数据
  const loadWorkflows = async () => {
    // 首先确保有n8nUrl
    if (!n8nUrl || n8nUrl.trim() === '') {
      setIsLoading(false);
      setRefreshing(false);
      setWorkflows([]);
      calculateStats([]);
      return;
    }
    
    if (!refreshing) {
      setIsLoading(true);
    }
    setRefreshing(true);
    
    try {
      // 尝试获取数据
      const workflowsData = await fetchWorkflows();
      
      // 只有成功获取到数据时才更新状态
      if (workflowsData && workflowsData.length >= 0) {
        setWorkflows(workflowsData);
        calculateStats(workflowsData);
      }
    } catch (error) {
      console.error('API call failed:', error);
      
      // 保存错误日志到本地存储
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: 'N/A',
        timestamp: new Date(),
        status: 'error',
        errorMessage: 'Failed to fetch workflow data: ' + (error as Error).message,
        error: error
      });
      
      // 清空数据以显示错误状态
      setWorkflows([]);
      calculateStats([]);
      
      // 显示错误提示给用户
      Alert.alert(
        t('连接失败'),
        t('无法连接到N8N服务器，请检查：') + '\n\n' +
        t('1. 服务器地址是否正确') + '\n' +
        t('2. 网络连接是否正常') + '\n' +
        t('3. 认证信息是否正确') + '\n\n' +
        t('错误信息') + '：' + (error as Error).message,
        [{ text: t('确定') }]
      );
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  // 计算统计信息
  const calculateStats = (workflows: Workflow[]) => {
    const stats = {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'active').length,
      inactive: workflows.filter(w => w.status === 'inactive').length,
      error: workflows.filter(w => w.status === 'error').length,
      running: workflows.filter(w => w.status === 'running').length,
    };
    setStats(stats);
  };

  // 对工作流进行排序
  const sortWorkflows = (workflows: Workflow[]) => {
    const sorted = [...workflows].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'status':
          // 按状态排序: active > running > error > inactive
          const statusPriority: Record<WorkflowStatus, number> = {
            'active': 4,
            'running': 3,
            'error': 2,
            'inactive': 1
          };
          comparison = statusPriority[a.status] - statusPriority[b.status];
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  // 切换流程状态
  const handleToggleStatus = async (workflowId: string, newStatus: boolean) => {
    try {
      // 更新本地状态以显示加载指示器
      const updatedWorkflows = workflows.map(workflow => {
        if (workflow.id === workflowId) {
          return {
            ...workflow,
            isStatusChanging: true,
          };
        }
        return workflow;
      });
      
      setWorkflows(updatedWorkflows);
      setSortedWorkflows(sortWorkflows(updatedWorkflows));
      
      // 调用API更新流程状态
      await setWorkflowStatus(workflowId, newStatus);
      
      const finalWorkflows = updatedWorkflows.map(workflow => {
        if (workflow.id === workflowId) {
          return {
            ...workflow,
            status: newStatus ? ('active' as WorkflowStatus) : ('inactive' as WorkflowStatus),
            updatedAt: new Date(),
            isStatusChanging: false, // 关闭加载指示器
          };
        }
        return workflow;
      });
      
      setWorkflows(finalWorkflows);
      setSortedWorkflows(sortWorkflows(finalWorkflows));
      calculateStats(finalWorkflows);
      
      // Save success log
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: workflowId,
        timestamp: new Date(),
        status: 'success',
        result: `Workflow status has been ${newStatus ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      // 出错时也要关闭加载指示器
      const finalWorkflows = workflows.map(workflow => {
        if (workflow.id === workflowId) {
          return {
            ...workflow,
            isStatusChanging: false,
          };
        }
        return workflow;
      });
      
      setWorkflows(finalWorkflows);
      setSortedWorkflows(sortWorkflows(finalWorkflows));
      
      // Record error log
      console.error('Failed to update status:', error);
      saveErrorLog({
        id: Date.now().toString(),
        workflowId: workflowId,
        timestamp: new Date(),
        status: 'error',
        errorMessage: t('Failed to update status') + ': ' + (error as Error).message,
        error: error
      });
    }
  };

  // 处理流程点击事件
  const handleWorkflowPress = async (workflow: Workflow) => {
    try {
      const workflowDetail = await fetchWorkflowDetail(workflow.id);
      // 序列化Date对象为字符串以避免导航警告
      const serializableWorkflow = {
        ...workflowDetail,
        createdAt: workflowDetail.createdAt instanceof Date ? workflowDetail.createdAt.toISOString() : workflowDetail.createdAt,
        updatedAt: workflowDetail.updatedAt instanceof Date ? workflowDetail.updatedAt.toISOString() : workflowDetail.updatedAt,
        lastExecution: workflowDetail.lastExecution instanceof Date ? workflowDetail.lastExecution.toISOString() : workflowDetail.lastExecution,
        executionLogs: workflowDetail.executionLogs?.map(log => ({
          ...log,
          timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
        }))
      };
      navigation.navigate('WorkflowDetail', { workflow: serializableWorkflow });
    } catch (error) {
      Alert.alert(t('错误'), t('获取流程详情失败') + ': ' + (error as Error).message);
    }
  }

  // 应用排序已移至排序选项点击事件中
  /*
  const applySorting = () => {
    const sorted = sortWorkflows(workflows);
    setSortedWorkflows(sorted);
    setSortModalVisible(false);
  };
  */

  // 简单的排序选项选择器（替代Picker）
  const SortOptionSelector = () => (
    <View style={styles.sortOptionsContainer}>
        <Text style={[styles.sortOptionsTitle, isDarkMode && styles.darkText]}>{t('排序字段')}</Text>
      <View style={styles.sortOptionsRow}>
        <TouchableOpacity 
          style={[styles.sortOption, sortBy === 'name' && styles.sortOptionSelected, isDarkMode && styles.darkSortOption]}
          onPress={() => {
            setSortBy('name');
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextSelected, isDarkMode && styles.darkText]}>
          {t('名称')}
        </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortOption, sortBy === 'updatedAt' && styles.sortOptionSelected, isDarkMode && styles.darkSortOption]}
          onPress={() => {
            setSortBy('updatedAt');
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'updatedAt' && styles.sortOptionTextSelected, isDarkMode && styles.darkText]}>
          {t('修改时间')}
        </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortOption, sortBy === 'status' && styles.sortOptionSelected, isDarkMode && styles.darkSortOption]}
          onPress={() => {
            setSortBy('status');
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'status' && styles.sortOptionTextSelected, isDarkMode && styles.darkText]}>
            {t('状态')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.sortOptionsTitle, isDarkMode && styles.darkText]}>{t('排序方式')}</Text>
      <View style={styles.sortOptionsRow}>
        <TouchableOpacity 
          style={[styles.sortOption, sortOrder === 'asc' && styles.sortOptionSelected, isDarkMode && styles.darkSortOption]}
          onPress={() => {
            setSortOrder('asc');
          }}
        >
          <Text style={[styles.sortOptionText, sortOrder === 'asc' && styles.sortOptionTextSelected, isDarkMode && styles.darkText]}>
            {t('升序')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortOption, sortOrder === 'desc' && styles.sortOptionSelected, isDarkMode && styles.darkSortOption]}
          onPress={() => {
            setSortOrder('desc');
          }}
        >
          <Text style={[styles.sortOptionText, sortOrder === 'desc' && styles.sortOptionTextSelected, isDarkMode && styles.darkText]}>
            {t('降序')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    loadWorkflows();
  }, [n8nUrl]);

  useEffect(() => {
    if (workflows.length > 0) {
      const sorted = sortWorkflows(workflows);
      setSortedWorkflows(sorted);
    }
  }, [workflows, sortBy, sortOrder]);

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* 移除外部ScrollView，避免与WorkflowList中的FlatList嵌套 */}
      <View style={styles.contentContainer}>
        {/* 统计信息头部 */}
        <View style={[styles.statsHeader, isDarkMode && styles.darkStatsHeader]}>
          <Text style={[styles.statsTitle, isDarkMode && styles.darkText]}>{t('流程监控')}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, isDarkMode && styles.darkStatItem]}>
              <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.total}</Text>
              <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>{t('总数')}</Text>
            </View>
            <View style={[styles.statItem, styles.statActive, isDarkMode && styles.darkStatActive]}>
              <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.active}</Text>
              <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>{t('激活')}</Text>
            </View>
            <View style={[styles.statItem, styles.statInactive, isDarkMode && styles.darkStatInactive]}>
              <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.inactive}</Text>
              <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>{t('未激活')}</Text>
            </View>
            <View style={[styles.statItem, styles.statError, isDarkMode && styles.darkStatError]}>
              <Text style={[styles.statValue, isDarkMode && styles.darkText]}>{stats.error}</Text>
              <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>{t('错误')}</Text>
            </View>
          </View>
        </View>

        {/* 流程列表 */}
        <View style={[styles.listContainer, isDarkMode && styles.darkListContainer]}>
          <View style={styles.listHeader}>
            <View>
              <Text style={[styles.listTitle, isDarkMode && styles.darkText]}>{t('自动化流程')}</Text>
              <Text style={[styles.listSubtitle, isDarkMode && styles.darkText]}>{t('点击查看详情和执行日志')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setSortModalVisible(true)}
            >
              <Text style={styles.sortButtonText}>{t('排序')}</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
                {n8nUrl ? t('正在加载工作流...') : t('请在设置中配置n8n服务器URL')}
              </Text>
            </View>
          ) : !n8nUrl ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
                {t('请在设置中配置n8n服务器URL')}
              </Text>
              <TouchableOpacity 
                style={styles.configButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.configButtonText}>{t('前往设置')}</Text>
              </TouchableOpacity>
            </View>
          ) : workflows.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
                {t('暂无工作流数据')}
              </Text>
              <TouchableOpacity 
                style={styles.configButton}
                onPress={async () => {
                  setIsLoading(true);
                  try {
                    // 重新加载设置以确保使用最新的URL
                    await loadSettings();
                    if (n8nUrl) {
                      await loadWorkflows();
                    }
                  } catch (error) {
                    console.error('刷新时出错:', error);
                    Alert.alert('错误', '刷新失败: ' + (error as Error).message);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <Text style={styles.configButtonText}>{t('刷新')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WorkflowList
              workflows={sortedWorkflows}
              onWorkflowPress={handleWorkflowPress}
              onToggleStatus={handleToggleStatus}
              isDarkMode={isDarkMode}
              refreshing={refreshing}
              onRefresh={loadWorkflows}
              // 手动触发功能暂时未实现
            />
          )}
        </View>
      </View>

      {/* 排序模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          onPress={() => setSortModalVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]} onTouchEnd={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{t('排序选项')}</Text>
            
            <SortOptionSelector />
            
            {/* 移除取消和应用按钮，因为现在点击选项后会立即生效 */}
          </View>
        </TouchableOpacity>
      </Modal>
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
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  statsHeader: {
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
  darkStatsHeader: {
    backgroundColor: '#1E1E1E',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  darkText: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  darkStatItem: {
    backgroundColor: '#2D2D2D',
  },
  statActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  darkStatActive: {
    backgroundColor: '#053225',
    borderColor: '#10B981',
  },
  statInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    borderWidth: 1,
  },
  darkStatInactive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#9CA3AF',
  },
  statError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  darkStatError: {
    backgroundColor: '#3B0505',
    borderColor: '#EF4444',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  darkListContainer: {
    backgroundColor: '#121212',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  configButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  configButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  darkModalContent: {
    backgroundColor: '#1E1E1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOptionsContainer: {
    marginBottom: 20,
  },
  sortOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sortOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  darkSortOption: {
    backgroundColor: '#2D2D2D',
  },
  sortOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  sortOptionText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default WorkflowListScreen;