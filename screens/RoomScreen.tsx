import React, {Dispatch, SetStateAction, useEffect} from 'react';
import {View, Text, TouchableOpacity, TextInput, Alert} from 'react-native';
import firestore, {getDoc} from '@react-native-firebase/firestore';

interface RoomScreenPropsType {
  roomId: string;
  screens: any;
  setScreen: Dispatch<SetStateAction<string>>;
  setRoomId: Dispatch<SetStateAction<string>>;
}

const RoomScreen: React.FC<RoomScreenPropsType> = ({
  setScreen,
  screens,
  setRoomId,
  roomId,
}) => {
  useEffect(() => {
    generateRandomId();
  }, []);

  const generateRandomId = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 7; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return setRoomId('123456');
  };

  //checks if room is existing
  const checkMeeting = async () => {
    if (roomId) {
      // Creates a reference to the document but doesn’t fetch any data.
      const roomRef = firestore().collection('room').doc(roomId);
      // Get actual data
      const roomSnapshot = await getDoc(roomRef);

      if (!roomSnapshot.exists || roomId === '') {
        console.log(`Room ${roomId} does not exist.`);
        Alert.alert('Wait for your instructor to start the meeting.');
        return;
      } else {
        // Navigate to a different screen
        onCallOrJoin(screens.JOIN);
      }
    } else {
      Alert.alert('Provide a valid Room ID.');
    }
  };

  const onCallOrJoin = (screen: string) => {
    if (roomId.length > 0) {
      setScreen(screen);
    }
  };

  return (
    <View>
      <Text>Enter Room ID:</Text>
      <TextInput value={roomId} onChangeText={setRoomId} />
      <View>
        <TouchableOpacity onPress={() => onCallOrJoin(screens.CALL)}>
          <Text>Start meeting</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={checkMeeting}>
          <Text>Join meeting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoomScreen;
