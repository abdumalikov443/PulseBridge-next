import { RefObject, useEffect, useState } from 'react';

// true once the element has come near the screen (stays true), so work can wait until it is needed
export const useInView = (ref: RefObject<Element>, rootMargin: string = '200px'): boolean => {
	const [seen, setSeen] = useState(false);

	useEffect(() => {
		if (seen || !ref.current) return;
		if (typeof IntersectionObserver === 'undefined') return setSeen(true);
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setSeen(true);
					observer.disconnect();
				}
			},
			{ rootMargin },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [ref, rootMargin, seen]);

	return seen;
};
