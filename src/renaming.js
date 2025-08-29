async function renameGroup() {
	var selected = document.querySelector(".selected_container");
	var group_name = document.getElementById("new_name").value;
	var enumeration = document.getElementById("enumeration").value;

	if (selected == null) return;

	// store new group data
	selected.setAttribute("data-new_name", group_name);
	selected.setAttribute("data-enumeration", enumeration);
	document.getElementById("bookmark_" + selected.id).innerHTML = group_name;

	// handle enum variants
	if (enumeration == "numerical") var convertion = false;
	else if (enumeration == "big_letters") var convertion = 65;
	else if (enumeration == "small_letters") var convertion = 97;

	// add enum to the end if it is not included
	if (!group_name.includes(":e")) group_name += " :e";

	var files = selected.getElementsByTagName("file");
	var needs_check = [];
	var needs_update = [];
	
	for (var i = 0; i < files.length; i++) {
		// increase custom enums
		if (convertion != false) {
			var loop = i + 1;
			var enum_char = "";
			while (loop > 0) {
				loop--;
				enum_char = String.fromCharCode(convertion + (loop % 26)) + enum_char;
				loop = Math.floor(loop / 26);
			}
		}
		else var enum_char = i + 1;

		var file_obj = current_file_names[files[i].id.replace("file_", "")];
		file_obj.enumeration = enum_char;
		file_obj.group = group_name;
		needs_check.push(file_obj);
		parseName(file_obj);
	}

	for (var i = 0; i < needs_check.length; i++) await checkNewName(needs_check[i], needs_update);
	for (var i = 0; i < needs_update.length; i++) updateHtml(needs_update[i]);
}

function startRenameManuall() {
	var input = contextmenu_selected.querySelector("text");
	var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];
	input.innerHTML = file_obj.raw_current;
	input.contentEditable = true;
	input.focus();

	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.selectAllChildren(input);

	input.addEventListener("blur", renameManuall);
	input.addEventListener("keydown", renameManuall);
}

async function renameManuall(e) {
	if (e.type == "blur" || (e.type == "keydown" && e.key == "Enter")) {
		var needs_update = [];
		var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];
		file_obj.raw_requested = e.target.innerHTML.replace(/\n/g, '');

		parseName(file_obj);
		await checkNewName(file_obj, needs_update);
		for (var i = 0; i < needs_update.length; i++) updateHtml(needs_update[i]);
	}
	else if (e.type == "keydown" && e.key == "Escape") e.target.innerHTML = current_file_names[contextmenu_selected.id.replace("file_", "")].current;
	else return;

	// disable editing
	e.target.removeEventListener("blur", renameManuall);
	e.target.removeEventListener("keydown", renameManuall);
	e.target.blur();
	e.target.contentEditable = false;
}

function parseName(file_obj) {
	file_obj.requested = file_obj.raw_requested
		.replace(":g", file_obj.group)
		.replaceAll(":n", file_obj.original)
		.replaceAll(":e", file_obj.enumeration)
		.replaceAll(/[\\\/:*?"<>|]/g, "");

	// readd file extension
	if (!file_obj.requested.toUpperCase().endsWith(file_obj.extension.toUpperCase())) {
		file_obj.requested += "." + file_obj.extension;
	}
}

async function checkNewName(file_obj, needs_update) {
	var requested = file_obj.requested.toUpperCase();
	var duplicate = current_file_names.find(obj => obj.requested.toUpperCase() == requested && obj.id != file_obj.id);

	if (duplicate != undefined) await handleDuplicate(file_obj, duplicate, needs_update);
	else {
		file_obj.current = file_obj.requested;
		file_obj.raw_current = file_obj.raw_requested;
		needs_update.push(file_obj);
	}
}

async function handleDuplicate(wants_rename, duplicate, needs_update) {
	return await new Promise(async (resolve) => {
		dialog.innerHTML = `
			<h1>${translations.duplicate_title}</h1>
			<p>${translations.duplicate_1}</p>
			<div></div>
			<p>${translations.duplicate_2}</p>
			<input id="dialog_input">
		`;

		var selected_obj = undefined;
		var keep_obj = undefined;

		// let user select which file to rename
		function createClone(file_obj, other_obj) {
			var clone = document.getElementById(file_obj.id).cloneNode(true);
			clone.draggable = false;
			clone.id = "";

			clone.addEventListener("click", (e) => {
				dialog.querySelector(".selected_element")?.classList.remove("selected_element");
				document.getElementById("dialog_input").value = file_obj.raw_requested;
				e.currentTarget.classList.add("selected_element");
				selected_obj = file_obj;
				keep_obj = other_obj;
			});

			dialog.querySelector("div").appendChild(clone);
		}

		createClone(wants_rename, duplicate);
		createClone(duplicate, wants_rename);

		// confirm button
		var button = document.createElement("button");
		button.innerHTML = translations.duplicate_3;
		await button.addEventListener("click", async () => {
			var raw_requested = document.getElementById("dialog_input").value;
			if (selected_obj == undefined || raw_requested == "") return;
			selected_obj.raw_requested = raw_requested;

			clean_dialog();
			parseName(selected_obj);
			await checkNewName(selected_obj, needs_update);
			await checkNewName(keep_obj, needs_update);
			resolve();
		});

		dialog.appendChild(button);
		dialog.showModal();
	});
}

function updateHtml(file_obj) {
	var el_changed = document.getElementById(file_obj.id);
	console.log(file_obj.current);
	el_changed.querySelector("text").innerHTML = file_obj.current;

	// remove from group if it doesnt contain :g in name
	if (el_changed.closest("group").id != "default_group" && !file_obj.raw_current.includes(":g")) {
		el_changed.remove();
		default_group.appendChild(el_changed);
		renameGroup();
	}
}

async function applyFileNames() {
	var files = document.getElementsByTagName("file");
	var files_array = [];

	for (var i = 0; i < files.length; i++) {
		var file_obj = current_file_names[files[i].id.replace("file_", "")];
		if (file_obj.original != file_obj.current) files_array.push({current:file_obj.original, new:file_obj.current});
		file_obj.original = file_obj.current;
	}

	console.log(files_array)

	if (files_array.length == 0) return;

	var json = await invoke("rename_files", {dir:file_path, files:files_array});
	var response = await JSON.parse(json);
	console.log(response)

	// show error
	if (response.status == "error") {
		dialog.innerHTML = `<p>${response.error}</p><button onclick="clean_dialog()">Ok<button>`;
		dialog.showModal();
		return;
	}

	// reset orignal file name if error happend to it and display error message
	for (var i = 0; i < response.errors.length; i++) {
		var error_files = response.errors[i];
		var file_obj = current_file_names.find(obj => obj.original == error_files.new);
		file_obj.original = error_files.current;
	}
}