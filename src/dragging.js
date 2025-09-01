var dragging_clone;
var pointer_pos = {x:0, y:0};
var selected_elements_list = [];

function dragStart(e) {
	var target = e.currentTarget;
	main.classList.add("started_dragging");

	// make create group visible
	document.getElementById("create_group").parentElement.style.display = "block";

	// create dragging clone
	dragging_clone = target.cloneNode(true);
	document.body.appendChild(dragging_clone);
	dragging_clone.classList.add("dragging_clone");

	// show amount of selected elements
	var selected = document.querySelectorAll(".selected_element:not(.dragging_clone)");
	var amount = selected.length;
	if (!target.classList.contains("selected_element")) amount += 1;
	
	if (amount > 1) {
		dragging_amount = document.createElement("span");
		dragging_amount.innerHTML = amount;
		dragging_clone.appendChild(dragging_amount);
	}
	e.dataTransfer.setDragImage(dragging_clone, 0, 0);

	 // fixe chromium bug
	setTimeout((target, selected) => {
		target.classList.add("dragging");

		// collect all selected elements
		for (var i = 0; i < selected.length; i++) {
			if (target.id != selected[i].id) {
				selected_elements_list.push(selected[i]);
				selected[i].remove();
			}
		}
	}, 0, target, selected);
}

function dragEnd(e) {
	// handle chromium bugs
	if (e.currentTarget != null) var target = e.currentTarget;
	else var target = document.querySelector(".dragging");

	if (target == null || !target.classList.contains("dragging")) {
		setTimeout(dragEnd, 100, e);
		return;
	}

	// clean up
	document.getElementById("create_group").parentElement.style.display = "none";
	target.classList.remove("dragging");
	target.classList.remove("selected_element");
	main.classList.remove("started_dragging");
	dragging_clone.remove();

	// create new group if needed
	if (target.parentElement.id == "create_group") {
		var new_container = createGroup("", "numerical");
		new_container.appendChild(target);
	}

	// delete empty groups
	var drag_containers = document.querySelectorAll("group:not(#create_group):not(#default_group)");
	for (var i = 0; i < drag_containers.length; i++) {
		if (drag_containers[i].children.length == 0) {
			var id = "bookmark_" + drag_containers[i].id;
			document.getElementById(id).remove();
			drag_containers[i].remove();
		}
	}

	// set default current_file_names
	var in_default_group = target.parentElement.id == "default_group";
	setDefaultNames(target, in_default_group);

	// insert selected elements again
	var elements = target.parentElement.querySelectorAll("file:not(.dragging)");
	var element_positions = new Map();

	for (var i = 0; i < elements.length; i++) {
		var bounding_rect = elements[i].getBoundingClientRect();
		element_positions.set(elements[i], bounding_rect);
	}
	
	for (var i = selected_elements_list.length -1; i >= 0; i--) {
		var selected_element = selected_elements_list[i];
		setDefaultNames(selected_element, in_default_group);
		selected_element.classList.remove("selected_element");
		target.parentElement.insertBefore(selected_element, target.nextSibling);
	}

	unsaved_changes = true;
	selected_elements_list = [];
	animation(element_positions, elements);
}

function setDefaultNames(element, in_default_group) {
	var file_obj = current_file_names[element.id.replace("file_", "")];
	if (in_default_group) {
		file_obj.enumeration = "";
		file_obj.group = "";
	}
	else if (!file_obj.raw_current.includes(":g")) {
		file_obj.raw_current = ":g";
		file_obj.raw_requested = ":g";
	}
}

async function dragOver(e) {
	e.preventDefault();

	// only run if position changed
	if (Math.abs(pointer_pos.x - e.clientX) > 5 || Math.abs(pointer_pos.y - e.clientY) > 5) {
		pointer_pos.x = e.clientX;
		pointer_pos.y = e.clientY;
	}
	else return;

	// get data
	var container = e.currentTarget;
	var dragging = document.querySelector(".dragging");
	var not_dragging = container.querySelectorAll("file:not(.dragging)");
	var element_positions = new Map();

	// append directly if no other elements in container
	if (not_dragging.length == 0) {
		container.appendChild(dragging);
		return;
	}

	// group all elements on the same row
	var container_rows = [];
	for (var i = 0; i < not_dragging.length; i++) {
		var bounding_rect = not_dragging[i].getBoundingClientRect();
		element_positions.set(not_dragging[i], bounding_rect);

		getRows(not_dragging[i], container_rows, true);
	}

	// add row of target
	getRows(dragging, container_rows, false);

	// find closest row
	var closest_row = undefined;
	var closest_value = Infinity;

	for (var i = 0; i < container_rows.length; i++) {
		var value = Math.abs(e.clientY + document.documentElement.scrollTop - container_rows[i].y);
		if (value < closest_value) {
			closest_value = value;
			closest_row = container_rows[i].elements;
		}
	}

	// find closest element in row
	var closest_element = undefined;
	closest_value = Infinity;
	
	for (var i = 0; i < closest_row.length; i++) {
		var value = e.clientX - closest_row[i].x;
		if (Math.abs(value) < closest_value && value < 0) {
			closest_value = Math.abs(value);
			closest_element = closest_row[i].el;
		}
	}

	// if no element could be found right from the pointer use last element in row
	var last_element = closest_row[closest_row.length - 1].el;

	if (closest_element) container.insertBefore(dragging, closest_element);
	else if (last_element.nextSibling) container.insertBefore(dragging, last_element.nextSibling);
	else container.appendChild(dragging);

	// animation
	animation(element_positions, not_dragging);
}

function animation(position, elements) {
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];

		var old_position = position.get(element);
		var new_position = element.getBoundingClientRect();

		var dx = old_position.left - new_position.left;
		var dy = old_position.top - new_position.top;

		if (dx || dy) element.animate([{transform:`translate(${dx}px, ${dy}px)`}, {transform:"translate(0, 0)"}], {duration:200, easing:"ease-in-out"});
	}
}

function getRows(element, container_rows, add) {
	var bounding_rect = element.getBoundingClientRect();
	var vertical_center = element.offsetTop + bounding_rect.height / 2;
	var horizontal_position = element.offsetLeft + bounding_rect.width /2;

	// create new row if it doesnt exist yet
	var existing_row = container_rows.find(row => Math.abs(row.y - vertical_center) < 5);

	if (!existing_row) {
		existing_row = {y:vertical_center, elements:[]};
		container_rows.push(existing_row);
	}

	// add info to row
	if (add) existing_row.elements.push({el:element, x:horizontal_position});
}