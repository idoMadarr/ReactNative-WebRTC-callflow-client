import React, {useEffect} from 'react';
import {BackHandler} from 'react-native';
import {SocketContext, socket} from './utils/socketIO';
import AppNavigation from './navigation/AppNavigation';
import KeepAwake from 'react-native-keep-awake';
import {LogBox} from 'react-native';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  KeepAwake.activate();

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', () => true);
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <AppNavigation />
    </SocketContext.Provider>
  );
};

export default App;
