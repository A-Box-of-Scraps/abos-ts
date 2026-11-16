if ((exists && isUser) as boolean) {
	allow();
}

if ((isGuest || isAnonymous) satisfies boolean) {
	deny();
}

if (<boolean> (exists && isUser)) {
	allow();
}

if ((exists && isUser)!) {
	allow();
}
