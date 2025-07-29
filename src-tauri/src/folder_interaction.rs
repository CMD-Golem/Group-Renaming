use tauri::{AppHandle, WebviewWindow, Emitter};
use tauri_plugin_dialog::DialogExt;
use std::fs;
use serde::Serialize;
use mozjpeg::Decompress;


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
		Ok(_) => app.emit("files", "{\"response\":\"finished\"}").unwrap(),
		Err(err) => app.emit("files", format!("{{\"response\":\"error\", \"error\":\"{:?}\"}}", err)).unwrap(),
	}
}

const FILE_TYPES: [&str; 14] = ["apng", "avif", "bmp", "cur", "gif", "ico", "jfif", "jpeg", "jpg", "pjp", "pjpeg", "png", "svg", "webp"];
const JPEG_TYPES: [&str; 5] = ["jfif", "jpeg", "jpg", "pjp", "pjpeg"];

#[derive(Serialize)]
pub struct ExportFolder<'a> {
	response: &'static str,
	name: &'a str,
	data: Vec<u8>,
}

impl<'a> ExportFolder<'a> {
	fn new(name: &'a str) -> Self {
		Self {
			response: "streaming",
			name: name,
			data: Vec::new(),
		}
	}
}

#[tauri::command]
pub fn get_files(app: AppHandle, dir: &str) -> Result<(), std::io::Error> {
	app.emit("files", format!("{{\"response\":\"started\", \"path\":\"{:?}\"}}", dir.to_string())).unwrap();

	for entry in fs::read_dir(dir)? {

		// check if file is an image
		let path = entry?.path();
		let extension = match path.extension().and_then(|os_str| os_str.to_str()) {
			Some(ext) => ext,
			None => continue,
		};

		if !FILE_TYPES.contains(&extension) { continue; }

		// get filename
		let file_name = match path.file_name().and_then(|os_str| os_str.to_str()) {
			Some(name) => name,
			None => continue,
		};

		let mut object = ExportFolder::new(file_name);

		// handle jpegs
		if JPEG_TYPES.contains(&extension) {
			let data = std::fs::read(path)?;
			let mut decomp = Decompress::new_mem(&jpeg_data)?;

			decomp.set_scale(1, 4);
			decomp.read_header()?;
			decomp.start_decompress()?;

			let width = decomp.width() as usize;
			let height = decomp.height() as usize;

			// Read RGB scanlines (Vec<[u8; 3]>)
			let scanlines = decomp.read_scanlines::<[u8; 3]>()?;
			
			// Flatten to a Vec<u8> (RGB packed)
			let rgb_data = scanlines.concat().into_iter().flat_map(|rgb| rgb).collect();

		}

		// get image




		app.emit("files", "{\"response\":\"finished\"}").unwrap()
	}

	return Ok(());
}

#[tauri::command]
pub fn rename_files(dir: &str) {
	
}