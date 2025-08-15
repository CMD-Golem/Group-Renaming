const t = window.__TAURI__;
const invoke = window.__TAURI__?.core.invoke;

const css_root = document.querySelector(":root");
const main = document.querySelector("main");
const dialog = document.querySelector("dialog");
const create_group = document.getElementById("create_group");
var default_group = document.getElementById("default_group");
var duplicate_wants_renaming = [];
var file_path = undefined;

const translations = {
	duplicate_title: "Dateiname ist bereits in Verwendung",
	duplicate_message: "Wähle das Bild aus, dass aus seiner Gruppe entfernt werden soll und wieder seinen originalen Namen erhalten soll.",
	duplicate_standard: "Es befindet sich bereits eine Datei desselben Names an diesem Ort.<br>Geben Sie einen neuen Namen ein:",
}

function globalInit() {
	if (t != undefined) {
		t.event.listen("files", loadFiles);

		// // ask before closing
		// t.window.getCurrentWindow().onCloseRequested(async (event) => {
		// 	if (unsaved_campaign) {
		// 		var user_action = await openDialog("unsaved_changes");
		
		// 		if (user_action == "dialog_yes") await saveCampaign();
		// 		else if (user_action == "dialog_cancel") event.preventDefault();
		// 	}
		// });
	};

	var drag_containers = document.getElementsByTagName("group");
	for (var i = 0; i < drag_containers.length; i++) groupInit(drag_containers[i]);

	// preview size
	var preview_size = window.localStorage.getItem("preview_size");
	if (preview_size == null) preview_size = 100;

	document.getElementById("preview_size").value = preview_size;
	css_root.style.setProperty('--file-width', preview_size);
}

globalInit();


function clean_dialog() {
	dialog.close();
	dialog.innerHTML = "";
}