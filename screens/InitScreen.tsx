import React, {useEffect} from 'react';
import {
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {navigate} from '../utils/navigationRef';
import TextElement from '../components/TextElement';

const InitScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      navigate('lobbie');
    }, 2500);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'white'} />
      <TextElement>Welcome to CallFlow</TextElement>
      <TextElement>Nina Tracker</TextElement>
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
