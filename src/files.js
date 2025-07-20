function fileInit(el) {
	el.draggable = true;

	el.addEventListener("dragstart", dragStart);
	el.addEventListener("dragend", dragEnd);
	el.addEventListener("click", fileSelection);
}

function fileSelection(e) {
	e.currentTarget.classList.toggle("selected_element");
	if (e.shiftKey)
	console.log(e)
}