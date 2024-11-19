import React from 'react';
import {SocketContext, socket} from './utils/socketIO';
import LobbieScreen from './screens/LobbieScreen';
import AppNavigation from './navigation/AppNavigation';
import {Text} from 'react-native';

const App: React.FC = () => {
  // return <Text>asd</Text>;
  return (
    <SocketContext.Provider value={socket}>
      <AppNavigation />
      {/* <LobbieScreen /> */}
    </SocketContext.Provider>
  );
};

export default App;
