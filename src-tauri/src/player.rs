use std::io::BufReader;
use std::sync::mpsc;
use std::thread::JoinHandle;

enum PlayerCommand {
    Load(String),
    Play,
    Pause,
    Terminate,
}

pub struct Player {
    /// Holds the sender end of the mpsc channel.
    /// Used by other threads to send commands to the player main thread.
    sender: Option<mpsc::Sender<PlayerCommand>>,
    /// Holds the join handle of the player main thread.
    join_handle: Option<JoinHandle<()>>,
}

impl Player {
    /// Spawn a new thread as player main thread to handle player commands and rodio playback.
    fn spawn_thread(&mut self) {
        // Create a mpsc channel to hold player commands.
        // The sender is used by other threads to send commands to the player main thread.
        // The receiver is held only by the main player thread, receives commands from the public methods
        let (sender, receiver) = mpsc::channel::<PlayerCommand>();
        self.sender = Some(sender); // Store the sender in the Player struct

        // Spawn a new thread to handle the player commands (as main player thread), 
        // and store its join handle in `self.join_handle`.
        // In this thread, create a rodio::sink to play tracks.
        // Then there is a receive loop, whenever a command is received, operate the rodio::sink.
        // We use the `recv` method of the mpsc::Receiver here, to block the thread when here is nothing
        // to receive in the channel, which would also let the sink play in the background.
        self.join_handle = Some(std::thread::spawn(move || {
            let (_stream, handle) = rodio::OutputStream::try_default().unwrap();
            let sink = rodio::Sink::try_new(&handle).unwrap();
            'player_receive_loop: loop {
                // Will block the current thread if there is no data to receive
                match receiver.recv().unwrap() {
                    PlayerCommand::Load(file_path) => {
                        // Load the track into the player
                        println!("Player: load {}", file_path);
                        let file = std::fs::File::open(file_path).unwrap();
                        sink.append(rodio::Decoder::new(BufReader::new(file)).unwrap());
                        sink.pause(); // sink would play immediately after there is a track
                                      // in the queue. We pause it to forbid auto play.
                    }
                    PlayerCommand::Play => {
                        println!("Player: play, {} song remains in queue", sink.len());
                        sink.play();
                    }
                    PlayerCommand::Pause => {
                        println!("Player: pause, {} song remains in queue", sink.len());
                        sink.pause();
                    }
                    // When receive terminate, break the loop, release all resources, then the
                    // main player thread would be killed (exit).
                    PlayerCommand::Terminate => {
                        println!("Player: terminate");
                        break 'player_receive_loop;
                    }
                }
            }
        }));
    }

    /// Get the sender of the player command channel
    fn get_channel(&self) -> &mpsc::Sender<PlayerCommand> {
        match self.sender.as_ref() {
            Some(sender) => sender,
            None => panic!("Player has not been spawned yet!"),
        }
    }

    /// Terminate the player thread
    /// 1. Send a terminate command to the player thread
    /// 2. Wait for the player thread to exit
    /// 3. Clear the members
    fn terminate(&mut self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Terminate).unwrap(); // Send the terminate command to break the receive loop

        if self.join_handle.is_some() {
            let join_handle = self.join_handle.take().unwrap();
            join_handle.join().unwrap()
        }

        self.sender = None;
    }

    // Public methods(open APIs)

    /// Player API: Spawn a new player thread, create and return the `Player` object
    pub fn spawn() -> Self {
        let mut player = Player {
            sender: None,
            join_handle: None,
        };
        player.spawn_thread();

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
}

impl Drop for Player {
    fn drop(&mut self) {
        // When dropped, called the `terminate` method to kill the main player thread
        self.terminate();
    }
}
