
async function renameGroup() {
	var selected = document.querySelector(".selected_container");
	var new_name = document.getElementById("new_name").value;
	var enumeration = document.getElementById("enumeration").value;

	// store new group data
	selected.setAttribute("data-new_name", new_name);
	selected.setAttribute("data-enumeration", enumeration);

	// handle enum variants
	if (enumeration == "numerical") var convertion = false;
	else if (enumeration == "big_letters") var convertion = 65;
	else if (enumeration == "small_letters") var convertion = 97;

	// add enum to the end if it is not included
	if (!new_name.includes("%enum%")) new_name += " %enum%";

	var files = selected.getElementsByTagName("file");
	
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
		
		var current_name = files[i].getAttribute("data-original_name");
		var new_file_name = new_name.replaceAll("%enum%", enum_char).replaceAll("%name%", current_name);
		await renameFile(files[i], new_file_name, "#" + selected.id);
	}

	// try setting default file name for new duplicates
	for (var i = 0; i < duplicate_wants_renaming.length; i++) {
		var el = duplicate_wants_renaming[i];
		var new_name = el.getAttribute("data-original_name");

		await renameFile(el, new_name);
	}
}

async function renameFile(el, new_name, renaming_group_id) {
	var big_name = new_name.toUpperCase();

	// readd file extension
	var extension = el.getAttribute("data-extension");
	if (!big_name.endsWith(extension.toUpperCase())) {
		new_name += "." + extension;
		big_name = new_name.toUpperCase();
	}

	// check that file name doesnt already exists
	var names = document.getElementsByTagName("text");
	var do_renaming = true;

	for (var i = 0; i < names.length; i++) {
		var existing_name = names[i].innerHTML.toUpperCase();
		var group_is_renamed = names[i].closest(renaming_group_id);

		if (big_name == existing_name && group_is_renamed == null) {
			do_renaming = await handleDuplicate(el, names[i].closest("file"));
			break;
		}
	}

	if (do_renaming) el.querySelector("text").innerHTML = new_name;
}

function handleDuplicate(wants_rename, duplicate) {
	// ask for new name if file isnt in a group
	if (wants_rename.closest("group").id == "default_group") {
		dialog.innerHTML = `
			<p>${translations.duplicate_standard}</p>
			<input id="duplicate_input">
			<button onclick="
				clean_dialog();
				renameFile(
					document.getElementById(${wants_rename.id}),
					document.getElementById('duplicate_input').value);
			">Ok<button>
		`;
		dialog.showModal();
		return false;
	}

	// let user select which file to reset to default name
	return new Promise((resolve) => {
		var wants_rename_clone = wants_rename.cloneNode();
		wants_rename_clone.draggable = false;
		wants_rename_clone.id = "";

		var duplicate_clone = duplicate.cloneNode();
		duplicate_clone.draggable = false;
		duplicate_clone.id = "";

		// remove wants_rename from group and dont rename it
		wants_rename_clone.addEventListener("click", () => {
			wants_rename.remove();
			wants_rename.appendChild(main);
			duplicate_wants_renaming.push(wants_rename);
			clean_dialog();
			resolve(false);
		});

		// if duplicate is in a group remove it and rename wants_rename
		duplicate_clone.addEventListener("click", () => {
			if (duplicate.closest("group").id != "default_group") {
				duplicate.remove();
				duplicate.appendChild(main);
			}
			duplicate_wants_renaming.push(duplicate);
			clean_dialog();
			resolve(true);
		});

		dialog.innerHTML = `<h1>${translations.duplicate_title}</h1><p>${translations.duplicate_message}</p><div>${wants_rename_clone}${duplicate_clone}</div>`;
		dialog.showModal();
	});
}

async function applyFileNames() {
	var files = document.getElementsByTagName("file");
	var files_array = [];

	for (var i = 0; i < files.length; i++) {
		var new_name = files[i].querySelector("text").innerHTML;
		var original_name = files[i].getAttribute("data-original_name");
		files[i].setAttribute("data-original_name", new_name);
 
		if (original_name.toUpperCase() != new_name.toUpperCase()) files_array.push({current:original_name, new:new_name});
	}

	var json = await invoke("rename_files", {dir:file_path, files:files_array});
	var response = await json.json();
	console.log(response)

	// show error
	if (response.status == "error") {
		dialog.innerHTML = `<p>${response.error}</p><button onclick="clean_dialog()">Ok<button>`;
		dialog.showModal();
		return;
	}

	// reset orignal file name if error happend to it and display error message
	for (var i = 0; i < response.errors.length; i++) {
		var object = response[i];

		var file = document.querySelector(`[data-original_name="${object.new}"]`);
		file.setAttribute("data-original_name", object.current);
	}
	
	console.log(response.errors);
}