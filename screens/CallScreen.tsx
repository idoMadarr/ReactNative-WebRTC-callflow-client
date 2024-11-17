import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {View, Text} from 'react-native';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import firestore, {
  addDoc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteField,
} from '@react-native-firebase/firestore';

interface CallScreenPropsType {
  roomId: string;
  screens: any;
  setScreen: Dispatch<SetStateAction<string>>;
}

interface DeviceType {
  deviceId: string;
  facing?: 'front' | 'environment';
  groupId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
}

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
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

const CallScreen: React.FC<CallScreenPropsType> = ({
  roomId,
  screens,
  setScreen,
}) => {
  const [localStream, setLocalStream] = useState<null | MediaStream>();
  const [remoteStream, setRemoteStream] = useState<null | MediaStream>();
  const peerConnection = useRef(new RTCPeerConnection(configuration));
  const [cachedLocalPC, setCachedLocalPC] = useState();
  const [isMuted, setIsMuted] = useState(false);
  const [isOffCam, setIsOffCam] = useState(false);

  useEffect(() => {
    handleLocalStream();
  }, []);

  useEffect(() => {
    if (localStream && roomId) {
      startCall(roomId);
    }
  }, [localStream, roomId]);

  const handleLocalStream = async () => {
    const isFront = true;

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
    setLocalStream(stream);
  };

  const startCall = async (roomId: string) => {
    if (!localStream) return;

    localStream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream);
    });

    const roomRef = firestore().collection('room').doc(roomId);
    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

    // @ts-ignore:
    peerConnection.current.addEventListener('icecandidate', event => {
      //   console.log('icecandidate event', event);
      // icecandidate event {
      //     "candidate": {
      //         "candidate": "candidate:71576279 1 udp 2122056191 fec0::11c6:894d:6626:faae 55154 typ host generation 0 ufrag XD04 network-id 2 network-cost 900",
      //         "sdpMLineIndex": 1,
      //         "sdpMid": "1"
      //     },
      //     "isTrusted": false
      // }
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }

      addDoc(callerCandidatesCollection, event.candidate.toJSON());
    });

    // @ts-ignore:
    peerConnection.current.addEventListener('track', event => {
      console.log('track event');
      const newStream = new MediaStream();
      newStream.addTrack(event.track);
      setRemoteStream(newStream);
    });

    const offer = await peerConnection.current.createOffer(sessionConstraints);
    await peerConnection.current.setLocalDescription(offer);

    await setDoc(roomRef, {offer, connected: false}, {merge: true});

    // Listen for remote answer
    onSnapshot(roomRef, doc => {
      const data = doc.data();
      if (!peerConnection.current.remoteDescription && data && data.answer) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        peerConnection.current.setRemoteDescription(rtcSessionDescription);
      } else {
        setRemoteStream(null);
      }
    });

    // when answered, add candidate to peer connection
    onSnapshot(calleeCandidatesCollection, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const endCall = async () => {
    const senders = peerConnection.current.getSenders();
    senders.forEach(sender => {
      peerConnection.current.removeTrack(sender);
    });
    peerConnection.current.close();

    const roomRef = firestore().collection('room').doc(roomId);
    await updateDoc(roomRef, {answer: deleteField()});

    setLocalStream(null);
    setRemoteStream(null);
    setScreen(screens.ROOM);
  };

  const switchCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track._switchCamera());
    }
  };

  const toggleMute = () => {
    if (!remoteStream) return;
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsOffCam(!isOffCam);
    });
  };

  return (
    <View>
      <Text>CallScreen</Text>
      {/* LocalStream */}
      {localStream && (
        <RTCView
          style={{width: 200, height: 300, backgroundColor: 'red'}}
          streamURL={localStream.toURL()}
          objectFit={'cover'}
        />
      )}

      {/* RemoteStream */}
      {remoteStream && (
        <>
          <RTCView
            style={{width: 200, height: 300, backgroundColor: 'green'}}
            streamURL={remoteStream.toURL()}
            objectFit={'cover'}
          />
          {/* {!isOffCam && (
                <RTCView 

                />
            )} */}
        </>
      )}
      <View style={{}}>
        <Text>Action Box</Text>
      </View>
    </View>
  );
};

export default CallScreen;
