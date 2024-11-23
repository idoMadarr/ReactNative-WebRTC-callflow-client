import React, {useContext, useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, Dimensions, View} from 'react-native';
import {MediaStream, RTCView} from 'react-native-webrtc';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Socket} from 'socket.io-client';
import {SocketContext} from '../utils/socketIO';
import StatusBarElement from '../components/StatusBarElement';
import SwitchCameraIcon from '../assets/svgs/camera.svg';
import PhoneIcon from '../assets/svgs/phone.svg';
import OffStreamIcon from '../assets/svgs/stream-off.svg';
import VideoIcon from '../assets/svgs/video.svg';
import NoVideoIcon from '../assets/svgs/no-video.svg';
import NoVideoIconWhite from '../assets/svgs/no-video-white.svg';
import MuteIcon from '../assets/svgs/mute.svg';
import VoiceIcon from '../assets/svgs/voice.svg';
import ButtonElement from '../components/ButtonElement';
import * as Colors from '../assets/colors/palette.json';

type RootStackParamList = {
  call: any;
};

type CallScreenPropsType = NativeStackScreenProps<RootStackParamList, 'call'>;

const CallScreen: React.FC<CallScreenPropsType> = ({route}) => {
  const localStream = route.params!.localStream as MediaStream;
  const remoteStream = route.params!.remoteStream as MediaStream;
  const otherUserId = route.params!.otherUserId.current;
  const endConnection: () => void = route.params!.endConnection;

  const socket = useContext(SocketContext) as Socket;

  const [localMicOn, setlocalMicOn] = useState(true);
  const [activeCamera, setActiveCamera] = useState(true);
  const [remoteActiveCamera, setRemoteActiveCamera] = useState(true);

  useEffect(() => {
    socket.on('callEnded', () => {
      endConnection();
    });

    socket.on('toggleCamera', () => {
      setRemoteActiveCamera(prevState => !prevState);
    });

    return () => {
      socket.off('callEnded');
    };
  }, []);

  const onSwitchCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  const toggleCamera = () => {
    setActiveCamera(activeCamera ? false : true);
    localStream.getVideoTracks().forEach(track => {
      track.enabled = activeCamera ? false : true;
    });
    socket.emit('setCamera', {otherUserId});
  };

  const toggleMic = () => {
    setlocalMicOn(localMicOn ? false : true);
    localStream.getAudioTracks().forEach(track => {
      track.enabled = localMicOn ? false : true;
    });
  };

  const onLeave = () => {
    socket.emit('endCall', {
      calleeId: otherUserId,
    });
    endConnection();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBarElement hidden={true} />
      <View style={styles.remoteStream}>
        <View
          style={[
            styles.offStream,
            {
              display: !remoteActiveCamera ? 'flex' : 'none',
              zIndex: 100,
            },
          ]}>
          <NoVideoIconWhite />
        </View>
        <RTCView
          objectFit={'cover'}
          style={styles.remote}
          streamURL={remoteStream.toURL()}
          mirror={true}
          zOrder={10}
        />
      </View>

      <View style={styles.localStream}>
        <View
          style={[
            styles.offStream,
            {
              display: !activeCamera ? 'flex' : 'none',
              zIndex: 200,
            },
          ]}>
          <OffStreamIcon />
        </View>
        <RTCView
          objectFit={'cover'}
          style={styles.local}
          streamURL={localStream.toURL()}
          mirror={true}
          zOrder={50}
        />
      </View>
      <View style={styles.controller}>
        <ButtonElement onPress={onSwitchCamera} backgroundColor={Colors.white}>
          <SwitchCameraIcon />
        </ButtonElement>
        <ButtonElement onPress={onLeave} backgroundColor={Colors.secondary}>
          <PhoneIcon width={32} height={32} rotation={133} />
        </ButtonElement>
        <ButtonElement
          onPress={toggleCamera}
          backgroundColor={activeCamera ? Colors.white : Colors.greish}>
          {activeCamera ? <NoVideoIcon /> : <VideoIcon />}
        </ButtonElement>
        <ButtonElement
          onPress={toggleMic}
          backgroundColor={localMicOn ? Colors.white : Colors.greish}>
          {localMicOn ? <MuteIcon /> : <VoiceIcon />}
        </ButtonElement>
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
    elevation: 6,
    position: 'absolute',
    top: '5%',
    right: '5%',
    backgroundColor: 'black',
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
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.11,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
    borderRadius: 25,
    elevation: 6,
  },
  offStream: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallScreen;
