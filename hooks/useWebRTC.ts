import {Alert, Keyboard} from 'react-native';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {SocketContext, callerId} from '../utils/socketIO';
import {navigate} from '../utils/navigationRef';
import {Socket} from 'socket.io-client';
import {Signal, Listener} from '../fixtures/signalingEvents.json';
import {useContext, useEffect, useRef, useState} from 'react';
import {fetch} from '@react-native-community/netinfo';

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
    // {
    //   urls: 'stun:stun1.l.google.com:19302',
    // },
    // {
    //   urls: 'stun:stun2.l.google.com:19302',
    // },
  ],
};

let sessionConstraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
    VoiceActivityDetection: true,
  },
};

export const useWebRTC = () => {
  const [localStream, setlocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [incomingCall, setIncomingCall] = useState(false);
  const [upcomingCall, setUpcomingCall] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | any>(
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
    socket.on(Listener.NEW_CALL, async (data: any) => {
      // Validate if the caller is on the same network
      const netInfo = (await fetch()) as any;

      if (data.netInfo?.details?.bssid !== netInfo?.details?.bssid) {
        socket.emit('unreachableCall', {callerId: data.callerId});
        return Alert.alert(
          'Unreachable Call',
          'User outside your network trying to call.',
        );
      }

      remoteRTCMessage.current = data.offer;
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
      setUpcomingCall(false);
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

    socket.on(Listener.CALL_ENDED, () => {
      endConnection();
      Alert.alert('Call Ended', 'Your call has been ended by your callee.');
    });

    handleLocalStream();
    return () => {
      socket.off(Listener.NEW_CALL);
      socket.off(Listener.CALL_ANSWERED);
      socket.off(Listener.CALL_REJECTED);
      socket.off(Listener.ICE_CANDIDATE);
      socket.off(Listener.CALL_ENDED);
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      peerConnection.current.addEventListener('track', (event: any) => {
        const newRemoteStream = new MediaStream();
        newRemoteStream.addTrack(event.track);
        setRemoteStream(newRemoteStream);
      });

      // peerConnection.current.addEventListener(
      //   'connectionstatechange',
      //   (event: any) => {
      //     console.log(event, 'connectionstatechange');
      //   },
      // );

      // peerConnection.current.addEventListener('icecandidateerror', (event: any) => {
      //   console.log(event, 'icecandidateerror');
      // });

      // After running setLocalDescription or setRemoteDescription this listener will try to get ice candidates.
      // NOTICE: The idea is to transform the sdp (the offer itself) and in the same time to exhange ice candidate
      // (which is the IP connection for webrtc protocol)
      peerConnection.current.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) {
          const icecandidate = {
            otherUserId: otherUserId.current,
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
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      setlocalStream(stream);
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
    // setLocalDescription will fire icecandidate listener with ICE's.
    await peerConnection.current.setLocalDescription(sessionDescription);
    const networkInformation = await fetch();

    const data = {
      callerId: callerId,
      calleeId: otherUserId.current,
      offer: sessionDescription,
      netInfo: networkInformation,
    };

    socket.emit(Signal.CALL, data);
    setUpcomingCall(true);
  };

  const acceptCall = async () => {
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current!),
    );
    const sessionDescription = await peerConnection.current.createAnswer();
    // The client that recive a call should use the answer as setLocalDescription
    await peerConnection.current.setLocalDescription(sessionDescription);
    const data = {
      callerId: otherUserId.current,
      rtcMessage: sessionDescription,
    };
    socket.emit(Signal.ANSWER_CALL, data);
  };

  const rejectCall = async () => {
    setIncomingCall(false);
    setUpcomingCall(false);

    const data = {
      calleeId: otherUserId.current,
    };
    socket.emit(Signal.REJECT_CALL, data);
  };

  const endConnection = () => {
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    otherUserId.current = null;
    remoteRTCMessage.current = null;

    // peerConnection.current.close();
    setUpcomingCall(false);
    setRemoteStream(null);
    navigate('lobbie');
  };

  return {
    localStream,
    remoteStream,
    incomingCall,
    upcomingCall,
    startCall,
    acceptCall,
    rejectCall,
    updateCallee,
    otherUserId: otherUserId.current,
  };
};

export default useWebRTC;
