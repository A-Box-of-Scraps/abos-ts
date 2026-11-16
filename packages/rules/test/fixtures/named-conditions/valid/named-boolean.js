const isAdmin = exists && isUser && hasPrivileges;
if (isAdmin) {
	allow();
}
