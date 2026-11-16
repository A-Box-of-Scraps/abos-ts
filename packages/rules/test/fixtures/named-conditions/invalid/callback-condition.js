if (
	items.some((item) => {
		if (item.active && item.ready) {
			return true;
		}
		return false;
	})
) {
	processItems();
}
