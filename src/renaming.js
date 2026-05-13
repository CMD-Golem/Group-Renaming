function renameGroup() {
	var selected = document.querySelector(".selected_container");
	
	if (selected == null) {
		dialog.innerHTML = `<p>${translations.select_group}</p><button onclick="dialog.close()">Ok</button>`;
		dialog.showModal();
		return;
	}

	var files = selected.getElementsByTagName("file");

	// store new group data
	var group_name = document.getElementById("new_name").value;
	var index_str = document.getElementById("starting_index").value;
	var enumeration = document.getElementById("enumeration").value;

	selected.setAttribute("data-new_name", group_name);
	selected.setAttribute("data-enumeration", enumeration);
	selected.setAttribute("data-index", index_str);

	if (enumeration == "big_letters") convertion = 65;
	else if (enumeration == "small_letters") convertion = 97;
	else convertion = 0;

	document.getElementById("bookmark_" + selected.id).innerHTML = group_name;
	orderBookmarkName();

	var needs_check = new Set();
	unsaved_changes = true;

	for (var i = 0; i < files.length; i++) {
		var file_obj = current_file_names[files[i].id.replace("file_", "")];

		var parsed_index = parseInt(index_str);
		var index = (Number.isNaN(parsed_index) ? 1 : parsed_index) + i;

		if (convertion == 0) var enum_char = index.toString().padStart(index_str.length, "0");
		else {
			var enum_char = "";
			while (index > 0) {
				index--;
				enum_char = String.fromCharCode(convertion + (index % 26)) + enum_char;
				index = Math.floor(index / 26);
			}
		}

		file_obj.enumeration = enum_char;
		file_obj.group = group_name;

		needs_check.add(file_obj);
		parseName(file_obj);
	}

	processRenaming(needs_check);
}

function copyOriginalName() {
	var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];
	navigator.clipboard.writeText(file_obj.original);
}

function parseName(file_obj) {
	var group_name = file_obj.group;
	if (!group_name.includes(":e")) group_name += ":e";

	// fill data
	file_obj.requested = file_obj.raw_requested
		.replace(":g", group_name)
		.replaceAll(":n", file_obj.original)
		.replaceAll(":e", file_obj.enumeration)
		.replaceAll(/[\\\/:*?"<>|]/g, "");

	// readd file extension
	if (!file_obj.requested.toUpperCase().endsWith(file_obj.extension.toUpperCase())) {
		file_obj.requested += "." + file_obj.extension;
	}
}

function startRenameManuall() {
	var input = contextmenu_selected.querySelector("text");
	var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];
	started_manuall_renaming = true;
	input.contentEditable = true;
	input.innerHTML = file_obj.raw_current;
	input.focus();

	var range = document.createRange();
	range.selectNodeContents(input);
	range.collapse(false);
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);

	input.addEventListener("blur", renameManuall);
	input.addEventListener("keydown", renameManuall);
	input.addEventListener("paste", noFormatting);
}

function renameManuall(e) {
	if (e.type == "blur" || (e.type == "keydown" && e.key == "Enter")) {
		var needs_check = new Set();
		unsaved_changes = true;

		var input = e.target.innerHTML.replace(/\n/g, '');
		console.log(input) // ToDo: check why br gets added

		// check if groupselection should be used and request renaming
		var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];

		if (file_obj.enumeration == "" || !input.includes(":g")) {
			file_obj.raw_requested = input;
			needs_check.add(file_obj);
			parseName(file_obj);
		}
		else {
			var selected = document.querySelectorAll(".selected_element:not(.duplication_selection_file)");

			for (var i = 0; i < selected.length; i++) {
				var file_obj = current_file_names[selected[i].id.replace("file_", "")];

				file_obj.raw_requested = input;
				needs_check.add(file_obj);
				parseName(file_obj);
			}
		}
		
		processRenaming(needs_check);
	}
	else if (e.type == "keydown" && e.key == "Escape") e.target.innerHTML = current_file_names[contextmenu_selected.id.replace("file_", "")].current;
	else return;

	// disable editing
	e.target.removeEventListener("blur", renameManuall);
	e.target.removeEventListener("keydown", renameManuall);
	e.target.removeEventListener("paste", noFormatting);
	e.target.blur();
	e.target.contentEditable = false;
	started_manuall_renaming = false;
}

async function processRenaming(needs_check) {
	var found_duplicate = true;
	var cancel_renaming = false;

	while (found_duplicate) {
		found_duplicate = false;
		for (var file_obj of needs_check) {
			// console.log(file_obj);

			if (cancel_renaming) {
				console.log("cancel", file_obj.old_group, file_obj.group)
				file_obj.enumeration = file_obj.old_enumeration || "";
				file_obj.group = file_obj.old_group || "";
				file_obj.raw_requested = file_obj.raw_current;
				file_obj.requested = file_obj.current;
				continue;
			}

			// check for duplicates
			var requested = file_obj.requested.toUpperCase();
			var duplicate = current_file_names.find(obj => obj.requested.toUpperCase() == requested && obj.id != file_obj.id);
			if (!duplicate) continue;

			var handling = await handleDuplicate(file_obj, duplicate);
			if (handling.canceled) cancel_renaming = true;
			else needs_check.add(handling.file_obj);
			
			found_duplicate = true;
			break;
		}
	}

	// update html
	for (var file_obj of needs_check) {
		file_obj.current = file_obj.requested;
		file_obj.raw_current = file_obj.raw_requested;
		file_obj.old_enumeration = file_obj.enumeration;
		file_obj.old_group = file_obj.group;

		var el_changed = document.getElementById(file_obj.id);
		var group = el_changed.closest("group");
		el_changed.querySelector("text").innerHTML = file_obj.current;

		// remove from group if it doesnt contain :g in name
		if (group.id != "default_group" && !file_obj.raw_current.includes(":g")) {
			el_changed.remove();
			default_group.appendChild(el_changed);
		}
	}

	dialog.close();
	// started_manuall_renaming = false;
}

async function handleDuplicate(wants_rename, duplicate) {
	return await new Promise((resolve) => {
		dialog.innerHTML = `
			<h1>${translations.duplicate_title}</h1>
			<p>${translations.duplicate_1}</p>
			<div class="clone_box"></div>
			<p>${translations.duplicate_2}</p>
			<input id="dialog_input">
			<div class="button_box"></div>
		`;

		var selected_obj = undefined;

		// let user select which file to rename
		function createClone(file_obj) {
			var clone = document.getElementById(file_obj.id).cloneNode(true);
			clone.classList.add("duplication_selection_file");
			clone.classList.remove("selected_element");
			clone.draggable = false;
			clone.id = "";

			clone.addEventListener("click", (e) => {
				dialog.querySelector(".selected_element")?.classList.remove("selected_element");
				e.currentTarget.classList.add("selected_element");

				var input = document.getElementById("dialog_input");
				input.value = file_obj.raw_requested;
				input.focus();
				input.select();

				selected_obj = file_obj;
			});

			dialog.querySelector(".clone_box").appendChild(clone);
		}

		createClone(wants_rename);
		createClone(duplicate);

		// confirm button
		var confirm = document.createElement("button");
		confirm.innerHTML = translations.duplicate_3;
		confirm.style.flex = 2;
		confirm.addEventListener("click", _ => {
			var raw_requested = document.getElementById("dialog_input").value;
			if (selected_obj == undefined || raw_requested == "") return;

			selected_obj.raw_requested = raw_requested;
			parseName(selected_obj);
			resolve({canceled:false, file_obj:selected_obj});
		});

		// cancel button
		var cancel = document.createElement("button");
		cancel.innerHTML = translations.duplicate_4;
		cancel.style.flex = 1;
		cancel.addEventListener("click", _ => {
			document.getElementById("dialog_input").value = wants_rename.current;
			resolve({canceled:true});
		});

		var button_box = dialog.querySelector(".button_box");
		button_box.appendChild(confirm);
		button_box.appendChild(cancel);

		dialog.showModal();
	});
}

async function applyFileNames() {
	var files_array = [];

	for (var i = 0; i < current_file_names.length; i++) {
		var file_obj = current_file_names[i];
		if (file_obj.original != file_obj.current) files_array.push({current:file_obj.original, new:file_obj.current});
		file_obj.original = file_obj.current;
	}

	if (files_array.length == 0) return;

	var json = await invoke("rename_files", {dir:file_path, files:files_array});
	var response = await JSON.parse(json);

	// show error
	if (response.status == "error") {
		dialog.innerHTML = `<p>${response.error}</p><button onclick="dialog.close()">Ok</button>`;
		dialog.setAttribute("closedby","any");
		dialog.showModal();
		return;
	}

	// reset orignal file name if error happend to it and display error message
	var error_html = `<tr><th>${translations.error}</th><th>${translations.current_name}</th><th>${translations.new_name}</th></tr>`;

	for (var i = 0; i < response.errors.length; i++) {
		var error_files = response.errors[i];

		// reset to old name
		var file_obj = current_file_names.find(obj => obj.original == error_files.new);
		file_obj.original = error_files.current;
		file_obj.current = error_files.current;
		file_obj.requested = error_files.current;
		document.getElementById(file_obj.id).querySelector("text").innerHTML = error_files.current;

		// error html
		error_html += `<tr><td>${error_files.status}</td><td>${error_files.current}</td><td>${error_files.new}</td></tr>`;
	}

	if (response.errors.length == 0) dialog.innerHTML = `<p>${translations.renaming_success}</p><button onclick="dialog.close()">Ok</button>`;
	else dialog.innerHTML = `<p>${translations.renaming_with_problems}</p><table>${error_html}</table><button onclick="dialog.close()">Ok</button>`;

	dialog.setAttribute("closedby","any");
	dialog.showModal();
	unsaved_changes = true;
}

function noFormatting(e) {
	e.preventDefault();
	var text = e.clipboardData.getData("text/plain");
	document.execCommand("insertText", false, text);
}