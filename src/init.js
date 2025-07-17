const main = document.querySelector("main");
const create_group = document.getElementById("create_group");

function globalInit() {
	var dragable_elements = document.getElementsByTagName("file");
	var drag_containers = document.getElementsByTagName("group");

	for (var i = 0; i < dragable_elements.length; i++) fileInit(dragable_elements[i])
	for (var i = 0; i < drag_containers.length; i++) groupInit(drag_containers[i])
}

globalInit();