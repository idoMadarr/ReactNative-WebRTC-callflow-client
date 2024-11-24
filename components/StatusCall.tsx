import React from 'react';
import {View, Dimensions, StyleSheet} from 'react-native';
import PhoneIcon from '../assets/svgs/phone.svg';
import ButtonElement from './ButtonElement';
import * as Colors from '../assets/colors/palette.json';
import TextElement from './TextElement';

interface StatusCallPropsType {
  otherUserId: string;
  acceptCall?(): void;
  rejectCall(): void;
  text: string;
}

const StatusCall: React.FC<StatusCallPropsType> = ({
  otherUserId,
  acceptCall,
  rejectCall,
  text,
}) => {
  return (
    <View style={styles.container}>
      <TextElement fontSize={'lg'} cStyle={styles.white}>
        {text}
      </TextElement>
      <TextElement
        fontSize={'xl'}
        fontWeight={'bold'}
        cStyle={{...styles.white, letterSpacing: 16}}>
        {otherUserId}
      </TextElement>
      <View style={styles.controller}>
        {acceptCall && (
          <ButtonElement
            onPress={acceptCall}
            backgroundColor={Colors.primary}
            cStyle={styles.button}>
            <PhoneIcon width={32} height={32} />
          </ButtonElement>
        )}
        <ButtonElement
          onPress={rejectCall}
          backgroundColor={Colors.secondary}
          cStyle={styles.button}>
          <PhoneIcon width={32} height={32} rotation={133} />
        </ButtonElement>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.offset,
  },
  controller: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '4%',
  },
  button: {
    marginHorizontal: '4%',
  },
  white: {
    color: Colors.white,
  },
});

export default StatusCall;
