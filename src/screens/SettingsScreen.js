import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { primaryColor, errorColor, borderRadius } from '../constants/colors';
import StorageService from '../services/StorageService';
import RNFS from 'react-native-fs';

const SettingsScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [storageSize, setStorageSize] = useState(0);
  const [songCount, setSongCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load storage info
      const songs = await StorageService.loadSongs();
      const videos = await StorageService.loadVideos();
      
      setSongCount(songs.length);
      setVideoCount(videos.length);

      // Calculate storage size
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      setStorageSize(Math.round(totalSize / (1024 * 1024))); // Convert to MB

      // Load app version
      const packageJson = require('../../package.json');
      setAppVersion(packageJson.version);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would implement dark mode switching here
    Alert.alert('Hinweis', 'Dark Mode Toggle wird in der nächsten Version implementiert');
  };

  const clearAllData = () => {
    Alert.alert(
      'Alle Daten löschen',
      'Möchtest du wirklich alle Songs, Videos und Playlists löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              await loadSettings();
              Alert.alert('Erfolg', 'Alle Daten wurden gelöscht');
            } catch (error) {
              Alert.alert('Fehler', 'Konnte Daten nicht löschen');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (icon, title, subtitle, rightComponent) => (
    <View
      style={[
        styles.settingItem,
        { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
      ]}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={primaryColor} style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text
            style={[styles.settingTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.settingSubtitle, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#000000' : '#f2f2f7' },
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Einstellungen
        </Text>
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
          Darstellung
        </Text>
        {renderSettingItem(
          'dark-mode',
          'Dark Mode',
          'Dunkles Design aktivieren',
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: primaryColor }}
            thumbColor={darkMode ? '#ffffff' : '#f4f3f4'}
          />
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
          Speicher
        </Text>
        {renderSettingItem(
          'storage',
          'Speicherplatz',
          `${storageSize} MB genutzt`,
          null
        )}
        {renderSettingItem(
          'music-note',
          'Songs',
          `${songCount} Songs gespeichert`,
          null
        )}
        {renderSettingItem(
          'videocam',
          'Videos',
          `${videoCount} Videos gespeichert`,
          null
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
          Über
        </Text>
        {renderSettingItem(
          'info',
          'Version',
          appVersion,
          null
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
          Gefährlich
        </Text>
        <TouchableOpacity onPress={clearAllData}>
          {renderSettingItem(
            'delete-forever',
            'Alle Daten löschen',
            'Songs, Videos und Playlists entfernen',
            <Icon name="chevron-right" size={24} color={errorColor} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  settingsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: borderRadius,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 2,
  },
});

export default SettingsScreen;