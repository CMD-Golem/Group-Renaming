use tauri::{AppHandle, Manager};
use std::{
	fs,
	io::{Write, Error}
};

#[tauri::command]
pub fn store(app: AppHandle, dir: &str, config: &str) -> Result<String, String> {
	if app.asset_protocol_scope().is_forbidden(dir) {
		return Err("{\"status\":\"error\", \"error\":\"Path is not allowed\"}".to_string());
	}

	let mut file = fs::File::create(format!("{}\\.group-renaming.conf.json", dir)).map_err(handle_error)?;
	file.write_all(config.as_bytes()).map_err(handle_error)?;

	return Ok("{\"status\":\"success\"}".to_string());
}

#[tauri::command]
pub fn read(app: AppHandle, dir: &str) -> Result<String, String> {
	if app.asset_protocol_scope().is_forbidden(dir) {
		return Err("{\"status\":\"error\", \"error\":\"Path is not allowed\"}".to_string());
	}

	let file = fs::read_to_string(format!("{}\\.group-renaming.conf.json", dir)).map_err(handle_error)?;

	return Ok(format!("{{\"status\":\"success\", \"config\":{}}}", file));
}

fn handle_error(e: Error) -> String {
	format!("{{\"status\":\"error\",\"error\":\"{}\"}}", e.to_string())
}