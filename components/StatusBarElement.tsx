import React from 'react';
import {StatusBar} from 'react-native';
import {useIsFocused} from '@react-navigation/native';

interface StatusBarElementType {
  barStyle?: 'dark-content' | 'light-content' | 'default';
  backgroundColor?: string;
  hidden?: boolean;
}

const StatusBarElement: React.FC<StatusBarElementType> = ({
  barStyle,
  backgroundColor,
  hidden,
}) => {
  const isFocused = useIsFocused();

  return isFocused ? (
    <StatusBar
      hidden={hidden}
      barStyle={barStyle}
      backgroundColor={backgroundColor}
    />
  ) : null;
};

export default StatusBarElement;
