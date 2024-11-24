import React from 'react';
import {Text, StyleSheet} from 'react-native';

interface TextElementType {
  children: JSX.Element | JSX.Element[] | string;
  fontSize?: string;
  fontWeight?: string;
  cStyle?: object;
}

const TextElement: React.FC<TextElementType> = ({
  children,
  fontSize,
  fontWeight,
  cStyle = {},
}) => {
  const setFontSize = (size: string = 'm') =>
    size === 's' ? 12 : size === 'm' ? 16 : size === 'lg' ? 22 : 32;

  const setFontFamily = (font: string = 'Poppins-Regular') =>
    font === 'bold'
      ? 'Poppins-Bold'
      : font === 'light'
      ? 'Poppins-Light'
      : 'Poppins-Regular';

  const styles = StyleSheet.create({
    constants: {
      fontSize: setFontSize(fontSize),
      fontFamily: setFontFamily(fontWeight),
    },
  });

  return (
    <Text allowFontScaling={false} style={[styles.constants, {...cStyle}]}>
      {children}
    </Text>
  );
};

export default TextElement;
