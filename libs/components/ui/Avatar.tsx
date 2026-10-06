import React from 'react';
import { REACT_APP_API_URL } from '../../config';

const tints = ['var(--pb-soft-1)', 'var(--pb-soft-2)', 'var(--pb-soft-3)', 'var(--pb-soft-4)'];

interface AvatarProps {
	name?: string;
	image?: string | null;
	size?: number;
	radius?: number | string;
}

// member photo, or initials on a soft tint picked from the name
const Avatar = ({ name = '', image, size = 52, radius = '50%' }: AvatarProps) => {
	const initials = name
		.replace(/^Dr\.?\s+/i, '')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
	const tint = tints[(name.length || 1) % tints.length];

	return (
		<span
			className="pb-avatar"
			style={{ width: size, height: size, borderRadius: radius, background: tint, fontSize: Math.round(size * 0.34) }}
		>
			{image ? <img src={`${REACT_APP_API_URL}/${image}`} alt="" /> : initials || '?'}
		</span>
	);
};

export default Avatar;
