import React from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import {callerId} from '../utils/socketIO';
import PhoneIcon from '../assets/svgs/phone.svg';
import StatusBarElement from '../components/StatusBarElement';
import StatusCall from '../components/StatusCall';
import TextElement from '../components/TextElement';
import ButtonElement from '../components/ButtonElement';
import Colors from '../assets/colors/palette.json';
import useWebRTC from '../hooks/useWebRTC';

const LobbieScreen = () => {
  const {
    localStream,
    remoteStream,
    incomingCall,
    upcomingCall,
    startCall,
    acceptCall,
    rejectCall,
    updateCallee,
    otherUserId,
  } = useWebRTC();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBarElement hidden={true} />
      <View style={styles.rtcContainer}>
        {localStream ? (
          <RTCView
            objectFit={'contain'}
            style={styles.flex}
            streamURL={localStream.toURL()}
          />
        ) : null}
      </View>
      {(incomingCall || upcomingCall) && (
        <StatusCall
          text={incomingCall ? 'Incoming call from:' : 'Calling to:'}
          otherUserId={otherUserId!}
          acceptCall={incomingCall ? acceptCall : undefined}
          rejectCall={rejectCall}
        />
      )}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.idSection}>
          <TextElement fontSize={'lg'}>Your Caller ID</TextElement>
          <TextElement
            fontSize={'xl'}
            fontWeight={'bold'}
            cStyle={styles.letterSpacing}>
            {callerId}
          </TextElement>
          <TextElement fontSize={'lg'}>Enter Caller ID</TextElement>
          <TextInput
            placeholder={'ID'}
            keyboardType={'number-pad'}
            style={styles.inputID}
            value={otherUserId!}
            maxLength={6}
            onChangeText={updateCallee}
            allowFontScaling={false}
          />
          <ButtonElement
            onPress={startCall}
            backgroundColor={Colors.primary}
            cStyle={styles.callButton}>
            <PhoneIcon width={32} height={32} />
          </ButtonElement>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  rtcContainer: {
    height: Dimensions.get('window').height * 0.6,
    width: Dimensions.get('window').width,
    backgroundColor: Colors.gray,
  },
  idSection: {
    width: Dimensions.get('window').width * 0.8,
    alignSelf: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '4%',
  },
  callButton: {
    marginTop: '8%',
  },
  inputID: {
    fontSize: 20,
    padding: 14,
    borderRadius: 6,
    borderBottomWidth: 1,
    height: 50,
    textAlign: 'center',
    width: Dimensions.get('window').width * 0.26,
  },
  letterSpacing: {
    letterSpacing: 16,
  },
});

export default LobbieScreen;
