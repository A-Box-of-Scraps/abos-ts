if (items.some((item) => item.active && item.ready)) {
	processItems();
}

while (
	check(function() {
		return hasWork && !isCancelled;
	})
) {
	processNext();
}

if (ready) {
	function check() {
		return active && enabled;
	}
}
