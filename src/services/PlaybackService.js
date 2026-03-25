import TrackPlayer, { Event } from 'react-native-track-player';

export default async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    // Implement next track logic
    // For now, just replay current track
    TrackPlayer.seekTo(0);
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    // Implement previous track logic
    // For now, just replay current track
    TrackPlayer.seekTo(0);
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    const position = await TrackPlayer.getPosition();
    const duration = await TrackPlayer.getDuration();
    const newPosition = Math.min(duration, position + (event.interval || 15));
    TrackPlayer.seekTo(newPosition);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    const position = await TrackPlayer.getPosition();
    const newPosition = Math.max(0, position - (event.interval || 15));
    TrackPlayer.seekTo(newPosition);
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, (event) => {
    if (event.paused) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  });

  // Handle playback state changes
  TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
    // You can handle playback state changes here
    console.log('Playback state changed:', data.state);
  });

  // Handle track changes
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
    // You can handle track changes here
    console.log('Track changed:', data.nextTrack);
  });
}