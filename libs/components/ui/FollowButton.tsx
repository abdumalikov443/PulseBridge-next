import React from 'react';
import { useTranslation } from 'next-i18next';
import Icon from './Icon';

interface FollowButtonProps {
	following: boolean;
	onClick: () => void;
}

// full-size follow button for profile headers, stacked with the main action
const FollowButton = ({ following, onClick }: FollowButtonProps) => {
	const { t } = useTranslation('common');
	return (
		<button
			type="button"
			className={`pb-btn pb-btn--block ${following ? 'pb-btn--soft' : 'pb-btn--outline'}`}
			aria-pressed={following}
			onClick={onClick}
		>
			<Icon name={following ? 'userCheck' : 'userPlus'} size={18} />
			{following ? t('Following') : t('Follow')}
		</button>
	);
};

export default FollowButton;
