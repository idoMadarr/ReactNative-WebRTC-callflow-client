import React, {useEffect} from 'react';
import {
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {navigate} from '../utils/navigationRef';

const InitScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      navigate('lobbie');
    }, 2500);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'white'} />
      <Text>Welcome to CallFlow</Text>
      <Text>Nina Tracker</Text>
      <ActivityIndicator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default InitScreen;
