import React from 'react';
import { useTranslation } from 'next-i18next';
import Icon from './Icon';

export const formatCount = (n: number = 0): string => {
	if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.0', '')}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
	return String(n);
};

interface ActionChipsProps {
	likes: number;
	views: number;
	liked?: boolean;
	onLike?: () => void;
	// detail pages and posts only
	comments?: number;
	followers?: number;
	following?: boolean;
	onFollow?: () => void;
	children?: React.ReactNode;
}

// like / view / (comment) / (followers) chips, plus an optional follow button
const ActionChips = (props: ActionChipsProps) => {
	const { likes, views, liked, onLike, comments, followers, following, onFollow, children } = props;
	const { t } = useTranslation('common');

	return (
		<div className="pb-actions">
			<button
				type="button"
				className={`pb-chip ${liked ? 'pb-chip--liked' : ''}`}
				aria-pressed={!!liked}
				aria-label={liked ? t('Unlike') : t('Like')}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onLike && onLike();
				}}
			>
				<Icon name="heart" size={16} fill={!!liked} />
				{formatCount(likes)}
			</button>
			<span className="pb-chip pb-chip--static" aria-label={t('{{count}} views', { count: views })}>
				<Icon name="eye" size={16} />
				{formatCount(views)}
			</span>
			{comments !== undefined && (
				<span className="pb-chip pb-chip--static" aria-label={t('{{count}} comments', { count: comments })}>
					<Icon name="comment" size={18} />
					{formatCount(comments)}
				</span>
			)}
			{followers !== undefined && (
				<span className="pb-chip pb-chip--static" aria-label={t('{{count}} followers', { count: followers })}>
					<Icon name="users" size={16} />
					{formatCount(followers)}
				</span>
			)}
			{onFollow && (
				<button
					type="button"
					className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
					aria-pressed={!!following}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onFollow();
					}}
					style={{ marginLeft: 'auto' }}
				>
					<Icon name={following ? 'userCheck' : 'userPlus'} size={16} />
					{following ? t('Following') : t('Follow')}
				</button>
			)}
			{children}
		</div>
	);
};

export default ActionChips;
