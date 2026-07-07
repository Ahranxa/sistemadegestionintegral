export function serialize(data) {
	return JSON.parse(
		JSON.stringify(data, (key, value) => {
			if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
				return Number(value);
			}
			return value;
		})
	);
}
