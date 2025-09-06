const t = window.__TAURI__;
const invoke = window.__TAURI__?.core.invoke;

const css_root = document.querySelector(":root");
const body = document.querySelector("body");
const main = document.querySelector("main");
const dialog = document.querySelector("dialog");
const context_menu = document.querySelector("contextmenu");
const create_group = document.getElementById("create_group");
const dragmap = document.getElementById("dragmap");
var unsaved_changes = false; // is set in: dragEnd, renameGroup, renameManuall, applyFileNames; is reset in storeConfig
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
	error: "Fehlermeldung",
	current_name: "Dateiname",
	new_name: "Angefordeter neuer Name",
	renaming_success: "Alle Dateien wurden erfolgreich umbenannt",
	renaming_with_problems: "Dateien wurden umbenannt<br>Folgende Dateien konnten nicht umbenannt werden:",
	config_stored: "Die Konfiguration wurde erfolgreich gespeichert",
	config_restored: "Die Konfiguration wurde erfolgreich wiederhergestellt",
}

function globalInit() {
	groupInit(document.getElementById("create_group"));
	cleanUp();

	// preview size
	var preview_size = window.localStorage.getItem("preview_size");
	if (preview_size == null) preview_size = 100;

	document.getElementById("preview_size").value = preview_size;
	css_root.style.setProperty('--file-width', preview_size + "px");

	body.addEventListener("click", () => {
		context_menu.classList.remove("visible");
	});

	// tauri
	if (t != undefined) {
		t.event.listen("files", loadData);

		// ask before closing
		t.window.getCurrentWindow().onCloseRequested((event) => {
			if (unsaved_changes) {
				event.preventDefault();

				dialog.innerHTML = `
					<p>Die Änderungen wurden nicht gespeichert.</p>
					<p>Soll die Konfiguration gespeichert werden?</p>
					<div onclick="cleanDialog()">
						<button onclick="storeConfig(); t.window.getCurrentWindow().destroy()">Ja</button>
						<button onclick="t.window.getCurrentWindow().destroy()">Nein</button>
						<button>Abbrechen</button>
					</div>
				`;
				dialog.showModal();
			}
		});
	};
}

function loadData(msg) {
	var object = msg.payload;
	if (object.status == "error") {
		dialog.innerHTML = `<p>${object.error}</p><button onclick="cleanDialog()">Ok</button>`;
		dialog.showModal();
		return;
	}

	cleanUp();
	file_path = object.dir;
	
	loadGroup();
	loadFiles(object.files);
	if (object.config != null) {
		var config = JSON.parse(object.config);
		loadConfig(config);
	}
}

function cleanUp() {
	main.innerHTML = "";
	dragmap.innerHTML = "";
	default_group = undefined;
	file_path = undefined;
	contextmenu_selected = undefined;
	current_file_names = [];
	group_counter = 0;
	file_counter = 0;
}

globalInit();


function cleanDialog() {
	dialog.close();
	dialog.innerHTML = "";
}