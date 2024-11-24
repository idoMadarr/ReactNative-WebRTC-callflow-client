import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
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
import StatusBarElement from '../components/StatusBarElement';
import StatusCall from '../components/StatusCall';
import TextElement from '../components/TextElement';
import ButtonElement from '../components/ButtonElement';
import {Signal, Listener} from '../fixtures/signalingEvents.json';
import Colors from '../assets/colors/palette.json';

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
  const [upcomingCall, setUpcomingall] = useState(false);

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
        otherUserId,
        endConnection,
      });
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    socket.on(Listener.NEW_CALL, (data: any) => {
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      setIncomingCall(true);
    });

    socket.on(Listener.CALL_ANSWERED, (data: any) => {
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current!),
      );
    });

    socket.on(Listener.CALL_REJECTED, () => {
      otherUserId.current = null;
      setUpcomingall(false);
      setIncomingCall(false);
    });

    socket.on(Listener.ICE_CANDIDATE, async (data: any) => {
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
      socket.off(Listener.NEW_CALL);
      socket.off(Listener.CALL_ANSWERED);
      socket.off(Listener.CALL_REJECTED);
      socket.off(Listener.ICE_CANDIDATE);
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
          socket.emit(Signal.ICE_CANDIDATE, icecandidate);
        } else {
          console.log('End of candidates.');
        }
      });
    }
  }, [localStream]);

  const updateCallee = (text: string) => {
    if (text.length === 6 || text.length > 6) {
      otherUserId.current = text;
      return Keyboard.dismiss();
    }
    otherUserId.current = text;
  };

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
          mandatory: {minFrameRate: 30},
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
      Alert.alert('Local Stream Error:', JSON.stringify(error));
    }
  };

  const startCall = async () => {
    if (otherUserId.current?.length !== 6 || otherUserId.current === callerId) {
      return Alert.alert(
        'Invalid UserID',
        'Please make sure to fill valid caller ID',
      );
    }

    const sessionDescription = await peerConnection.current.createOffer(
      sessionConstraints,
    );
    await peerConnection.current.setLocalDescription(sessionDescription);
    const data = {
      calleeId: otherUserId.current,
      rtcMessage: sessionDescription,
    };

    setUpcomingall(true);
    socket.emit(Signal.CALL, data);
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
    socket.emit(Signal.ANSWER_CALL, data);
  };

  const rejectCall = async () => {
    setIncomingCall(false);
    setUpcomingall(false);

    const data = {
      calleeId: otherUserId.current,
    };
    socket.emit(Signal.REJECT_CALL, data);
  };

  const endConnection = () => {
    peerConnection.current.close();
    setlocalStream(null);
    navigate('lobbie');
    // setRemoteStream(null);
  };

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
          otherUserId={otherUserId.current!}
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
            value={otherUserId.current!}
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
}

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
