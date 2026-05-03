async function renameGroup() {
	var selected = document.querySelector(".selected_container");
	var files = selected.getElementsByTagName("file");

	if (selected == null) return;

	// store new group data
	var group_name = document.getElementById("new_name").value;
	var index_str = document.getElementById("starting_index").value;
	var enumeration = document.getElementById("enumeration").value;

	selected.setAttribute("data-new_name", group_name);
	selected.setAttribute("data-enumeration", enumeration);
	selected.setAttribute("data-index", index_str);

	document.getElementById("bookmark_" + selected.id).innerHTML = group_name;
	orderBookmarkName();

	var needs_check = [];
	var needs_update = [];
	unsaved_changes = true;

	for (var i = 0; i < files.length; i++) {
		var file_obj = current_file_names[files[i].id.replace("file_", "")];
		file_obj.position = i;
		needs_check.push(file_obj);
		parseName(file_obj, selected, {group_name, index_str, enumeration});
	}

	for (var i = 0; i < needs_check.length; i++) await checkNewName(needs_check[i], needs_update);
	for (var i = 0; i < needs_update.length; i++) updateHtml(needs_update[i]);
}

function copyOriginalName() {
	var file_obj = current_file_names[contextmenu_selected.id.replace("file_", "")];
	navigator.clipboard.writeText(file_obj.original);
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

async function renameManuall(e) {
	console.log(e.type);
	if (e.type == "blur" || (e.type == "keydown" && e.key == "Enter")) {
		var needs_check = [];
		var needs_update = [];
		unsaved_changes = true;

		var input = e.target.innerHTML.replace(/\n/g, '');
		if (!input.includes(":g")) var selected = [contextmenu_selected];
		else var selected = document.querySelectorAll(".selected_element");

		for (var i = 0; i < selected.length; i++) {	
			var file_obj = current_file_names[selected[i].id.replace("file_", "")];
			file_obj.raw_requested = input;

			needs_check.push(file_obj);
			parseName(file_obj);
		}
		for (var i = 0; i < needs_check.length; i++) await checkNewName(needs_check[i], needs_update);
		for (var i = 0; i < needs_update.length; i++) updateHtml(needs_update[i]);
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

function parseName(file_obj, group, payload) {
	if (file_obj.position == undefined) {
		// reload position of files in group when needed
		if (group == undefined) group = document.getElementById(file_obj.id).parentElement;
		for (var i = 0; i < group.children.length; i++) {
			var file = group.children[i];
			current_file_names[file.id.replace("file_", "")].position = i;
		}
	}

	var group_name = file_obj.group;
	if (group_name == "" || payload != undefined) {
		// get input data when needed and not provided
		if (payload == undefined) {
			var payload = {};
			payload.group_name = document.getElementById("new_name").value;
			payload.index_str = document.getElementById("starting_index").value;
			payload.enumeration = document.getElementById("enumeration").value;
		}

		group_name = payload.group_name;
		file_obj.group = group_name;
		file_obj.leading_zeros = payload.index_str.length;

		file_obj.start_index = parseInt(payload.index_str) || 1;
		if (file_obj.start_index < 0) file_obj.start_index = 1;

		if (payload.enumeration == "big_letters") file_obj.convertion = 65;
		else if (payload.enumeration == "small_letters") file_obj.convertion = 97;
		else file_obj.convertion = 0;
	}
	if (!group_name.includes(":e") && !file_obj.raw_requested.includes(":e")) group_name += ":e";

	// enumeration
	var index = file_obj.start_index + file_obj.position;
	if (file_obj.convertion == 0) var enum_char = index.toString().padStart(file_obj.leading_zeros, "0");

	else if (file_obj.convertion != 0) {
		var enum_char = "";
		while (index > 0) {
			index--;
			enum_char = String.fromCharCode(file_obj.convertion + (index % 26)) + enum_char;
			index = Math.floor(index / 26);
		}
	}

	// fill data
	file_obj.requested = file_obj.raw_requested
		.replace(":g", group_name)
		.replaceAll(":n", file_obj.original)
		.replaceAll(":e", enum_char)
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
				e.currentTarget.classList.add("selected_element");

				var input = document.getElementById("dialog_input");
				input.value = file_obj.raw_requested;
				input.focus();
				input.select();

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

			dialog.close();
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
	el_changed.querySelector("text").innerHTML = file_obj.current;

	// remove from group if it doesnt contain :g in name
	if (el_changed.closest("group").id != "default_group" && !file_obj.raw_current.includes(":g")) {
		el_changed.remove();
		default_group.appendChild(el_changed);
		renameGroup();
	}
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