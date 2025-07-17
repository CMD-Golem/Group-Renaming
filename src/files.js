function fileInit(el) {
	el.draggable = true;

	el.addEventListener("dragstart", dragStart);
	el.addEventListener("dragend", dragEnd);
	el.addEventListener("click", e => {
		e.currentTarget.classList.toggle("selected");
	});
}