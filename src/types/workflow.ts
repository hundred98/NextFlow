export type WorkflowStatus = 'active' | 'inactive' | 'error' | 'running';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  lastExecution?: Date;
  executionCount: number;
  successRate: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  manualTrigger?: boolean;
  manualTriggerUrl?: string;
  isStatusChanging?: boolean; // 用于表示状态正在更改的标志
  // 从API返回的触发节点信息
  includeManualNodes?: boolean; // 是否包含手动触发节点
  manualTriggerNodes?: ManualTriggerNode[]; // 手动触发节点详细信息
  nodes?: WorkflowNode[]; // 工作流所有节点信息
}

export interface WorkflowDetail extends Workflow {
  executionLogs: ExecutionLog[];
  nodes: WorkflowNode[];
  connections: Connection[];
  manualTriggerUrl?: string;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'running';
  duration?: number;
  result?: string;
  errorMessage?: string;
  stack?: string; // 添加调用堆栈信息
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

// 手动触发节点信息
export interface ManualTriggerNode {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  position: { x: number; y: number };
}

export interface Connection {
  from: {
    nodeId: string;
    outputIndex: number;
  };
  to: {
    nodeId: string;
    inputIndex: number;
  };
}

// 认证类型
export type AuthType = 'none' | 'basic' | 'header' | 'jwt';

// 认证设置
export interface AuthSettings {
  type: AuthType;
  basic?: {
    username: string;
    password: string;
  };
  header?: {
    key: string;
    value: string;
  };
  jwt?: {
    token: string;
  };
}

// 设置相关类型
export interface AppSettings {
  n8nUrl: string;
  auth: AuthSettings;
  darkMode: boolean;
  appLock: boolean;
  maxErrorLogs: number; // 最大错误日志条数
  // biometricAuth和autoLogoutTime已移至三期开发
}