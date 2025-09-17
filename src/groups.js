var group_counter = 0;

function loadGroup() {
	default_group = document.createElement("group");
	default_group.id = "default_group";
	default_group.setAttribute("data-new_name", translations.default_group);

	main.appendChild(default_group);
	groupInit(default_group);
}

function groupInit(el) {
	el.addEventListener("dragover", dragOver);
	el.addEventListener("click", (e) => selectGroup(e.currentTarget));

	if (el.id == "create_group") return; // create group doesnt need a bookmark
	var bookmark = document.createElement("button");
	bookmark.innerHTML = el.getAttribute("data-new_name") || translations.new_group;
	bookmark.id = "bookmark_" + el.id;
	bookmark.addEventListener("click", () => {
		el.scrollIntoView({block: "nearest", behavior: "smooth"});
		selectGroup(el);
	});
	bookmark.addEventListener("dragover", () => {
		el.scrollIntoView({block: "nearest", behavior: "smooth"});
		selectGroup(el);
	});

	if (dragmap.children.length == 0) dragmap.appendChild(bookmark);
	else dragmap.insertBefore(bookmark, dragmap.children[0]);
}

function createGroup(name, enumeration, index) {
	var new_group = document.createElement("group");
	new_group.id = "group_" + group_counter;
	new_group.setAttribute("data-new_name", name);
	new_group.setAttribute("data-enumeration", enumeration);
	new_group.setAttribute("data-index", index);
	groupInit(new_group);
	selectGroup(new_group);

	main.insertBefore(new_group, main.children[0]);
	new_group.scrollIntoView({block: "nearest", behavior: "smooth"});

	group_counter++;
	return new_group;
}

function selectGroup(element) {
	if (element.id == "create_group" || element.id == "default_group") return;

	var groups = document.getElementsByTagName("group");
	for (var i = 0; i < groups.length; i++) groups[i].classList.remove("selected_container");

	element.classList.toggle("selected_container");

	document.getElementById("new_name").value = element.getAttribute("data-new_name");
	document.getElementById("enumeration").value = element.getAttribute("data-enumeration");
	document.getElementById("starting_index").value = element.getAttribute("data-index");
}
