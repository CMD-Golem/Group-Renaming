use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;
use std::env;

mod folder_interaction;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			folder_interaction::select_folder
		])
		.plugin(tauri_plugin_updater::Builder::new().build())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_window_state::Builder::new().build())
		.plugin(tauri_plugin_fs::init())
		.setup(|app| {
			// updater
			let handle = app.handle().clone();
			tauri::async_runtime::spawn(async move {
				if let Ok(Some(update)) = handle.updater().unwrap().check().await {
					update.download_and_install(|_, _| {}, || {}).await.unwrap();
					handle.restart();
				}
			});

			// read folder for the first time
			let window = app.get_webview_window("main").unwrap();
			let args: Vec<String> = env::args().collect();

			if args.len() <= 1 {
				folder_interaction::select_folder(app.handle().clone(), window);
			}
			else {
				folder_interaction::load_folder(app.handle().clone(), &args[1]);
			}

			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
