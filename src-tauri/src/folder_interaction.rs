use tauri::{AppHandle, WebviewWindow, Emitter};
use tauri_plugin_dialog::DialogExt;
use std::fs;
use serde::Serialize;


#[tauri::command]
pub fn select_folder(app: AppHandle, window: WebviewWindow) {
	app.dialog().file().pick_folder(move |folder_path| {
		match folder_path {
			Some(path) => load_folder(app, window, &path.to_string()),
			None => window.close().unwrap(),
		}
	});
}

pub fn load_folder(app: AppHandle, window: WebviewWindow, dir: &str) {
	let files = get_files(dir);
	match files {
		Ok(files) => app.emit("files", &files).unwrap(),
		Err(_) => window.close().unwrap(),
	}
}

const FILE_TYPES: [&str; 10] = ["avif", "bmp", "gif", "jfif", "jpeg", "jpg", "png", "svg", "tiff", "webp"];

#[derive(Serialize)]
pub struct ExportFolder {
	dir: String,
	files: Vec<String>,
}

impl Default for ExportFolder {
	fn default() -> Self {
		Self {
			dir: String::new(),
			files: Vec::new(),
		}
	}
}

#[tauri::command]
pub fn get_files(dir: &str) -> Result<ExportFolder, std::io::Error> {
	let mut object = ExportFolder::default();
	object.dir = dir.to_string();

	for entry in fs::read_dir(dir)? {
		let path = entry?.path();
		let extension = match path.extension().and_then(|os_str| os_str.to_str()) {
			Some(ext) => ext,
			None => continue,
		};

		let file_name = match path.file_name().and_then(|os_str| os_str.to_str()) {
			Some(name) => name,
			None => continue,
		};

		if FILE_TYPES.contains(&extension) {
			object.files.push(file_name.to_string());
		}
	}

	return Ok(object);
}

#[tauri::command]
pub fn rename_files(dir: &str) -> Result<ExportFolder, std::io::Error> {
	
}