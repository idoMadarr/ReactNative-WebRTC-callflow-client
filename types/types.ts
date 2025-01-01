import {MediaStream} from 'react-native-webrtc';

type CallScreenParams = {
  localStream: MediaStream;
  remoteStream: MediaStream;
  otherUserId: {current: string};
  endConnection(): void;
};

export type RootStackParamList = {
  init: undefined;
  lobbie: undefined;
  call: CallScreenParams;
};
