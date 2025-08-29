use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use std::{fs, path::Path};

#[derive(Deserialize, Debug)]
pub struct RenameFolder {
	current: String,
	new: String,
}

#[derive(Serialize)]
pub struct Response {
	status: &'static str,
	errors: Vec<ResponseFolder>,
}

#[derive(Serialize)]
pub struct ResponseFolder {
	status: String,
	current: String,
	new: String
}

impl Response {
	fn new() -> Self {
		Self {
			status: "success",
			errors: Vec::new(),
		}
	}
}

#[tauri::command]
pub fn rename_files(app: AppHandle, dir: &str, mut files: Vec<RenameFolder>) -> String {
	if app.asset_protocol_scope().is_forbidden(dir) {
		return "{\"status\":\"error\", \"error\":\"Path is not allowed\"}".to_string();
	}

	let mut res = Response::new();
	let dir_path = Path::new(dir);

	// rename to temp name
	files.retain(|file| {
		let current = dir_path.join(&file.current);
		let temp = dir_path.join(format!("~${}.tmp", file.current));
		let new = dir_path.join(&file.new);

		if !file_exists(&temp, &mut res, &file) { return false; }
		if !file_exists(&new, &mut res, &file) { return false; }

		match fs::rename(&current, &temp) {
			Ok(_) => true,
			Err(e) => error_array(e.to_string(), &mut res, &file),
		}
	});

	// rename to final name
	for file in files {
		let temp = dir_path.join(format!("~${}.tmp", file.current));
		let new = dir_path.join(&file.new);

		if !file_exists(&new, &mut res, &file) { continue; }

		let _ = match fs::rename(&temp, &new) {
			Ok(_) => true,
			Err(e) => error_array(e.to_string(), &mut res, &file),
		};
	}

	match serde_json::to_string(&res) {
		Ok(json) => json,
		Err(e) => format!("{{\"status\":\"error\", \"error\":\"{e}\"}}"),
	}
}

fn file_exists(path: &Path, res: &mut Response, file: &RenameFolder) -> bool {
	match path.try_exists() {
		Ok(false) => true,
		Ok(true) => error_array("File already exists".to_string(), res, file),
		Err(e) => error_array(e.to_string(), res, file),
	}
}

fn error_array(error: String, res: &mut Response, file: &RenameFolder) -> bool {
	let response = ResponseFolder {
		status: error,
		current: file.current.clone(),
		new: file.new.clone()
	};
	res.errors.push(response);
	return false;
}