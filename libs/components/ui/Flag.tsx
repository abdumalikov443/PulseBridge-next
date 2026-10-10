import React from 'react';

// small flags for the language switch (drawn inline: emoji flags do not show on Windows)
const US = (
	<>
		<rect width="30" height="20" fill="#fff" />
		{[0, 2, 4, 6, 8, 10, 12].map((i) => (
			<rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
		))}
		<rect width="13" height={(20 * 7) / 13} fill="#3c3b6e" />
		{[2.2, 5.2, 8.2].map((y) =>
			[2, 5, 8, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#fff" />),
		)}
	</>
);

// one trigram: three bars, a broken bar is two short pieces
const Trigram = ({ bars, transform }: { bars: boolean[]; transform: string }) => (
	<g transform={transform} fill="#000">
		{bars.map((whole, i) =>
			whole ? (
				<rect key={i} x="-2" y={i * 1.3 - 1.6} width="4" height="0.8" />
			) : (
				<g key={i}>
					<rect x="-2" y={i * 1.3 - 1.6} width="1.7" height="0.8" />
					<rect x="0.3" y={i * 1.3 - 1.6} width="1.7" height="0.8" />
				</g>
			),
		)}
	</g>
);

const KR = (
	<>
		<rect width="30" height="20" fill="#fff" />
		<g transform="rotate(33.7 15 10)">
			<path d="M10 10a5 5 0 0 1 10 0z" fill="#cd2e3a" />
			<path d="M10 10a5 5 0 0 0 10 0z" fill="#0047a0" />
			<circle cx="12.5" cy="10" r="2.5" fill="#cd2e3a" />
			<circle cx="17.5" cy="10" r="2.5" fill="#0047a0" />
		</g>
		<Trigram bars={[true, true, true]} transform="translate(6 4.3) rotate(-56.3)" />
		<Trigram bars={[false, false, false]} transform="translate(24 15.7) rotate(-56.3)" />
		<Trigram bars={[true, false, true]} transform="translate(6 15.7) rotate(56.3)" />
		<Trigram bars={[false, true, false]} transform="translate(24 4.3) rotate(56.3)" />
	</>
);

const UZ = (
	<>
		<rect width="30" height="20" fill="#fff" />
		<rect width="30" height="6.5" fill="#0099b5" />
		<rect y="13.5" width="30" height="6.5" fill="#1eb53a" />
		<rect y="6.5" width="30" height="0.6" fill="#ce1126" />
		<rect y="12.9" width="30" height="0.6" fill="#ce1126" />
		<circle cx="5" cy="3.3" r="2.3" fill="#fff" />
		<circle cx="5.9" cy="3.3" r="2" fill="#0099b5" />
		{[
			[9, 1.6],
			[11, 1.6],
			[13, 1.6],
			[9, 3.3],
			[11, 3.3],
			[13, 3.3],
			[11, 5],
			[13, 5],
		].map(([x, y]) => (
			<circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" fill="#fff" />
		))}
	</>
);

const FLAGS: Record<string, React.ReactNode> = { en: US, kr: KR, uz: UZ };

const Flag = ({ locale, size = 20 }: { locale: string; size?: number }) => (
	<svg className="pb-flag" width={size} height={(size * 2) / 3} viewBox="0 0 30 20" aria-hidden="true">
		{FLAGS[locale] ?? FLAGS.en}
	</svg>
);

export default Flag;
