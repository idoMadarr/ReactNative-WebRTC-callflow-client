import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Text,
  SafeAreaView,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {SocketContext, /* socket */ callerId} from '../utils/socketIO';
// import RoomScreen from './screens/RoomScreen';
// import CallScreen from './screens/CallScreen';
// import JoinScreen from './screens/JoinScreen';

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

  const peerConnection = useRef(new RTCPeerConnection(peerConstraints));
  let remoteRTCMessage = useRef(null);
  const otherUserId = useRef(null);

  const socket = useContext(SocketContext) as any;

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

    socket.on('ICEcandidate', (data: any) => {
      console.log('???gg', data);

      let message = data.rtcMessage;
      if (peerConnection.current) {
        peerConnection?.current
          .addIceCandidate(
            new RTCIceCandidate({
              candidate: message.candidate,
              sdpMid: message.id,
              sdpMLineIndex: message.label,
            }),
          )
          .then(data => {
            console.log('SUCCESS');
          })
          .catch(err => {
            console.log('Error', err);
          });
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
        console.log('track event');
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
          //   sendICEcandidate(icecandidate);
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

  return (
    <SafeAreaView>
      <View
        style={{
          backgroundColor: '#050A0E',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}>
        {localStream ? (
          <RTCView
            objectFit={'cover'}
            style={{width: 200, height: 300, backgroundColor: '#050A0E'}}
            streamURL={localStream.toURL()}
          />
        ) : null}
        {remoteStream ? (
          <RTCView
            objectFit={'cover'}
            style={{width: 200, height: 300, backgroundColor: '#050A0E'}}
            streamURL={remoteStream.toURL()}
          />
        ) : null}
      </View>
      <Text style={{fontSize: 36}}>Your Caller ID: {callerId}</Text>
      {incomingCall && (
        <TouchableOpacity onPress={acceptCall}>
          <Text style={{fontSize: 26, color: 'red'}}>
            Incoming call from: {otherUserId.current}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={{backgroundColor: 'green'}} onPress={startCall}>
        <Text style={{fontSize: 20}}>Start new Call</Text>
      </TouchableOpacity>
      <TextInput
        placeholder={'Enter Caller ID'}
        value={otherUserId.current}
        onChangeText={text => {
          otherUserId.current = text;
        }}
      />
    </SafeAreaView>
  );
}
