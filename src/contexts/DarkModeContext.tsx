import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const SETTINGS_KEY = 'appSettings';

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false); // 默认设置为false，稍后从存储加载
  const [isInitialized, setIsInitialized] = useState(false); // 标记是否已完成初始化

  // 在组件挂载时从存储加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 检查是否在浏览器环境中
        if (typeof window !== 'undefined' && window.localStorage) {
          // 从localStorage加载设置
          const savedSettings = localStorage.getItem(SETTINGS_KEY);
          if (savedSettings) {
              const parsedSettings = JSON.parse(savedSettings);
              // 总是将深色模式设置转换为布尔值
              if (typeof parsedSettings.darkMode !== 'undefined') {
                setIsDarkMode(Boolean(parsedSettings.darkMode));
              } else {
                // 否则使用系统设置
                setIsDarkMode(Appearance.getColorScheme() === 'dark');
              }
          } else {
            // 如果没有保存的设置，使用系统设置
            setIsDarkMode(Appearance.getColorScheme() === 'dark');
          }
        } else {
          // 在原生环境中，使用 AsyncStorage
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
              const parsedSettings = JSON.parse(savedSettings);
              // 总是将深色模式设置转换为布尔值
              if (typeof parsedSettings.darkMode !== 'undefined') {
                setIsDarkMode(Boolean(parsedSettings.darkMode));
              } else {
                // 否则使用系统设置
                setIsDarkMode(Appearance.getColorScheme() === 'dark');
              }
            } else {
              // 如果没有保存的设置，使用系统设置
              setIsDarkMode(Appearance.getColorScheme() === 'dark');
            }
          } catch (e) {
            console.error('在原生环境中加载设置失败:', e);
            // 出错时使用系统设置
            setIsDarkMode(Appearance.getColorScheme() === 'dark');
          }
        }
      } catch (error) {
        console.error('加载深色模式设置时出错:', error);
        // 出错时使用系统设置
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // 只有在没有自定义设置时才跟随系统变化
      // 实际上，我们总是使用存储的设置，除非用户手动切换
    });

    return () => subscription.remove();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // 保存设置到存储
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        let settings = {
          n8nUrl: 'http://localhost:5678',
          darkMode: newMode,
          biometricAuth: false,
          appLock: false,
          autoLogoutTime: 15,
        };
        
        if (savedSettings) {
          settings = {
            ...settings,
            ...JSON.parse(savedSettings),
            darkMode: newMode
          };
        }
        
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } else {
        // 在原生环境中，使用 AsyncStorage
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
          let settings = {
            n8nUrl: 'http://localhost:5678',
            darkMode: newMode,
            biometricAuth: false,
            appLock: false,
            autoLogoutTime: 15,
          };
          
          if (savedSettings) {
            settings = {
              ...settings,
              ...JSON.parse(savedSettings),
              darkMode: newMode
            };
          }
          
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
          console.error('在原生环境中保存设置失败:', e);
        }
      }
    } catch (error) {
      console.error('保存深色模式设置时出错:', error);
    }
  };

  // 在初始化完成前不渲染子组件，避免闪烁
  if (!isInitialized) {
    return null;
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export default DarkModeContext;