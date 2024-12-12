use rodio::Source;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{mpsc, Arc};
use std::thread::JoinHandle;
use std::time::Duration;
use std::{io::BufReader, sync::Mutex};
use tauri::ipc::Channel;
use uuid::Uuid;

enum PlayerCommand {
    Load(String),
    Play,
    Pause,
    Seek(u64),
    Terminate,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum PlayerEvent {
    Playing,
    Paused,
    #[serde(rename_all = "camelCase")]
    PositionUpdate {
        position: u64,
        duration: u64,
    },
    Seeked {
        position: u64,
        // duration: u64,
    },
}

pub struct Player {
    /// Holds the sender end of the mpsc channel.
    /// Used by other threads to send commands to the player playback thread.
    playback_sender: Option<mpsc::Sender<PlayerCommand>>,
    /// Holds the join handle of the player playback thread.
    playback_join_handle: Option<JoinHandle<()>>,
    event_join_handle: Option<JoinHandle<()>>,
    subscribers: Arc<Mutex<HashMap<String, Channel<PlayerEvent>>>>,
}

impl Player {
    /// Spawn a new thread as player playback thread to handle player commands and rodio playback.
    fn spawn_playback_thread(&mut self, event_sender: mpsc::Sender<PlayerEvent>) {
        let (sender, receiver) = mpsc::channel::<PlayerCommand>();
        self.playback_sender = Some(sender); // Store the sender in the Player struct

        self.playback_join_handle = Some(std::thread::spawn(move || {
            let (_stream, handle) = rodio::OutputStream::try_default().unwrap();
            let sink = Arc::new(rodio::Sink::try_new(&handle).unwrap()); // A rodio::Sink to play the track
            let event_sender = Arc::new(event_sender);
            let total_duration = Arc::new(Mutex::new(Duration::from_secs(0)));

            let sink_cln = Arc::clone(&sink);
            let event_sender_cln = Arc::clone(&event_sender);
            let total_duration_cln = Arc::clone(&total_duration);
            std::thread::spawn(move || loop {
                event_sender_cln
                    .send(PlayerEvent::PositionUpdate {
                        position: sink_cln.get_pos().as_secs(),
                        duration: total_duration_cln.lock().unwrap().as_secs(),
                    })
                    .unwrap();
                std::thread::sleep(std::time::Duration::from_millis(100));
                // std::thread::sleep(std::time::Duration::from_millis(500));
            });

            'playback_receive_loop: loop {
                match receiver.recv().unwrap() {
                    PlayerCommand::Load(file_path) => {
                        sink.clear();
                        let file = std::fs::File::open(file_path).unwrap();
                        let source = rodio::Decoder::new(BufReader::new(file)).unwrap();
                        let mut duration_guard = total_duration.lock().unwrap();
                        *duration_guard = source.total_duration().unwrap();
                        event_sender.send(PlayerEvent::Playing).unwrap();
                        sink.append(source);
                        sink.play();
                        // soundtrack.lock().unwrap().load(file_path);
                    }
                    PlayerCommand::Play => {
                        event_sender.send(PlayerEvent::Playing).unwrap();
                        // soundtrack.lock().unwrap().play();
                        sink.play();
                    }
                    PlayerCommand::Pause => {
                        event_sender.send(PlayerEvent::Paused).unwrap();
                        // soundtrack.lock().unwrap().pause();
                        sink.pause();
                    }
                    PlayerCommand::Seek(position) => {
                        // soundtrack.lock().unwrap().seek(position);
                        sink.try_seek(Duration::from_secs(position)).unwrap();
                        event_sender.send(PlayerEvent::Seeked { position: position }).unwrap();
                    }
                    PlayerCommand::Terminate => {
                        break 'playback_receive_loop;
                    }
                }
            }
        }));
    }

    fn spawn_event_thread(&mut self, receiver: mpsc::Receiver<PlayerEvent>) {
        let subscribers = self.subscribers.clone();
        self.event_join_handle = Some(std::thread::spawn(move || {
            // 'event_receive_loop:
            loop {
                let event = receiver.recv().unwrap();
                let subscribers_lock = subscribers.lock().unwrap();
                for subscriber in subscribers_lock.values() {
                    subscriber.send(event.clone()).unwrap()
                }
                drop(subscribers_lock);
            }
        }));
    }

    // fn spawn_pos_sender_thread(&self, soundtrack: Arc<Mutex<Sound>>) {
    //     std::thread::spawn(move || {
    //         loop {
    //             let soundtrack = soundtrack.lock();
    //             // soundtrack.as_ref().unwrap().send_position_event();
    //             std::thread::sleep(Duration::from_millis(1000));
    //             drop(soundtrack);
    //         }
    //     });
    // }

    /// Get the sender of the player command channel
    fn get_channel(&self) -> &mpsc::Sender<PlayerCommand> {
        match self.playback_sender.as_ref() {
            Some(sender) => sender,
            None => panic!("Playback thread has not been spawned yet!"),
        }
    }

    /// Terminate the player thread
    /// 1. Send a terminate command to the player thread
    /// 2. Wait for the player thread to exit
    /// 3. Clear the members
    fn terminate(&mut self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Terminate).unwrap(); // Send the terminate command to break the receive loop

        if self.playback_join_handle.is_some() {
            let join_handle = self.playback_join_handle.take().unwrap();
            join_handle.join().unwrap()
        }

        self.playback_sender = None;
    }

    // Public methods(open APIs)

    /// Player API: Spawn a new player thread, create and return the `Player` object
    pub fn spawn() -> Self {
        let mut player = Player {
            playback_sender: None,
            playback_join_handle: None,
            event_join_handle: None,
            subscribers: Arc::new(Mutex::new(HashMap::new())),
        };

        let (sender, receiver) = mpsc::channel::<PlayerEvent>();

        player.spawn_playback_thread(sender);

        player.spawn_event_thread(receiver);

        player
    }

    /// Player API: Load a track into the player track queue
    pub fn load(&self, file_path: &str) {
        let sender = self.get_channel();
        sender
            .send(PlayerCommand::Load(file_path.to_string()))
            .unwrap(); // It could error
    }

    /// Player API: Play the track in the player track queue
    pub fn play(&self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Play).unwrap();
    }

    /// Player API: Pause the track in the player track queue
    pub fn pause(&self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Pause).unwrap();
    }

    pub fn seek(&self, position: u64) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Seek(position)).unwrap();
    }

    /// Subscribe to player events, return the subscription id
    pub fn subscribe_event(&mut self, channel: Channel<PlayerEvent>) -> String {
        let uuid = Uuid::new_v4().to_string();
        self.subscribers
            .lock()
            .unwrap()
            .insert(uuid.clone(), channel);

        uuid
    }

    pub fn unsubscribe_event(&mut self, id: String) -> bool {
        self.subscribers.lock().unwrap().remove(&id).is_some()
    }
}

impl Drop for Player {
    fn drop(&mut self) {
        // When dropped, called the `terminate` method to kill the main player thread
        self.terminate();
    }
}
