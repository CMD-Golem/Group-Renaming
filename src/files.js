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

var file_counter = 0;

function loadFiles(msg) {
	var object = msg.payload;
	file_path = object.dir;

	// load defaul group
	default_group = document.createElement("group");
	default_group.id = "default_group";
	default_group.setAttribute("data-new_name", translations.default_group);

	main.innerHTML = "";
	dragmap.innerHTML = "";
	main.appendChild(default_group);

	groupInit(default_group);

	// load files
	if (object.status == "error") return print(object.error);
	var path = "http://asset.localhost/" + file_path + "\\";

	for (var i = 0; i < object.files.length; i++) {
		var file_name = object.files[i];
		var element = document.createElement("file");
		element.id = "file_" + file_counter;
		element.draggable = true;
		element.innerHTML = `<div><img src="${path + file_name}"></div><text>${file_name}</text>`;
		
		element.addEventListener("dragstart", dragStart);
		element.addEventListener("dragend", dragEnd);
		element.addEventListener("click", selectFile);
		element.addEventListener("contextmenu", contextMenu);

		file_counter++;
		default_group.appendChild(element);
		current_file_names.push({
			id: element.id,
			extension: file_name.split(".").pop(),
			original: file_name,
			raw_current: ":g",
			current: file_name,
			raw_requested: ":g",
			requested: file_name,
			group: "",
			enumeration: ""
		});
	}
}

function contextMenu(event) {
	// compute what is the mouse position relative to the container element (body)
	var { clientX: mouseX, clientY: mouseY } = event;
	var { left: bodyOffsetX, top: bodyOffsetY } = body.getBoundingClientRect();

	bodyOffsetX = bodyOffsetX < 0 ? 0 : bodyOffsetX;
	bodyOffsetY = bodyOffsetY < 0 ? 0 : bodyOffsetY;

	var bodyX = mouseX - bodyOffsetX;
	var bodyY = mouseY - bodyOffsetY;

	// check if the element will go out of bounds
	var outOfBoundsOnX = bodyX + context_menu.offsetWidth > body.offsetWidth;
	var outOfBoundsOnY = bodyY + context_menu.offsetHeight > body.offsetHeight;

	var normalizedX = mouseX;
	var normalizedY = mouseY;

	// normalize
	if (outOfBoundsOnX) normalizedX = bodyOffsetX + body.offsetWidth - context_menu.offsetWidth;
	if (outOfBoundsOnY) normalizedY = bodyOffsetY + body.offsetHeight - context_menu.offsetHeight;

	context_menu.classList.remove("visible");
	context_menu.style.top = `${normalizedY}px`;
	context_menu.style.left = `${normalizedX}px`;

	setTimeout(() => { context_menu.classList.add("visible"); });

	// store selected file
	contextmenu_selected = event.currentTarget;
}