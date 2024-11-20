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
    sender: Option<mpsc::Sender<PlayerCommand>>,
    join_handle: Option<JoinHandle<()>>,
}

impl Player {
    fn spawn_thread(&mut self) {
        let (sender, receiver) = mpsc::channel::<PlayerCommand>();
        self.sender = Some(sender); // Store the sender in the Player struct

        self.join_handle = Some(std::thread::spawn(move || {
            let (_stream, handle) = rodio::OutputStream::try_default().unwrap();
            let sink = rodio::Sink::try_new(&handle).unwrap();
            'player_receive_loop: loop {
                // Will block the current thread if there is no data available
                match receiver.recv().unwrap() {
                    PlayerCommand::Load(file_path) => {
                        // Load the track into the player
                        println!("Player: load {}", file_path);
                        let file = std::fs::File::open(file_path).unwrap();
                        sink.append(rodio::Decoder::new(BufReader::new(file)).unwrap());
                        sink.pause();
                    }
                    PlayerCommand::Play => {
                        // Play the loaded track
                        println!("Player: play, {} song remains in queue", sink.len());
                        sink.play();
                    }
                    PlayerCommand::Pause => {
                        // Pause the playing track
                        println!("Player: pause, {} song remains in queue", sink.len());
                        sink.pause();
                    }
                    PlayerCommand::Terminate => {
                        // Clean up and exit the thread
                        println!("Player: terminate");
                        break 'player_receive_loop;
                    }
                }
            }
        }));
    }

    fn get_channel(&self) -> &mpsc::Sender<PlayerCommand> {
        match self.sender.as_ref() {
            Some(sender) => sender,
            None => panic!("Player has not been spawned yet!"),
        }
    }

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

    pub fn spawn() -> Self {
        let mut player = Player {
            sender: None,
            join_handle: None,
        };
        player.spawn_thread();

        player
    }

    pub fn load(&self, file_path: &str) {
        let sender = self.get_channel();
        sender
            .send(PlayerCommand::Load(file_path.to_string()))
            .unwrap(); // It could error
    }

    pub fn play(&self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Play).unwrap();
    }

    pub fn pause(&self) {
        let sender = self.get_channel();
        sender.send(PlayerCommand::Pause).unwrap();
    }
}

impl Drop for Player {
    fn drop(&mut self) {
        self.terminate();
    }
}
