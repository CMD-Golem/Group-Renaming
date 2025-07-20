var group_counter = 0;

function groupInit(el) {
	el.addEventListener("dragover", dragOver);
	el.addEventListener("click", groupSelection);
}

function createGroup() {
	var new_group = document.createElement("group");
	new_group.id = "group_" + group_counter;
	groupInit(new_group);
	group_counter++;

	main.insertBefore(new_group, main.children[0]);

	return new_group;
}

function groupSelection(e) {
	if (e.currentTarget.id == "create_group" || e.currentTarget.id == "default_group") return;

	var groups = document.getElementsByTagName("group");
	for (var i = 0; i < groups.length; i++) groups[i].classList.remove("selected_container");

	e.currentTarget.classList.toggle("selected_container");
}