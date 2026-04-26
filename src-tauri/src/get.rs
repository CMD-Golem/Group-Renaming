use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use std::{fs, path::Path};
use serde::Serialize;

const FILE_TYPES: [&str; 14] = ["apng", "avif", "bmp", "cur", "gif", "ico", "jfif", "jpeg", "jpg", "pjp", "pjpeg", "png", "svg", "webp"];

#[derive(Serialize, Clone)]
struct ExportFolder {
	status: &'static str,
	dir: String,
	config: Option<String>,
	files: Vec<ExportFiles>,
}

#[derive(Serialize, Clone)]
struct ExportFiles {
	name: String,
	date: u128,
}

impl ExportFolder {
	fn new(dir: &str) -> Self {
		Self {
			status: "success",
			dir: dir.to_string(),
			config: None,
			files: Vec::new(),
		}
	}
}

#[derive(Serialize, Clone)]
struct ReportError {
	status: &'static str,
	error: String,
}

#[tauri::command]
pub fn select_folder(app: AppHandle, window: WebviewWindow) {
	app.dialog().file().pick_folder(move |folder_path| {
		match folder_path {
			Some(path) => load_folder(app, &path.to_string()),
			None => window.close().unwrap(),
		}
	});
}

pub fn load_folder(app: AppHandle, dir: &str) {
	let response = get_files(app.clone(), dir);
	match response {
		Ok(object) => app.emit("files", object).unwrap(),
		Err(err) => {
			let payload = ReportError{
				status: "error",
				error: err.to_string(),
			};
			app.emit("files", payload).unwrap()
		}
	}
}

fn get_files(app: AppHandle, dir: &str) -> Result<ExportFolder, std::io::Error> {
	let mut object = ExportFolder::new(dir);

	// add folder to tauri scope
	let _ = app.asset_protocol_scope().allow_directory(dir, false);

	// get config if it exists
	let config_path = Path::new(dir).join(".group-renaming.conf.json");
	if config_path.try_exists()? {
		object.config = Some(fs::read_to_string(&config_path)?);
	}

	// send files to frontend
	for entry in fs::read_dir(dir)? {
		let path = entry?.path();

		if path.is_dir() { continue; }

		// check if file is an image
		let extension = match infer::get_from_path(&path)? {
			Some(ext) => ext.extension(),
			None => continue,
		};

		if !FILE_TYPES.contains(&extension) { continue; }

		// get filename
		let file_name = match path.file_name().and_then(|os_str| os_str.to_str()) {
			Some(name) => name.to_string(),
			None => continue,
		};

		// get file date
		let modified_date = match fs::metadata(path)?.modified()?.duration_since(std::time::SystemTime::UNIX_EPOCH) {
			Ok(n) => n.as_millis(),
			Err(_) => 0
		};

		let file = ExportFiles{
			name: file_name,
			date: modified_date,
		};

		object.files.push(file);

		// compress jpeg: mozjpeg .set_scale(1, 4);
	}

	return Ok(object);
}
