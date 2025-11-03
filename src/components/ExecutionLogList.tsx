import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ExecutionLog } from '../types/workflow';

interface ExecutionLogListProps {
  logs: ExecutionLog[];
  isDarkMode?: boolean;
}

const ExecutionLogList: React.FC<ExecutionLogListProps> = ({ logs, isDarkMode = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'running':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'error':
        return '错误';
      case 'running':
        return '激活';
      default:
        return status;
    }
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(2)}m`;
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

  const renderLogItem = ({ item }: { item: ExecutionLog }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <View style={[styles.logItem, isDarkMode && styles.darkLogItem]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logId, isDarkMode && styles.darkText]} numberOfLines={1}>
            ID: {item.id}
          </Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusColor },
              ]}
            />
            <Text style={[styles.statusText, isDarkMode && styles.darkText]}>{statusText}</Text>
          </View>
        </View>
        <Text style={[styles.logTimestamp, isDarkMode && styles.darkText]}>
          {formatDate(item.timestamp)}
        </Text>
        {item.duration && (
          <Text style={[styles.logDuration, isDarkMode && styles.darkText]}>
            耗时: {formatDuration(item.duration)}
          </Text>
        )}
        {item.result && (
          <Text style={[styles.logResult, isDarkMode && styles.darkText]} numberOfLines={2}>
            {item.result}
          </Text>
        )}
        {item.errorMessage && (
          <Text style={[styles.logError, isDarkMode && styles.darkError]} numberOfLines={3}>
            {item.errorMessage}
          </Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={logs}
      renderItem={renderLogItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  darkLogItem: {
    backgroundColor: '#2D2D2D',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkError: {
    color: '#F87171',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  logDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  logResult: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  logError: {
    fontSize: 14,
    color: '#EF4444',
  },
});

export default ExecutionLogList;