async function storeConfig() {
	var groups = document.querySelectorAll("group:not(#create_group)");
	var config_array = [];

	for (var i = 0; i < groups.length; i++) {
		var name = groups[i].getAttribute("data-new_name");
		var enumeration = groups[i].getAttribute("data-enumeration");
		var files = [];

		var el_files = groups[i].getElementsByTagName("file");

		for (var j = 0; j < el_files.length; j++) {
			var { original, raw_current, current } = current_file_names[el_files[j].id.replace("file_", "")];
			files.push({original, raw_current, current});
		}

		config_array.push({name, enumeration, files});
	}

	var json = await invoke("rename_files", {config:config_array});
	var response = await JSON.parse(json);
	console.log(response);
}