## Rwave

Rwave is a music player application focused on simplicity and efficiency. It is built using Rust for backend logic and React for the frontend UI, leveraging the Tauri framework to create a seamless desktop experience.

## Features

- **Database Management**: Efficiently handles music library through a local SQLite database.
- **MP3 Tag Parsing**: Extracts and displays metadata such as title, artist, and album from MP3 files.
- **Basic Frontend Structure**: Includes essential components like header, track list, and player controls.

## Next Steps

- Enhance the user interface with more interactive elements.
- Implement advanced audio playback features.
- Optimize performance and ensure stability.

## Getting Started

### Download Release
Download the latest release from the [Releases](https://github.com/BaiHYF/rwave/releases) page.

### Build from Source
#### On Windows
1. Check dependencies:
    You should have the following installed: 
    - `nodejs`, better v22.11.0, versions higher than that may cause some problems when building. 
      ```sh
      ❯ node --version
      v22.11.0
      ```
    - `npm` >= 10.9.2
      ```sh
      ❯ npm --version
      10.9.2  
      ``` 
    - `cargo` and `rustc` >= 1.82.0, stable
      ```sh
      ❯ cargo --version
      cargo 1.82.0
      ❯ rustc --version
      rustc 1.82.0
      ```
2. Clone the repository:
   ```sh
   git clone https://github.com/BaiHYF/rwave.git
   ```
3. Build the app:
   ```sh
   cd rwave
   npm install 
   npm run tauri build
   ```
4. Finally you can have the set-up.exe in `rwave/src-tauri/target/release/bundle/nsis/`
   ```sh
   cd 'src-tauri\target\release\bundle\nsis'
    .\rwave-x64-setup.exe
   ```
5. Follow the instructions to install the app.


### Uninstall
Simply go to the app's folder and run `uninstall.exe`.