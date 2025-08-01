function fileInit(el) {
	el.draggable = true;

	el.addEventListener("dragstart", dragStart);
	el.addEventListener("dragend", dragEnd);
	el.addEventListener("click", selectFile);
}

function selectFile(e) {
	var current_state = e.currentTarget.classList.contains("selected_element");

	// deselect all if ctrl isnt pressed
	if (!e.ctrlKey) {
		var selected_elements = document.querySelectorAll(".selected_element");
		for (var i = 0; i < selected_elements.length; i++) {
			selected_elements[i].classList.remove("selected_element");
		}
	}

	// select multiple elements
	var all_elements = document.getElementsByTagName("file");
	var last_selected = document.querySelector(".last_selected_element");
	var iterate_toggle = false;

	if (e.shiftKey && last_selected != null) {
		for (var i = 0; i < all_elements.length; i++) {
			var element = all_elements[i];
			var found_selection = element.id == last_selected.id || element.id == e.currentTarget.id;

			// select element
			if (!iterate_toggle && !found_selection) continue;

			if (!current_state) element.classList.add("selected_element");
			else element.classList.remove("selected_element");

			// stop selecting elements
			if (found_selection && iterate_toggle) break;

			// start selecting next elements
			if (found_selection) iterate_toggle = true;
		}
	}

	// select clicked element
	if (last_selected != null) last_selected.classList.remove("last_selected_element");
	e.currentTarget.classList.add("last_selected_element", "selected_element");
}

function loadFiles(msg) {
	var object = msg.payload;

	if (object.status == "error") return print(object.error);
	var path = "http://asset.localhost/" + object.dir.replace("%3A", ":").replaceAll("%5C", "/") + "/";

	for (var i = 0; i < object.files.length; i++) {
		var file_name = object.files[i];
		var element = document.createElement("file");
		element.id = file_name;
		element.innerHTML = `<div><img src="${path + file_name}"></div><text>${file_name}</text>`;
		fileInit(element);

		default_group.appendChild(element);
	}
}