use std::io::BufReader;

#[tauri::command]
pub fn play_track(file_path: &str) {
    println!(
        "DEBUG: command::play_track invoked with argument:\n
            name = {}.", file_path
    );

    // Copy from https://github.com/RustAudio/rodio/blob/master/examples
    let (_stream, handle) = rodio::OutputStream::try_default().unwrap();
    let sink = rodio::Sink::try_new(&handle).unwrap();

    let file = std::fs::File::open(file_path).unwrap();
    sink.append(rodio::Decoder::new(BufReader::new(file)).unwrap());

    sink.sleep_until_end();
}
