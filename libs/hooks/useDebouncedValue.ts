import { useEffect, useState } from 'react';

// value after the user stops typing for `delay` ms (live search without pressing Enter)
export const useDebouncedValue = <V>(value: V, delay: number = 400): V => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};
