const t = window.__TAURI__;
const invoke = window.__TAURI__?.core.invoke;

const css_root = document.querySelector(":root");
const body = document.querySelector("body");
const main = document.querySelector("main");
const dialog = document.querySelector("dialog");
const context_menu = document.querySelector("contextmenu");
const create_group = document.getElementById("create_group");
const dragmap = document.getElementById("dragmap");
var default_group = undefined;
var file_path = undefined;
var contextmenu_selected = undefined;
var current_file_names = [];

const translations = {
	duplicate_title: "Dateiname ist bereits in Verwendung",
	duplicate_1: "Wähle das Bild aus, das einen anderen Namen erhalten soll.",
	duplicate_2: "Hier den neuen Namen eingeben. Wenn kein :g eingetragen ist, wird die Datei aus der Gruppe entfernt, sofern sie in einer ist.",
	duplicate_3: "Neuer Name überprüfen",
	duplicate_message: "Wähle das Bild aus, dass aus seiner Gruppe entfernt werden soll und wieder seinen originalen Namen erhalten soll.",
	duplicate_standard: "Es befindet sich bereits eine Datei desselben Names an diesem Ort.<br>Geben Sie einen neuen Namen ein:",
	new_group: "Neue Gruppe",
	default_group: "Standard Ablage",
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
	groupInit(document.getElementById("create_group"));

	// preview size
	var preview_size = window.localStorage.getItem("preview_size");
	if (preview_size == null) preview_size = 100;

	document.getElementById("preview_size").value = preview_size;
	css_root.style.setProperty('--file-width', preview_size);

	body.addEventListener("click", () => {
		context_menu.classList.remove("visible");
	});
}

globalInit();


function clean_dialog() {
	dialog.close();
	dialog.innerHTML = "";
}