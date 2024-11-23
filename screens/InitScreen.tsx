import React, {useEffect} from 'react';
import {
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {navigate} from '../utils/navigationRef';
import TextElement from '../components/TextElement';

const InitScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      serverReady();
    }, 2500);
  }, []);

  const serverReady = async () => {
    try {
      const response = await fetch('https://callflow-server.onrender.com/init');
      const data = (await response.json()) as boolean;
      if (data) navigate('lobbie');
    } catch (error) {
      Alert.alert(
        'Server Error:',
        `There is a problem with the running server: ${error}`,
      );
    }
  };

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
