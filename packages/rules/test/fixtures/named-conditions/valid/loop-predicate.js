const canContinue = () => hasWork && !isCancelled;
while (canContinue()) {
	processNext();
}
