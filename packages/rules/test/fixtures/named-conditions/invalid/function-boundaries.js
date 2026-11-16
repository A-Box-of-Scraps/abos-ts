if (items.some((item) => item.active && item.ready) && enabled) {
	processItems();
}

function check() {
	if (exists && isUser) {
		allow();
	}
}
