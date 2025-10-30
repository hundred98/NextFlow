import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CustomIconProps {
  name: 'workflow' | 'settings';
  size?: number;
  color?: string;
}

const CustomIcon: React.FC<CustomIconProps> = ({ name, size = 24, color = '#000' }) => {
  const iconSize = { width: size, height: size };
  
  const renderIcon = () => {
    switch (name) {
      case 'workflow':
        return (
          <View style={[styles.workflowIcon, iconSize]}>
            <View style={[styles.listItem, { backgroundColor: color, top: '10%' }]} />
            <View style={[styles.listItem, { backgroundColor: color, top: '35%' }]} />
            <View style={[styles.listItem, { backgroundColor: color, top: '60%' }]} />
          </View>
        );
      case 'settings':
        return (
          <View style={[styles.settingsIcon, iconSize]}>
            <View style={[styles.gear, { borderColor: color }]} />
            <View style={[styles.gearInner, { backgroundColor: color }]} />
          </View>
        );
      default:
        return null;
    }
  };

  return renderIcon();
};

const styles = StyleSheet.create({
  workflowIcon: {
    position: 'relative',
  },
  listItem: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '15%',
    borderRadius: 2,
  },
  settingsIcon: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gear: {
    width: '70%',
    height: '70%',
    borderRadius: 20,
    borderWidth: 3,
    borderStyle: 'solid',
  },
  gearInner: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    borderRadius: 10,
  },
});

export default CustomIcon;