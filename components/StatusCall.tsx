import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import PhoneIcon from '../assets/svgs/phone.svg';

interface StatusCallPropsType {
  otherUserId: string;
  acceptCall?(): void;
  rejectCall?(): void;
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
      <Text style={{fontSize: 26, color: 'white'}}>
        {`${text} ${otherUserId}`}
      </Text>
      <View style={styles.controller}>
        {acceptCall && (
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'green'}]}
            onPress={acceptCall}>
            <PhoneIcon width={32} height={32} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, {backgroundColor: 'red'}]}
          onPress={rejectCall}>
          <PhoneIcon width={32} height={32} rotation={132} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1d1d1de5',
    position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controller: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    width: 55,
    height: 55,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    margin: 6,
  },
});

export default StatusCall;
