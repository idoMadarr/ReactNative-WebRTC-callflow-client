import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
} from 'react-native';
import {MediaStream, RTCPeerConnection, RTCView} from 'react-native-webrtc';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import StatusBarElement from '../components/StatusBarElement';
import SwitchCamera from '../assets/svgs/camera.svg';
import Exit from '../assets/svgs/exit.svg';
import {goBack} from '../utils/navigationRef';

type RootStackParamList = {
  call: any;
};

type CallScreenPropsType = NativeStackScreenProps<RootStackParamList, 'call'>;

const CallScreen: React.FC<CallScreenPropsType> = ({route}) => {
  const localStream = route.params!.localStream as MediaStream;
  const remoteStream = route.params!.remoteStream as MediaStream;
  const peerConnection = route.params!.remoteStream as RTCPeerConnection;

  const onSwitchCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  const onLeave = () => {
    peerConnection.close();
    // send socket
    // goBack();
    // setlocalStream(null);
    // setType('JOIN');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBarElement hidden={true} />
      <View style={styles.remoteStream}>
        <RTCView
          objectFit={'cover'}
          style={styles.remote}
          streamURL={remoteStream.toURL()}
        />
      </View>
      <View style={styles.localStream}>
        <RTCView
          objectFit={'cover'}
          style={styles.local}
          streamURL={localStream.toURL()}
        />
      </View>
      <View style={styles.controller}>
        <TouchableOpacity onPress={onSwitchCamera} style={styles.button}>
          <SwitchCamera />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLeave} style={styles.button}>
          <Exit />
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.button}></TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  localStream: {
    width: Dimensions.get('window').width * 0.4,
    height: Dimensions.get('window').height * 0.3,
    zIndex: 100,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    position: 'absolute',
    top: '5%',
    right: '5%',
  },
  remoteStream: {
    zIndex: 50,
  },
  local: {
    flex: 1,
  },
  remote: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controller: {
    position: 'absolute',
    bottom: '5%',
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: '#1d1d1dda',
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').height * 0.12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
    borderRadius: 25,
    elevation: 6,
  },
  button: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    elevation: 6,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallScreen;
