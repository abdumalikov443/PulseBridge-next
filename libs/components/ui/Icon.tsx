import React from 'react';

// stroke icons used across the Soft Care design (24x24 grid, currentColor)
const paths: Record<string, React.ReactNode> = {
	heart: (
		<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
	),
	eye: (
		<>
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
			<circle cx="12" cy="12" r="3" />
		</>
	),
	eyeOff: (
		<>
			<path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.5M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
			<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
		</>
	),
	pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
	asterisk: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />,
	stethoscope: (
		<>
			<path d="M6 3v6a5 5 0 0 0 10 0V3" />
			<path d="M11 14v2a4 4 0 0 0 8 0v-2" />
			<circle cx="19" cy="12" r="2" />
		</>
	),
	smile: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
		</>
	),
	brain: (
		<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" />
	),
	tooth: (
		<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5S9.5 17 12 17s3 4 4.5 4S18.5 17.5 19 14.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z" />
	),
	shield: (
		<>
			<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
			<path d="M12 9v6M9 12h6" />
		</>
	),
	book: (
		<>
			<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
			<path d="M4 19V5M9 7h6" />
		</>
	),
	navigate: <path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" />,
	send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
	chat: (
		<>
			<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-4.2A8.4 8.4 0 1 1 21 11.5z" />
			<path d="M8 10h8M8 14h5" />
		</>
	),
	comment: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-4.2A8.4 8.4 0 1 1 21 11.5z" />,
	userPlus: (
		<>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M19 8v6M22 11h-6" />
		</>
	),
	userCheck: (
		<>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="m16 11 2 2 4-4" />
		</>
	),
	users: (
		<>
			<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
			<circle cx="10" cy="7" r="4" />
		</>
	),
	arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
	arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
	search: (
		<>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</>
	),
	bell: (
		<>
			<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.7 21a2 2 0 0 1-3.4 0" />
		</>
	),
	calendar: (
		<>
			<rect x="3" y="4" width="18" height="17" rx="2" />
			<path d="M16 2v4M8 2v4M3 10h18" />
		</>
	),
	clock: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</>
	),
	pin: (
		<>
			<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
			<circle cx="12" cy="10" r="2.5" />
		</>
	),
	phone: (
		<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
	),
	clinic: (
		<>
			<path d="M3 21h18" />
			<path d="M5 21V7l7-4 7 4v14" />
			<path d="M10 9h4M12 7v4" />
			<path d="M9 21v-5h6v5" />
		</>
	),
	image: (
		<>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<circle cx="9" cy="10" r="2" />
			<path d="m21 16-5-5-8 8" />
		</>
	),
	check: <path d="M20 6 9 17l-5-5" />,
	close: <path d="M18 6 6 18M6 6l12 12" />,
	menu: <path d="M4 7h16M4 12h16M4 17h16" />,
	logout: (
		<>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<path d="m16 17 5-5-5-5M21 12H9" />
		</>
	),
	edit: (
		<>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
		</>
	),
	trash: (
		<>
			<path d="M3 6h18" />
			<path d="M8 6V4h8v2M19 6l-1 14H6L5 6" />
		</>
	),
};

export type IconName = keyof typeof paths;

interface IconProps {
	name: IconName;
	size?: number;
	fill?: boolean;
	strokeWidth?: number;
	className?: string;
}

const Icon = ({ name, size = 18, fill = false, strokeWidth = 2, className }: IconProps) => (
	<svg
		aria-hidden="true"
		className={className}
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill={fill ? 'currentColor' : 'none'}
		stroke="currentColor"
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		{paths[name]}
	</svg>
);

export default Icon;
