import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (screen: string, payload?: any) => {
  // @ts-ignore:
  navigationRef.navigate(screen, payload);
};

export const goBack = () => navigationRef.goBack();
