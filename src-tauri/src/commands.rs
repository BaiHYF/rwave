#[tauri::command]
pub fn greet(name: &str) -> String {
  println!("DEBUG: command::greet invoked.");
  format!("Hello, {}!", name)
}