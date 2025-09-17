async function storeConfig() {
	var groups = document.querySelectorAll("group:not(#create_group)");
	var config_array = [];

	for (var i = 0; i < groups.length; i++) {
		var name = groups[i].getAttribute("data-new_name");
		var enumeration = groups[i].getAttribute("data-enumeration");
		var index = groups[i].getAttribute("data-index");
		var files = [];

		var el_files = groups[i].getElementsByTagName("file");

		for (var j = 0; j < el_files.length; j++) {
			let { original, raw_current, current, enumeration } = current_file_names[el_files[j].id.replace("file_", "")];
			files.push({original, raw_current, current, enumeration});
		}

		config_array.push({name, enumeration, index, files});
	}

	var config_string = JSON.stringify(config_array);

	var json = await invoke("store", {dir:file_path, config:config_string});
	var response = await JSON.parse(json);

	if (response.status == "error") dialog.innerHTML = `<p>${response.error}</p><button onclick="cleanDialog()">Ok</button>`;
	else {
		dialog.innerHTML = `<p>${translations.config_stored}</p><button onclick="cleanDialog()">Ok</button>`;
		unsaved_changes = false;
	}
	dialog.showModal();
}

function loadConfig(groups) {
	for (var i = groups.length -1; i >= 0; i--) {
		if (groups[i].enumeration == null) continue;
		var group = createGroup(groups[i].name, groups[i].enumeration, groups[i].index);
		var group_name = groups[i].name;
		if (!group_name.includes(":e")) group_name += " :e";

		for (var j = 0; j < groups[i].files.length; j++) {
			var file_data = groups[i].files[j];
			var file_obj = current_file_names.find(obj => obj.original == file_data.original);
			if (file_obj == undefined) continue;

			file_obj.raw_current = file_data.raw_current;
			file_obj.current = file_data.current;
			file_obj.raw_requested = file_data.raw_current;
			file_obj.requested = file_data.current;
			file_obj.group = group_name;
			file_obj.enumeration = file_data.enumeration;

			var file_el = document.getElementById(file_obj.id);
			file_el.remove();
			group.appendChild(file_el);
			file_el.querySelector("text").innerHTML = file_obj.current;
		}
	}

	// dialog.innerHTML = `<p>${translations.config_restored}</p><button onclick="cleanDialog()">Ok</button>`;
	// dialog.showModal();
}