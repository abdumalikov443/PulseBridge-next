import React from 'react';
import { useTranslation } from 'next-i18next';
import Icon from './Icon';
import { formatCount } from './ActionChips';

// card stat icons (like, view, doctors) share one size so they read as one set
export const STAT_ICON = 16;

interface LikeButtonProps {
	likes: number;
	liked?: boolean;
	onLike?: () => void;
}

// heart + count, placed next to the card title; only the heart turns red when liked
const LikeButton = ({ likes, liked, onLike }: LikeButtonProps) => {
	const { t } = useTranslation('common');

	return (
		<button
			type="button"
			className={`pb-like ${liked ? 'is-liked' : ''}`}
			aria-pressed={!!liked}
			aria-label={liked ? t('Unlike') : t('Like')}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onLike && onLike();
			}}
		>
			<Icon name="heart" size={STAT_ICON} fill={!!liked} />
			<span>{formatCount(likes)}</span>
		</button>
	);
};

export default LikeButton;
