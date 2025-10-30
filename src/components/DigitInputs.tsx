import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Keyboard } from 'react-native';

interface DigitInputsProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  isDarkMode: boolean;
  immediateSecure?: boolean;
}

const DigitInputs: React.FC<DigitInputsProps> = ({
  value,
  onChange,
  isDarkMode,
  immediateSecure = false,
}) => {
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const hasFocused = useRef(false);

  /* 处理数字输入 */
  const handleNumberChange = (index: number, digitValue: string) => {
    if (!/^\d*$/.test(digitValue)) return;
    const newValue = [...value];
    newValue[index] = digitValue;
    onChange(newValue);
    if (digitValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* 处理退格 */
  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /* 只在校准阶段聚焦一次，防止光标乱跑 */
  useEffect(() => {
    // 重置聚焦状态，当密码数组改变时（例如清空密码时）
    if (value.every(digit => !digit)) {
      hasFocused.current = false;
    }

    const onKeyboardShow = () => {
      if (hasFocused.current) return;
      hasFocused.current = true;
      setTimeout(() => {
        const firstEmptyIndex = value.findIndex((d) => !d);
        if (firstEmptyIndex !== -1) {
          inputRefs.current[firstEmptyIndex]?.focus();
        }
      }, 300);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardShow);

    // 兜底：键盘已打开时
    const fallbackTimer = setTimeout(() => {
      if (!hasFocused.current) {
        const firstEmptyIndex = value.findIndex((d) => !d);
        if (firstEmptyIndex !== -1) {
          inputRefs.current[firstEmptyIndex]?.focus();
        }
        hasFocused.current = true;
      }
    }, 600);

    return () => {
      showSubscription.remove();
      clearTimeout(fallbackTimer);
    };
  }, [value]);

  return (
    <View style={styles.passwordContainer}>
      {value.map((digit, index) => (
        <View
          key={index}
          style={[styles.inputWrapper, isDarkMode && styles.darkInputWrapper]}
        >
          {immediateSecure ? (
            <View style={{ flex: 1 }}>
              <TextInput
                ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
                style={styles.transparentInput}
                value={digit}
                onChangeText={(text) => handleNumberChange(index, text)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                keyboardType="numeric"
                maxLength={1}
                secureTextEntry={false}
                autoCapitalize="none"
                autoCorrect={false}
                selectTextOnFocus
              />
              <Text style={[styles.displayText, isDarkMode && styles.darkDisplayText]}>
                {digit ? '•' : ''}
              </Text>
            </View>
          ) : (
            <TextInput
              ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
              style={[styles.standardInput, isDarkMode && styles.darkStandardInput]}
              value={digit}
              onChangeText={(text) => handleNumberChange(index, text)}
              onKeyPress={(e) => handleKeyPress(index, e)}
              keyboardType="numeric"
              maxLength={1}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              selectTextOnFocus
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  inputWrapper: {
    width: 50,
    height: 50,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkInputWrapper: {
    borderColor: '#555',
    backgroundColor: '#333',
  },
  transparentInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    textAlign: 'center',
    fontSize: 24,
  },
  standardInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    color: '#000',
  },
  darkStandardInput: {
    color: '#fff',
  },
  displayText: {
    fontSize: 24,
    color: '#000',
  },
  darkDisplayText: {
    color: '#fff',
  },
});

export default DigitInputs;