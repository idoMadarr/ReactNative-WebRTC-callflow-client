import React, {useEffect} from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  View,
} from 'react-native';
import {navigate} from '../utils/navigationRef';
import TextElement from '../components/TextElement';
import * as Colors from '../assets/colors/palette.json';
import connection from '../utils/connection';

const InitScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      serverReady();
    }, 2500);
  }, []);

  const serverReady = async () => {
    try {
      const response = await fetch(`${connection}/init`);
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
      <StatusBar barStyle={'dark-content'} backgroundColor={Colors.white} />
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.icon}
      />
      <TextElement fontSize={'xl'} fontWeight={'bold'}>
        CallFlow
      </TextElement>
      <TextElement cStyle={styles.desc}>
        A video call application enables users to connect and communicate
        through real-time video and audio streaming.
      </TextElement>
      <View style={styles.line} />
      <ActivityIndicator size={'large'} color={Colors.primary} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  icon: {
    width: Dimensions.get('window').width * 0.26,
    height: Dimensions.get('window').width * 0.26,
    marginBottom: '2%',
  },
  desc: {
    paddingHorizontal: '6%',
    textAlign: 'center',
    marginVertical: '4%',
  },
  line: {
    height: 1,
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.primary,
    marginBottom: '6%',
  },
});

export default InitScreen;
