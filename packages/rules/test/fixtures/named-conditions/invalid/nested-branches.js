if (exists && isUser) {
	allow();
} else if (isGuest || isAnonymous) {
	deny();
}
