var group_counter = 0;

function groupInit(el) {
	el.addEventListener("dragover", dragOver);
	el.addEventListener("click", (e) => selectGroup(e.currentTarget));
}

function createGroup() {
	var new_group = document.createElement("group");
	new_group.id = "group_" + group_counter;
	new_group.setAttribute("data-new_name", "");
	new_group.setAttribute("data-enumeration", "numerical");
	groupInit(new_group);
	selectGroup(new_group);
	group_counter++;

	main.insertBefore(new_group, main.children[0]);

	return new_group;
}

function selectGroup(element) {
	if (element.id == "create_group" || element.id == "default_group") return;

	var groups = document.getElementsByTagName("group");
	for (var i = 0; i < groups.length; i++) groups[i].classList.remove("selected_container");

	element.classList.toggle("selected_container");

	document.getElementById("new_name").value = element.getAttribute("data-new_name");
	document.getElementById("enumeration").value = element.getAttribute("data-enumeration");
}

function renameGroup() {
	var selected = document.querySelector(".selected_container");
	var new_name = document.getElementById("new_name").value;
	var enumeration = document.getElementById("enumeration").value;

	selected.setAttribute("data-new_name", new_name);
	selected.setAttribute("data-enumeration", enumeration);

	if (enumeration == "numerical") var convertion = false;
	else if (enumeration == "big_letters") var convertion = 65;
	else if (enumeration == "small_letters") var convertion = 97;

	var files = selected.getElementsByTagName("file");
	
	for (var i = 0; i < files.length; i++) {
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
		files[i].querySelector("text").innerHTML = new_name.replaceAll("%enum%", enum_char).replaceAll("%name%", current_name);
	}
}