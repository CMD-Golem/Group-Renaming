use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use std::fs;

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

	// rename to temp file name and remove errors from renaming
	let mut res = Response::new();

	files.retain(|file| {
		let current = format!("{}\\{}", dir, file.current);
		let temp = format!("{}\\~${}.tmp", dir, file.current);


		// check if file already exists
		// let exists = fs::exists(temp);

		// rename
		let renaming = fs::rename(current, temp);
		match renaming {
			Ok(_) => true,
			Err(e) => {
				let error = e.to_string();
				let response_folder = ResponseFolder {status:error, current: file.current.clone(), new: file.new.clone()};
				res.errors.push(response_folder);
				false
			}
		}
	});

	// rename to final name
	for file in files {
		let renaming = fs::rename(format!("{}\\~${}.tmp", dir, file.current), format!("{}\\{}", dir, file.new));
		match renaming {
			Ok(_) => (),
			Err(e) => {
				let error = e.to_string();
				let response_folder = ResponseFolder {status:error, current: file.current, new: file.new};
				res.errors.push(response_folder);
			}
		}
	}

	match serde_json::to_string(&res) {
		Ok(json) => json,
		Err(e) => format!("{{\"status\":\"error\", \"error\":\"{e}\"}}"),
	}
}