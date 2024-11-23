import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';

interface ButtonElementPropsType {
  children: JSX.Element;
  backgroundColor: string;
  cStyle?: {};
  onPress(): void;
}

const ButtonElement: React.FC<ButtonElementPropsType> = ({
  children,
  backgroundColor,
  cStyle,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.buttonContainer, {backgroundColor, ...cStyle}]}
      onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: 55,
    height: 55,
    borderRadius: 100,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ButtonElement;
