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
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteField,
} from '@react-native-firebase/firestore';

interface JoinScreenPropsType {
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

const JoinScreen: React.FC<JoinScreenPropsType> = ({
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

  //Automatically start stream
  useEffect(() => {
    handleLocalStream();
  }, []);

  useEffect(() => {
    if (localStream) {
      joinCall(roomId);
    }
  }, [localStream]);

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

  const joinCall = async (roomId: string) => {
    const roomRef = firestore().collection('room').doc(roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists) return;
    localStream?.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream);
    });

    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

    // @ts-ignore:
    peerConnection.current.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      addDoc(calleeCandidatesCollection, event.candidate.toJSON());
    });

    // @ts-ignore:
    peerConnection.current.addEventListener('track', event => {
      console.log('track event - join');
      const newStream = new MediaStream();
      newStream.addTrack(event.track);
      setRemoteStream(newStream);
    });

    const offer = roomSnapshot.data()?.offer;
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer),
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    // @ts-ignore:
    await updateDoc(roomRef, {answer, connected: true}, {merge: true});

    onSnapshot(callerCandidatesCollection, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    onSnapshot(roomRef, doc => {
      const data = doc.data();
      if (!data?.answer) {
        setScreen(screens.ROOM);
      }
    });
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
      <RTCView
        style={{width: 200, height: 300, backgroundColor: 'blue'}}
        streamURL={remoteStream ? remoteStream.toURL() : ''}
        objectFit={'cover'}
      />
      {remoteStream && !isOffCam && (
        <RTCView
          style={{width: 200, height: 300, backgroundColor: 'pink'}}
          streamURL={localStream ? localStream.toURL() : ''}
        />
      )}
    </View>
  );
};

export default JoinScreen;
