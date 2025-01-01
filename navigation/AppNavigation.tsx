import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import InitScreen from '../screens/InitScreen';
import LobbieScreen from '../screens/LobbieScreen';
import {navigationRef} from '../utils/navigationRef';
import CallScreen from '../screens/CallScreen';
import {RootStackParamList} from '../types/types';

const AppNavigator = createNativeStackNavigator<RootStackParamList>();

const AppNavigation: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator.Navigator screenOptions={{headerShown: false}}>
        <AppNavigator.Screen name={'init'} component={InitScreen} />
        <AppNavigator.Screen name={'lobbie'} component={LobbieScreen} />
        <AppNavigator.Screen name={'call'} component={CallScreen} />
      </AppNavigator.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
