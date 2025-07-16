var dragging_clone;

function dragInit() {
	var dragable_elements = document.getElementsByTagName("file");
	var drag_containers = document.getElementsByTagName("group");

	for (var i = 0; i < dragable_elements.length; i++) {
		var dragable_element = dragable_elements[i];
		dragable_element.draggable = true;

		dragable_element.addEventListener("dragstart", e => {
			// create dragging clone
			dragging_clone = e.currentTarget.cloneNode(true);
			document.body.appendChild(dragging_clone);
			e.dataTransfer.setDragImage(dragging_clone, 0, 0);
			dragging_clone.classList.add("dragging_clone");

			// make create group visible
			document.getElementById("create_group").style.display = "flex";

			e.currentTarget.classList.add("dragging");
		});

		dragable_element.addEventListener("dragend", e => {
			dragging_clone.remove();
			document.getElementById("create_group").style.display = "none";
			e.currentTarget.classList.remove("dragging");
		});
	}

	for (var i = 0; i < drag_containers.length; i++) {
		drag_containers[i].addEventListener("dragover", dragDrop);
	}
}

function dragDrop(e) {
	e.preventDefault();

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
		var vertical_center = bounding_rect.top + bounding_rect.height / 2;
		var horizontal_position = bounding_rect.left + bounding_rect.width /2;

		// store current position for animation
		element_positions.set(not_dragging[i], bounding_rect);

		// create new row if it doesnt exist yet
		var existing_row = container_rows.find(row => row.y == vertical_center);

		if (!existing_row) {
			existing_row = {y:vertical_center, elements:[]};
			container_rows.push(existing_row);
		}

		// add info to row
		existing_row.elements.push({el:not_dragging[i], x:horizontal_position});
	}

	// find closest row
	var closest_row = undefined;
	var closest_value = Infinity;

	for (var i = 0; i < container_rows.length; i++) {
		var value = Math.abs(e.clientY - container_rows[i].y);
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
	for (var i = 0; i < not_dragging.length; i++) {
		var element = not_dragging[i];

		var old_position = element_positions.get(element);
		var new_position = element.getBoundingClientRect();

		var dx = old_position.left - new_position.left;
		var dy = old_position.top - new_position.top;

		if (dx || dy) {
			element.animate([{transform:`translate(${dx}px, ${dy}px)`}, {transform:"translate(0, 0)"}], {duration:200, easing:"ease-in-out"});
		}
	}
}

dragInit();