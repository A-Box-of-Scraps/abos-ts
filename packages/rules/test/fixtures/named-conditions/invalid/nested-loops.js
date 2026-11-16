while (hasWork && !isCancelled) {
	if (isReady || isRetryable) {
		processNext();
	}
}
