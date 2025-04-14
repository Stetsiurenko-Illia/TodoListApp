import { AppRegistry } from 'react-native';
import Navigator from './navigation/Navigator';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => Navigator);
