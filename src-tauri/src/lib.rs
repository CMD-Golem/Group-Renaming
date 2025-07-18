use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_updater::Builder::new().build())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_window_state::Builder::new().build())
		.plugin(tauri_plugin_fs::init())
		.setup(|app| {
			let handle = app.handle().clone();
			tauri::async_runtime::spawn(async move {
				if let Ok(Some(update)) = handle.updater().unwrap().check().await {
					update.download_and_install(|_, _| {}, || {}).await.unwrap();
					handle.restart();
				}
			});

			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
