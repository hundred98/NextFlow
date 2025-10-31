import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { Workflow } from '../types/workflow';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkflowListProps {
  workflows: Workflow[];
  onWorkflowPress: (workflow: Workflow) => void;
  onToggleStatus: (workflowId: string, newStatus: boolean) => void;
  onManualTrigger?: (workflow: Workflow) => void;
  isDarkMode?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  onWorkflowPress,
  onToggleStatus,
  onManualTrigger,
  isDarkMode = false,
  refreshing = false,
  onRefresh,
}) => {
  const { t } = useLanguage();
  
  const getStatusColor = (status: string, isUnstartable: boolean) => {
    if (isUnstartable) {
      return '#F59E0B';
    }
    
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'error':
        return '#EF4444';
      case 'running':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string, isUnstartable: boolean) => {
    if (isUnstartable) {
      return t('无法激活');
    }
    
    switch (status) {
      case 'active':
        return t('激活');
      case 'inactive':
        return t('未激活');
      case 'error':
        return t('错误');
      case 'running':
        return t('激活');
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWorkflowItem = ({ item }: { item: Workflow }) => {
    const hasManualTriggers = item.includeManualNodes || false;
    const manualTriggerNodes = item.manualTriggerNodes || [];
    const allNodes = item.nodes || [];
    
    const isUnstartableWorkflow = hasManualTriggers && 
      manualTriggerNodes.length > 0 && 
      manualTriggerNodes.every((node: any) => 
        node.type === 'n8n-nodes-base.manualTrigger' || 
        node.type === 'manual' ||
        node.type === 'n8n-nodes-base.executeWorkflowTrigger'
      ) && 
      !allNodes.some((node: any) => 
        node.type && (
          node.type.includes('webhook') || 
          node.type.includes('schedule') ||
          node.type.includes('cron') ||
          node.type.includes('polling')
        )
      );
    
    const handleSwitchPress = (e: any) => {
      e.stopPropagation();
      if (isUnstartableWorkflow) {
        e.preventDefault();
        return false;
      }
    };
    
    const statusColor = getStatusColor(item.status, isUnstartableWorkflow);
    const statusText = getStatusText(item.status, isUnstartableWorkflow);

    return (
      <TouchableOpacity
        style={[styles.workflowItem, isDarkMode && styles.darkWorkflowItem]}
        onPress={() => onWorkflowPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.workflowContent}>
          <View style={styles.workflowHeader}>
            {item.name ? (
              <Text style={[styles.workflowName, isDarkMode && styles.darkText]}>{item.name}</Text>
            ) : null}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: statusColor },
                  isUnstartableWorkflow && styles.unstartableIndicator
                ]}
              />
              {statusText ? (
                <Text style={[styles.statusText, isDarkMode && styles.darkText, isUnstartableWorkflow && styles.unstartableText]}>
                  {statusText}
                </Text>
              ) : null}
            </View>
          </View>
           {item.description ? (
            <Text style={[styles.workflowDescription, isDarkMode && styles.darkText]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.workflowFooter}>
          <View style={styles.statsContainer}>
            <Text style={[styles.statText, isDarkMode && styles.darkText]}>
              {t('执行次数')}: {item.executionCount}
            </Text>
            <Text style={[styles.statText, isDarkMode && styles.darkText]}>
              {t('成功率')}: {item.successRate}%
            </Text>
            {item.lastExecution && (
              <Text style={[styles.statText, isDarkMode && styles.darkText]}>
                {t('最后执行')}: {formatDate(item.lastExecution)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSwitchPress}
            activeOpacity={isUnstartableWorkflow ? 1 : 0.2}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            {(item as any).isStatusChanging ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ width: 50, height: 30 }} />
            ) : (
              <Switch
                value={item.status === 'active' || item.status === 'running'}
                onValueChange={(value) => {
                  if (!isUnstartableWorkflow) {
                    onToggleStatus(item.id, value);
                  }
                }}
                disabled={item.status === 'running' || isUnstartableWorkflow}
                trackColor={{ 
                  false: isUnstartableWorkflow ? (isDarkMode ? '#4A4A4A' : '#D1D5DB') : (isDarkMode ? '#4A4A4A' : '#6B7280'),
                  true: isUnstartableWorkflow ? (isDarkMode ? '#4A4A4A' : '#D1D5DB') : (isDarkMode ? '#5E92F3' : '#10B981') 
                }}
                thumbColor={
                  item.status === 'running' ? '#F59E0B' : 
                  item.status === 'active' ? (isDarkMode ? '#33a000ff' : '#33a000ff') : 
                  isUnstartableWorkflow ? (isDarkMode ? '#E5E7EB' : '#F3F4F6') : 
                  (isDarkMode ? '#E5E7EB' : '#cecbcbff')
                }
                ios_backgroundColor={isDarkMode ? '#3E3E3E' : '#E0E0E0'}
              />
            )}
          </TouchableOpacity>
        </View>
        {hasManualTriggers && (
          <View style={[styles.triggerInfoContainer, isDarkMode && styles.darkTriggerInfoContainer]}>
            <Text style={[styles.triggerInfoLabel, isDarkMode && styles.darkText]}>{t('触发方式')}:</Text>
            <View style={styles.triggerNodesContainer}>
              {manualTriggerNodes.map((node: any, index: number) => {
                let triggerType = '';
                let viewStyle = {};
                let textStyle = {};
                
                if (node.type === 'n8n-nodes-base.manualTrigger' || node.type === 'manual') {
                  triggerType = t('手动');
                  viewStyle = styles.manualTriggerDisabled;
                  textStyle = styles.manualTriggerTextDisabled;
                } else if (node.type === 'n8n-nodes-base.executeWorkflowTrigger') {
                  triggerType = t('子工作流');
                  viewStyle = styles.manualTriggerDisabled;
                  textStyle = styles.manualTriggerTextDisabled;
                } else if (node.type.includes('chatTrigger') || node.type === '@n8n/n8n-nodes-langchain.chatTrigger') {
                  triggerType = t('聊天');
                  viewStyle = styles.chatTrigger;
                  textStyle = styles.chatTriggerText;
                } else if (node.type.includes('webhook')) {
                  triggerType = 'Webhook';
                  viewStyle = styles.webhookTrigger;
                  textStyle = styles.webhookTriggerText;
                } else if (node.type.includes('schedule') || node.type.includes('cron') || node.type.includes('interval') || node.type.includes('timer')) {
                  triggerType = t('定时');
                  viewStyle = styles.scheduleTrigger;
                  textStyle = styles.scheduleTriggerText;
                } else if (node.type.includes('formTrigger')) {
                  triggerType = t('表单');
                  viewStyle = styles.formTrigger;
                  textStyle = styles.formTriggerText;
                } else {
                  const nodeType = node.type || '';
                  triggerType = nodeType;
                  viewStyle = styles.manualTriggerDisabled;
                  textStyle = styles.manualTriggerTextDisabled;
                }
                
                return (
                  <View key={`${node.type}-${index}`} style={[
                    styles.triggerNodeBadge,
                    viewStyle
                  ]}>
                    {triggerType && (
                      <Text style={[styles.triggerNodeText, textStyle]}>{triggerType}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {item.manualTrigger && onManualTrigger && (
          <TouchableOpacity
            style={styles.manualTriggerButton}
            onPress={(e) => {
              e.stopPropagation();
              onManualTrigger(item);
            }}
          >
            <Text style={styles.manualTriggerButtonText}>{t('手动触发')}</Text>
          </TouchableOpacity>
        )}
        {isUnstartableWorkflow && (
          <View style={styles.disabledInfoContainer}>
            <Text style={[styles.disabledInfoText, isDarkMode && styles.darkText]}>
              {t('此工作流无法激活')}
            </Text>
          </View>
        )}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, isDarkMode && styles.darkTag]}>
                <Text style={[styles.tagText, isDarkMode && styles.darkText]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={workflows}
      renderItem={({ item }) => renderWorkflowItem({ item })}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContainer, isDarkMode && styles.darkListContainer]}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingBottom: 16 },
  darkListContainer: { backgroundColor: '#121212' },
  workflowItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  darkWorkflowItem: { backgroundColor: '#1E1E1E' },
  workflowContent: { marginBottom: 8 },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workflowName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  darkText: { color: '#FFFFFF' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  unstartableIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  unstartableText: { color: '#F59E0B', fontWeight: '600' },
  workflowDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  workflowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsContainer: { flex: 1 },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  manualTriggerButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  manualTriggerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  darkTag: { backgroundColor: '#2D2D2D' },
  tagText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  triggerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  darkTriggerInfoContainer: { borderTopColor: '#2D2D2D' },
  triggerInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  triggerNodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  triggerNodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 4,
  },
  triggerNodeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  manualTrigger: { backgroundColor: '#3B82F6' },
  manualTriggerDisabled: { backgroundColor: '#9CA3AF' },
  webhookTrigger: { backgroundColor: '#10B981' },
  scheduleTrigger: { backgroundColor: '#F59E0B' },
  formTrigger: { backgroundColor: '#8B5CF6' },
  chatTrigger: { backgroundColor: '#EC4899' },
  manualTriggerText: { color: '#FFFFFF' },
  manualTriggerTextDisabled: { color: '#FFFFFF' },
  webhookTriggerText: { color: '#FFFFFF' },
  scheduleTriggerText: { color: '#1F2937' },
  formTriggerText: { color: '#FFFFFF' },
  chatTriggerText: { color: '#FFFFFF' },
  disabledInfoContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  disabledInfoText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});

export default WorkflowList;