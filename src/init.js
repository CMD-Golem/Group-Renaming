const main = document.querySelector("main");
const create_group = document.getElementById("create_group");
const css_root = document.querySelector(":root");

function globalInit() {
	var dragable_elements = document.getElementsByTagName("file");
	var drag_containers = document.getElementsByTagName("group");

	for (var i = 0; i < drag_containers.length; i++) groupInit(drag_containers[i]);
	for (var i = 0; i < dragable_elements.length; i++) fileInit(dragable_elements[i]);

	// preview size
	var preview_size = window.localStorage.getItem("preview_size");
	
	if (preview_size == null) preview_size = 100;

	document.getElementById("preview_size").value = preview_size;
	css_root.style.setProperty('--file-width', preview_size);
}

globalInit();