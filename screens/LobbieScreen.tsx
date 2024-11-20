import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Text,
  SafeAreaView,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {SocketContext, callerId} from '../utils/socketIO';
import PhoneIcon from '../assets/svgs/phone.svg';
import {navigate} from '../utils/navigationRef';
import {Socket} from 'socket.io-client';

interface DeviceType {
  deviceId: string;
  facing?: 'front' | 'environment';
  groupId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
}

let peerConstraints = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    {
      urls: 'stun:stun2.l.google.com:19302',
    },
  ],
};

let sessionConstraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
    VoiceActivityDetection: true,
  },
};

export default function LobbieScreen() {
  const [localStream, setlocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [incomingCall, setIncomingCall] = useState(false);

  const peerConnection = useRef<RTCPeerConnection>(
    new RTCPeerConnection(peerConstraints),
  );
  let remoteRTCMessage = useRef(null);
  const otherUserId = useRef<string | null>(null);

  const socket = useContext(SocketContext) as Socket;

  useEffect(() => {
    if (localStream && remoteStream) {
      navigate('call', {
        localStream,
        remoteStream,
        peerConnection: peerConnection.current,
      });
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    socket.on('newCall', (data: any) => {
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      setIncomingCall(true);
    });

    socket.on('callAnswered', (data: any) => {
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current!),
      );
    });

    socket.on('ICEcandidate', async (data: any) => {
      let message = data.rtcMessage;
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate({
              candidate: message.candidate,
              sdpMid: message.id,
              sdpMLineIndex: message.label,
            }),
          );
          console.log('SUCCESS');
        } catch (error) {
          console.log('Error', error);
        }
      }
    });

    handleLocalStream();
    return () => {
      socket.off('newCall');
      socket.off('callAnswered');
      socket.off('ICEcandidate');
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      // @ts-ignore:
      peerConnection.current.addEventListener('track', event => {
        const newRemoteStream = new MediaStream();
        newRemoteStream.addTrack(event.track);
        setRemoteStream(newRemoteStream);
      });

      // @ts-ignore:
      peerConnection.current.addEventListener('icecandidate', event => {
        if (event.candidate) {
          const icecandidate = {
            calleeId: otherUserId.current,
            rtcMessage: {
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            },
          };
          socket.emit('ICEcandidate', icecandidate);
        } else {
          console.log('End of candidates.');
        }
      });
    }
  }, [localStream]);

  const handleLocalStream = async () => {
    try {
      let isFront = true;

      const devices = (await mediaDevices.enumerateDevices()) as DeviceType[];
      const facing = isFront ? 'front' : 'environment';
      const facingMode = isFront ? 'user' : 'environment';
      const videoSourceId = devices.find(
        device => device.kind === 'videoinput' && device.facing === facing,
      );

      const constraints = {
        audio: true,
        video: {
          mandatory: {
            minWidth: 400,
            minHeight: 400,
            minFrameRate: 30,
          },
          facingMode,
          optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        },
      };

      const stream = await mediaDevices.getUserMedia(constraints);
      setlocalStream(stream);

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
    } catch (error) {
      console.log(error, 'error !');
    }
  };

  const startCall = async () => {
    if (otherUserId.current?.length !== 6) {
      return Alert.alert('Invalid UserID');
    }

    const sessionDescription = await peerConnection.current.createOffer(
      sessionConstraints,
    );
    await peerConnection.current.setLocalDescription(sessionDescription);
    const data = {
      calleeId: otherUserId.current,
      rtcMessage: sessionDescription,
    };
    socket.emit('call', data);
  };

  const acceptCall = async () => {
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current!),
    );
    const sessionDescription = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(sessionDescription);
    const data = {
      callerId: otherUserId.current,
      rtcMessage: sessionDescription,
    };
    socket.emit('answerCall', data);
  };

  //   function toggleCamera() {
  //     localWebcamOn ? setlocalWebcamOn(false) : setlocalWebcamOn(true);
  //     localStream.getVideoTracks().forEach(track => {
  //       localWebcamOn ? (track.enabled = false) : (track.enabled = true);
  //     });
  //   }

  //   function toggleMic() {
  //     localMicOn ? setlocalMicOn(false) : setlocalMicOn(true);
  //     localStream.getAudioTracks().forEach(track => {
  //       localMicOn ? (track.enabled = false) : (track.enabled = true);
  //     });
  //   }

  //   function leave() {
  //     peerConnection.current.close();
  //     setlocalStream(null);
  //     setType('JOIN');
  //   }

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={{
          flexDirection: 'row',
          height: Dimensions.get('window').height * 0.35,
        }}>
        {localStream ? (
          <RTCView
            objectFit={'contain'}
            style={{
              flex: 1,
            }}
            streamURL={localStream.toURL()}
          />
        ) : null}
      </View>

      {incomingCall && (
        <TouchableOpacity onPress={acceptCall}>
          <Text style={{fontSize: 26, color: 'red'}}>
            Incoming call from: {otherUserId.current}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.idSection}>
        <Text style={{fontSize: 18}}>Your Caller ID</Text>
        <Text style={{fontSize: 32, letterSpacing: 10, fontWeight: 'bold'}}>
          - {callerId} -
        </Text>
        <TextInput
          placeholder={'Enter Caller ID'}
          keyboardType={'number-pad'}
          style={styles.inputID}
          value={otherUserId.current!}
          maxLength={6}
          onChangeText={text => {
            otherUserId.current = text;
          }}
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.callButton}
        onPress={startCall}>
        <PhoneIcon width={42} height={42} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  idSection: {
    width: Dimensions.get('window').width * 0.8,
    alignSelf: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '4%',
  },
  callButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 100,
    elevation: 6,
    justifyContent: 'center',
    backgroundColor: 'green',
    alignItems: 'center',
    position: 'absolute',
    bottom: '10%',
  },
  inputID: {
    fontSize: 24,
    borderBottomWidth: 1,
    width: Dimensions.get('window').width * 0.8,
  },
});
