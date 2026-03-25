import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TrackPlayer from 'react-native-track-player';
import { primaryColor } from './src/constants/colors';

// Import screens
import LibraryScreen from './src/screens/LibraryScreen';
import SearchScreen from './src/screens/SearchScreen';
import VideosScreen from './src/screens/VideosScreen';
import PlaylistsScreen from './src/screens/PlaylistsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function TabBar({ state, descriptors, navigation }) {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      <View
        style={[
          styles.blurView,
          { backgroundColor: isDarkMode ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const getIconName = (routeName) => {
          switch (routeName) {
            case 'Library':
              return 'library-music';
            case 'Search':
              return 'search';
            case 'Videos':
              return 'videocam';
            case 'Playlists':
              return 'queue-music';
            case 'Settings':
              return 'settings';
            default:
              return 'help';
          }
        };

        return (
          <View key={index} style={styles.tabItem}>
            <Icon
              name={getIconName(route.name)}
              size={24}
              color={isFocused ? primaryColor : isDarkMode ? '#8e8e93' : '#8e8e93'}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          </View>
        );
      })}
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Initialize TrackPlayer
    const setupTrackPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({
          waitForBuffer: true,
        });
      } catch (error) {
        console.error('Error setting up TrackPlayer:', error);
      }
    };

    setupTrackPlayer();

    // Cleanup on unmount
    return () => {
      TrackPlayer.destroy();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <TabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen name="Library" component={LibraryScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Videos" component={VideosScreen} />
          <Tab.Screen name="Playlists" component={PlaylistsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
});

export default App;
