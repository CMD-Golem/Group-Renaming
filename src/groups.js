var group_counter = 0;

function groupInit(el) {
	el.addEventListener("dragover", dragDrop);
}

function createGroup() {
	var new_group = document.createElement("group");
	new_group.id = "group_" + group_counter;
	groupInit(new_group);
	group_counter++;

	main.insertBefore(new_group, create_group.nextSibling);

	return new_group;
}
