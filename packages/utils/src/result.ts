interface Ok<Value> {
	readonly ok: true;
	readonly value: Value;
}

interface Err<Failure> {
	readonly ok: false;
	readonly error: Failure;
}

type Result<Value, Failure> = Ok<Value> | Err<Failure>;

function ok<Value>(value: Value): Ok<Value> {
	return { ok: true, value };
}

function err<Failure>(error: Failure): Err<Failure> {
	return { ok: false, error };
}

const Result = { ok, err };

export { Result };
