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
