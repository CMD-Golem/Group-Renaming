use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use std::fs;

#[derive(Deserialize)]
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
	status: &'static str,
	current: &'static str,
	new: &'static str
}

impl Response {
	fn new() -> Self {
		Self {
			status: "had errors",
			errors: Vec::new(),
		}
	}
}



#[tauri::command]
pub fn rename_files(app: AppHandle, dir: &str, files: Vec<RenameFolder>) -> Result<&str, std::io::Error> {
	if app.asset_protocol_scope().is_forbidden(dir) {
		return Ok("{\"status\":\"Path is not allowed\"}");
	}

	let mut res = Response::new();

	for file in files {
		let renaming = fs::rename(file.current, file.new);
		match renaming {
			Ok(_) => println!("Renamed file"),
			Err(e) => {
				let error = e.to_string();
				let response_folder = ResponseFolder {status:&error, current: &file.current, new: &file.new};
				res.errors.push(response_folder);
			}
		}
	}

	return Ok("tes");
}