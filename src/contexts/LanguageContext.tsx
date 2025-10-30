import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';

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

const LANGUAGE_KEY = 'appLanguage';

// 定义翻译文本类型
type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};

// 翻译文本
const translations: Translations = {
  en: {
    // 通用
    '确定': 'OK',
    '取消': 'Cancel',
    '确认': 'Confirm',
    '编辑': 'Edit',
    '查看': 'View',
    '选择': 'Select',
    
    // 导航标签
    '工作流': 'Workflows',
    '设置': 'Settings',
    
    // 设置页面
    '连接设置': 'Connection Settings',
    'n8n服务器URL': 'n8n Server URL',
    '用户界面': 'User Interface',
    '深色模式': 'Dark Mode',
    '语言': 'Language',
    '安全设置': 'Security Settings',
    '系统设置': 'System Settings',
    '生物识别认证': 'Biometric Authentication',
    '应用锁': 'App Lock',
    '自动登出时间': 'Auto Logout Time',
    '最大错误日志数': 'Max Error Logs',
    '查看错误日志': 'View Error Logs',
    '分钟': 'minutes',
    '条': 'items',
    '关于': 'About',    
    // 认证相关
    '认证设置': 'Authentication',
    '认证类型': 'Auth Type',
    '无认证': 'No Authentication',
    'Basic认证': 'Basic Auth',
    'Header认证': 'Header Auth',
    'JWT认证': 'JWT Auth',
    '用户名': 'Username',
    '密码': 'Password',
    'Header键': 'Header Key',
    'Header值': 'Header Value',
    'JWT Token': 'JWT Token',
    
    // 工作流列表页面
    '全部': 'All',
    '激活': 'Active',
    '未激活': 'Inactive',
    '错误': 'Error',
    '运行中': 'Running',
    '进行中': 'Running',
    '已暂停': 'Paused',
    '执行中': 'Executing',
    '刷新': 'Refresh',
    '排序': 'Sort',
    '按名称': 'By Name',
    '按更新时间': 'By Update Time',
    '按状态': 'By Status',
    '升序': 'Ascending',
    '降序': 'Descending',
    '排序字段': 'Sort Field',
    '修改时间': 'Last Modified',
    '搜索工作流': 'Search Workflows',
    '没有找到匹配的工作流': 'No matching workflows found',
    '没有工作流': 'No workflows',
    '请检查n8n服务器URL设置': 'Please check the n8n server URL settings',
    '名称': 'Name',
    '状态': 'Status',
    '子工作流': 'Child Workflow',
    
    // 工作流详情页面
    '工作流详情': 'Workflow Details',
    '基本信息': 'Basic Information',
    '描述': 'Description',
    '创建时间': 'Created At',
    '更新时间': 'Updated At',
    '执行统计': 'Execution Statistics',

    '最近执行': 'Last Execution',
    '节点信息': 'Node Information',
    '节点数': 'Node Count',
    '连接数': 'Connection Count',
    '手动触发': 'Manual Trigger',
    '执行日志': 'Execution Logs',
    '触发执行': 'Trigger Execution',
    '复制URL': 'Copy URL',
    '启用': 'Enable',
    '禁用': 'Disable',
    
    // 错误日志页面
    '错误日志': 'Error Logs',
    '清空日志': 'Clear Logs',
    '没有错误日志': 'No error logs',
    '错误信息': 'Error Message',
    '时间': 'Time',
    '调用堆栈': 'Stack Trace',
    
    // 模态框标题
    '编辑n8n服务器URL': 'Edit n8n Server URL',
    '编辑自动登出时间': 'Edit Auto Logout Time',
    '编辑最大错误日志数': 'Edit Max Error Logs',
    '选择语言': 'Select Language',
    '排序选项': 'Sort Options',
    
    // 提示信息
    '输入n8n服务器URL': 'Enter n8n server URL',
    '输入分钟数': 'Enter minutes',
    '输入最大错误日志数': 'Enter max error logs count',
    // 应用锁相关
    '设置应用锁密码': 'Set App Lock Password',
    '输入密码': 'Password',
    '确认密码': 'Confirm Password',
    '密码长度至少为4位': 'Password must be at least 4 digits',
    '两次输入的密码不一致': 'Passwords do not match',
    '密码设置成功': 'Password set successfully',
    '请输入密码': 'Please Enter Password',
    '请输入4位数字密码': 'Please enter a 4-digit password',
    '请再次输入4位数字密码': 'Please enter the 4-digit password again',
    '返回': 'Back',
    '下一步': 'Next',
    '密码错误，请重试': 'Incorrect password, please try again',
    '解锁': 'Unlock',
    '设置密码': 'Set Password',
    // 流程列表页面新增
    '流程监控': 'Process Monitoring',
    '总数': 'Total',
    '自动化流程': 'Automation Workflows',
    '点击查看详情和执行日志': 'Click to view details and execution logs',
    '正在加载工作流...': 'Loading workflows...',
    '请在设置中配置n8n服务器URL': 'Please configure n8n server URL in settings',
    '前往设置': 'Go to Settings',
    '暂无工作流数据': 'No workflow data available',
    '获取流程详情失败': 'Failed to get workflow details',
    '状态更新失败': 'Failed to update status',
    '排序方式': 'Sort By',
    '无法自动启动': 'Cannot auto-start',
    '此工作流无法自动启动': 'This workflow cannot auto-start',
    // 错误日志页面新增
    '确认清除': 'Confirm Clear',
    '确定要清除所有错误日志吗？': 'Are you sure you want to clear all error logs?',
    '成功': 'Success',
    '错误日志已清除': 'Error logs have been cleared',
    '清除错误日志失败': 'Failed to clear error logs',
    '加载中...': 'Loading...',
    '收起': 'Collapse',
    '展开': 'Expand',
    // 工作流详情页面新增
    '该工作流不支持手动触发': 'This workflow does not support manual triggering',
    '触发方式': 'Trigger Method',
    '执行次数': 'Execution Count',
    '成功率': 'Success Rate',
    '表单': 'Form',
    '聊天': 'Chat',
    '手动': 'Manual',
    '定时': 'Scheduled',
    '已成功触发工作流执行': 'Workflow execution triggered successfully',
    '触发工作流失败': 'Failed to trigger workflow',
    'URL已复制到剪贴板': 'URL copied to clipboard',
    '复制URL失败': 'Failed to copy URL',
    '请先设置n8n服务器URL': 'Please set n8n server URL first',
    '工作流已启用': 'Workflow has been enabled',
    '工作流已禁用': 'Workflow has been disabled',
    '更新工作流状态失败': 'Failed to update workflow status',
    '无': 'None',
    '暂无节点信息': 'No node information available',
    '暂无执行日志': 'No execution logs available',
    '节点列表': 'Node List',
    '执行日志列表': 'Execution Logs List',
    '连接失败': 'Connection Failed',
    '无法连接到N8N服务器，请检查：': 'Unable to connect to N8N server, please check:',
    '1. 服务器地址是否正确': '1. Is the server address correct',
    '2. 网络连接是否正常': '2. Is the network connection normal',
    '3. 认证信息是否正确': '3. Is the authentication information correct',
    // 隐私政策和服务条款页面
    '隐私政策': 'Privacy Policy',
    '服务条款': 'Terms of Service',
    '最后更新': 'Last Updated',
    '1. 接受条款': '1. Acceptance of Terms',
    '2. 服务描述': '2. Service Description',
    '3. 用户责任': '3. User Responsibilities',
    '4. 知识产权': '4. Intellectual Property',
    '5. 免责声明': '5. Disclaimer',
    '6. 服务变更和中止': '6. Service Changes and Termination',
    '7. 适用法律': '7. Governing Law',
    '8. 条款变更': '8. Changes to Terms',
    '9. 联系我们': '9. Contact Us',
    '法律条款': 'Legal Terms',
    // 隐私政策页面
    '1. 信息收集': '1. Information Collection',
    '2. 数据存储': '2. Data Storage',
    '3. 网络连接': '3. Network Connection',
    '4. 应用锁功能': '4. App Lock Feature',
    '5. 第三方服务': '5. Third-Party Services',
    '6. 儿童隐私': '6. Children\'s Privacy',
    '7. 政策变更': '7. Policy Changes',
    '8. 联系我们': '8. Contact Us'
  },
  zh: {
    // 通用
    '确定': '确定',
    '取消': '取消',
    '确认': '确认',
    '编辑': '编辑',
    '查看': '查看',
    '选择': '选择',
    
    // 导航标签
    '工作流': '工作流',
    '设置': '设置',
    
    // 设置页面
    '连接设置': '连接设置',
    'n8n服务器URL': 'n8n服务器URL',
    '用户界面': '用户界面',
    '深色模式': '深色模式',
    '语言': '语言/Language',
    '安全设置': '安全设置',
    '系统设置': '系统设置',
    '生物识别认证': '生物识别认证',
    '应用锁': '应用锁',
    '自动登出时间': '自动登出时间',
    '最大错误日志数': '最大错误日志数',
    '查看错误日志': '查看错误日志',
    '分钟': '分钟',
    '条': '条',
    '关于': '关于',
    
    // 认证相关
    '认证设置': '认证设置',
    '认证类型': '认证类型',
    '无认证': '无认证',
    'Basic认证': 'Basic认证',
    'Header认证': 'Header认证',
    'JWT认证': 'JWT认证',
    '用户名': '用户名',
    '密码': '密码',
    'Header键': 'Header键',
    'Header值': 'Header值',
    'JWT Token': 'JWT Token',
    
    // 工作流列表页面
    '全部': '全部',
    '激活': '激活',
    '未激活': '未激活',
    '错误': '错误',
    '运行中': '运行中',
    '进行中': '进行中',
    '已暂停': '已暂停',
    '执行中': '执行中',
    '刷新': '刷新',
    '排序': '排序',
    '按名称': '按名称',
    '按更新时间': '按更新时间',
    '按状态': '按状态',
    '升序': '升序',
    '降序': '降序',
    '排序字段': '排序字段',
    '修改时间': '修改时间',
    '搜索工作流': '搜索工作流',
    '没有找到匹配的工作流': '没有找到匹配的工作流',
    '没有工作流': '没有工作流',
    '请检查n8n服务器URL设置': '请检查n8n服务器URL设置',
    '名称': '名称',
    '状态': '状态',
    '子工作流': '子工作流',
    
    // 工作流详情页面
    '工作流详情': '工作流详情',
    '基本信息': '基本信息',
    '描述': '描述',
    '创建时间': '创建时间',
    '更新时间': '更新时间',
    '执行统计': '执行统计',
    '执行次数': '执行次数',
    '成功率': '成功率',
    '最近执行': '最近执行',
    '节点信息': '节点信息',
    '节点数': '节点数',
    '连接数': '连接数',
    '手动触发': '手动触发',
    '执行日志': '执行日志',
    '触发执行': '触发执行',
    '复制URL': '复制URL',
    '启用': '启用',
    '禁用': '禁用',
    
    // 错误日志页面
    '错误日志': '错误日志',
    '清空日志': '清空日志',
    '没有错误日志': '没有错误日志',
    '错误信息': '错误信息',
    '时间': '时间',
    '调用堆栈': '调用堆栈',
    
    // 模态框标题
    '编辑n8n服务器URL': '编辑n8n服务器URL',
    '编辑自动登出时间': '编辑自动登出时间',
    '编辑最大错误日志数': '编辑最大错误日志数',
    '选择语言': '选择语言',
    '排序选项': '排序选项',
    
    // 提示信息
    '输入n8n服务器URL': '输入n8n服务器URL',
    '输入分钟数': '输入分钟数',
    '输入最大错误日志数': '输入最大错误日志数',
    // 应用锁相关
    '设置应用锁密码': '设置应用锁密码',
    '输入密码': '输入密码',
    '确认密码': '确认密码',
    '密码长度至少为4位': '密码长度至少为4位',
    '两次输入的密码不一致': '两次输入的密码不一致',
    '密码设置成功': '密码设置成功',
    '请输入密码': '请输入密码',
    '请输入4位数字密码': '请输入4位数字密码',
    '请再次输入4位数字密码': '请再次输入4位数字密码',
    '返回': '返回',
    '下一步': '下一步',
    '密码错误，请重试': '密码错误，请重试',
    '解锁': '解锁',
    '设置密码': '设置密码',
    // 流程列表页面新增
    '流程监控': '流程监控',
    '总数': '总数',
    '自动化流程': '自动化流程',
    '点击查看详情和执行日志': '点击查看详情和执行日志',
    '正在加载工作流...': '正在加载工作流...',
    '请在设置中配置n8n服务器URL': '请在设置中配置n8n服务器URL',
    '前往设置': '前往设置',
    '暂无工作流数据': '暂无工作流数据',
    '获取流程详情失败': '获取流程详情失败',
    '状态更新失败': '状态更新失败',
    '排序方式': '排序方式',
    '无法自动启动': '无法自动启动',
    '此工作流无法自动启动': '此工作流无法自动启动',
    // 错误日志页面新增
    '确认清除': '确认清除',
    '确定要清除所有错误日志吗？': '确定要清除所有错误日志吗？',
    '成功': '成功',
    '错误日志已清除': '错误日志已清除',
    '清除错误日志失败': '清除错误日志失败',
    '加载中...': '加载中...',
    '收起': '收起',
    '展开': '展开',
    // 工作流详情页面新增
    '该工作流不支持手动触发': '该工作流不支持手动触发',
    '触发方式': '触发方式',
    '表单': '表单',
    '聊天': '聊天',
    '手动': '手动',
    '定时': '定时',
    '已成功触发工作流执行': '已成功触发工作流执行',
    '触发工作流失败': '触发工作流失败',
    'URL已复制到剪贴板': 'URL已复制到剪贴板',
    '复制URL失败': '复制URL失败',
    '请先设置n8n服务器URL': '请先设置n8n服务器URL',
    '工作流已启用': '工作流已启用',
    '工作流已禁用': '工作流已禁用',
    '更新工作流状态失败': '更新工作流状态失败',
    '无': '无',
    '暂无节点信息': '暂无节点信息',
    '暂无执行日志': '暂无执行日志',
    '节点列表': '节点列表',
    '执行日志列表': '执行日志列表',
    '连接失败': '连接失败',
    '无法连接到N8N服务器，请检查：': '无法连接到N8N服务器，请检查：',
    '1. 服务器地址是否正确': '1. 服务器地址是否正确',
    '2. 网络连接是否正常': '2. 网络连接是否正常',
    '3. 认证信息是否正确': '3. 认证信息是否正确',
    // 隐私政策和服务条款页面
    '隐私政策': '隐私政策',
    '服务条款': '服务条款',
    '最后更新': '最后更新',
    '1. 接受条款': '1. 接受条款',
    '2. 服务描述': '2. 服务描述',
    '3. 用户责任': '3. 用户责任',
    '4. 知识产权': '4. 知识产权',
    '5. 免责声明': '5. 免责声明',
    '6. 服务变更和中止': '6. 服务变更和中止',
    '7. 适用法律': '7. 适用法律',
    '8. 条款变更': '8. 条款变更',
    '9. 联系我们': '9. 联系我们',
    // 隐私政策页面
    '1. 信息收集': '1. 信息收集',
    '2. 数据存储': '2. 数据存储',
    '3. 网络连接': '3. 网络连接',
    '4. 应用锁功能': '4. 应用锁功能',
    '5. 第三方服务': '5. 第三方服务',
    '6. 儿童隐私': '6. 儿童隐私',
    '7. 政策变更': '7. 政策变更',
    '8. 联系我们': '8. 联系我们',
    '法律条款': '法律条款'
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  supportedLanguages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('zh');
  
  const supportedLanguages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
  ];

  // 初始化语言设置
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('加载语言设置失败:', error);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('保存语言设置失败:', error);
    }
  };

  const t = (key: string): string => {
    const safeLanguage = language in translations ? language : 'zh';
    return translations[safeLanguage as keyof typeof translations]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};