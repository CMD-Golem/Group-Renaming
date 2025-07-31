const t = window.__TAURI__;
const invoke = window.__TAURI__.core.invoke;

const main = document.querySelector("main");
const create_group = document.getElementById("create_group");
const default_group = document.getElementById("default_group");
const css_root = document.querySelector(":root");

function globalInit() {
	if (invoke != undefined) tauriInit();

	var dragable_elements = document.getElementsByTagName("file");
	var drag_containers = document.getElementsByTagName("group");

	for (var i = 0; i < drag_containers.length; i++) groupInit(drag_containers[i]);
	for (var i = 0; i < dragable_elements.length; i++) fileInit(dragable_elements[i]);

	// preview size
	var preview_size = window.localStorage.getItem("preview_size");
	
	if (preview_size == null) preview_size = 100;

	document.getElementById("preview_size").value = preview_size;
	css_root.style.setProperty('--file-width', preview_size);
}

globalInit();


// general functions
function openDialog(id, additional_info) {
	return new Promise((resolve) => {
		dialog.open = true;

		active_error_dialog = error_msg.find(function(item) { return item.id == id; });

		if (active_error_dialog.title != undefined) dialog.children[0].innerHTML = active_error_dialog.title;
		else dialog.children[0].style.display = "none";

		var msg = active_error_dialog.msg.replace("${additional_info}", additional_info);
		dialog.children[1].innerHTML = msg;

		for (var i = 0; i < active_error_dialog.buttons.length; i++) {
			var button = document.getElementById(active_error_dialog.buttons[i]);
			button.style.display = "inline-block";

			button.addEventListener("click", (e) => {
				resolve(e.target.id);

				dialog.open = false;
				dialog.children[0].style.display = "block";

				var buttons = dialog.getElementsByTagName("button");
				for (var i = 0; i < buttons.length; i++) {
					buttons[i].style.display = "none";
				}
			});
		}
	});
}