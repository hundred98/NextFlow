import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';

interface AppLockContextType {
  isLocked: boolean;
  isSettingUp: boolean;
  lockApp: () => void;
  unlockApp: (password: string) => Promise<boolean>;
  setupPassword: (password: string) => Promise<void>;
  hasPasswordSet: boolean;
  clearPassword: () => Promise<void>;
  appLockEnabled: boolean; // 应用锁的综合状态
  updateAppLockEnabled: (enabled: boolean) => Promise<void>; // 更新应用锁状态
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [appLockEnabled, setAppLockEnabled] = useState(false); // 应用锁的综合状态
  
  // 检查是否已设置密码并计算应用锁综合状态
  useEffect(() => {
    const checkPasswordAndAppLockStatus = async () => {
      try {
        const storedPassword = await AsyncStorage.getItem('app_lock_password');
        const isPasswordSet = !!storedPassword;
        setHasPasswordSet(isPasswordSet);
        
        // 获取appLockEnabled标志
        const appLockEnabledFlag = await AsyncStorage.getItem('appLockEnabled');
        const isAppLockEnabled = appLockEnabledFlag === 'true';
        
        // 计算综合状态：有密码且启用了应用锁
        const finalAppLockEnabled = isPasswordSet && isAppLockEnabled;
        setAppLockEnabled(finalAppLockEnabled);
        
        // 如果启用了应用锁并且有密码，直接锁定应用
        if (isAppLockEnabled && isPasswordSet) {
          setIsLocked(true);
        }
      } catch (error) {
        console.error('检查密码和应用锁状态失败:', error);
      }
    };
    
    checkPasswordAndAppLockStatus();
  }, []);
  
  // 当hasPasswordSet变化时，更新应用锁综合状态
  useEffect(() => {
    const updateAppLockStatus = async () => {
      try {
        if (!hasPasswordSet) {
          // 没有密码时，应用锁应该禁用
          setAppLockEnabled(false);
          // 同时更新存储中的状态
          await AsyncStorage.setItem('appLockEnabled', 'false');
        } else {
          // 有密码时，根据存储中的标志决定是否启用
          const appLockEnabledFlag = await AsyncStorage.getItem('appLockEnabled');
          setAppLockEnabled(appLockEnabledFlag === 'true');
        }
      } catch (error) {
        console.error('更新应用锁状态失败:', error);
      }
    };
    
    updateAppLockStatus();
  }, [hasPasswordSet]);
  
  // 监听应用状态变化
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // 检查是否启用了应用锁
        try {
          const enabled = await AsyncStorage.getItem('appLockEnabled');
          if (enabled === 'true' && hasPasswordSet) {
            const currentTime = Date.now();
            // 如果应用进入后台超过5秒，锁定应用
            if (currentTime - lastActiveTime > 5000) {
              setIsLocked(true);
            }
          }
        } catch (error) {
          console.error('检查应用锁状态失败:', error);
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        setLastActiveTime(Date.now());
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [hasPasswordSet]);
  
  // 锁定应用
  const lockApp = () => {
    setIsLocked(true);
    // 确保应用锁状态为启用
    AsyncStorage.setItem('appLockEnabled', 'true')
      .then(() => setAppLockEnabled(true)) // 更新Context中的状态
      .catch(error => {
        console.error('保存应用锁状态失败:', error);
      });
  };
  
  // 更新应用锁启用状态
  const updateAppLockEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('appLockEnabled', enabled ? 'true' : 'false');
      setAppLockEnabled(enabled);
      
      // 如果启用了应用锁且有密码，锁定应用
      if (enabled && hasPasswordSet) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error('更新应用锁状态失败:', error);
      throw error;
    }
  };
  
  // 解锁应用
  const unlockApp = async (password: string): Promise<boolean> => {
    try {
      const storedPassword = await AsyncStorage.getItem('app_lock_password');
      if (password === storedPassword) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('解锁失败:', error);
      return false;
    }
  };
  
  // 设置密码
  const setupPassword = async (password: string): Promise<void> => {
    try {
      // 确保密码是4位数字
      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        throw new Error('密码必须是4位数字');
      }
      
      await AsyncStorage.setItem('app_lock_password', password);
      // 确保应用锁状态为启用
      await AsyncStorage.setItem('appLockEnabled', 'true');
      setHasPasswordSet(true);
      setAppLockEnabled(true); // 同步更新Context中的状态
      setIsSettingUp(false);
      // 不再立即锁定应用，让用户可以直接使用
    } catch (error) {
      console.error('设置密码失败:', error);
      throw error;
    }
  };
  
  // 清除密码
  const clearPassword = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('app_lock_password');
      await AsyncStorage.setItem('appLockEnabled', 'false');
      setHasPasswordSet(false);
      setAppLockEnabled(false); // 同步更新Context中的状态
      setIsLocked(false);
    } catch (error) {
      console.error('清除密码失败:', error);
      throw error;
    }
  };
  
  return (
    <AppLockContext.Provider value={{ 
      isLocked, 
      isSettingUp, 
      lockApp, 
      unlockApp, 
      setupPassword, 
      hasPasswordSet,
      clearPassword,
      appLockEnabled,
      updateAppLockEnabled
    }}>
      {children}
    </AppLockContext.Provider>
  );
};