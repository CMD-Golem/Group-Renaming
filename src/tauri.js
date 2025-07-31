function tauriInit() {
	// init tauri
	if (invoke == undefined) return;
	t.event.listen("files", loadFiles);



	// // ask before closing
	// t.window.getCurrentWindow().onCloseRequested(async (event) => {
	// 	if (unsaved_campaign) {
	// 		var user_action = await openDialog("unsaved_changes");
	
	// 		if (user_action == "dialog_yes") await saveCampaign();
	// 		else if (user_action == "dialog_cancel") event.preventDefault();
	// 	}
	// });
}