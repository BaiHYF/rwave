// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// #[macro_use]
extern crate serde_derive;

fn main() {
    app_lib::run();
}
