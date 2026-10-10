import React from 'react';
import { useTranslation } from 'next-i18next';
import { Dialog } from '@mui/material';
import FollowList, { FollowTarget } from './FollowList';
import { formatCount } from '../ui/ActionChips';
import Icon from '../ui/Icon';

export type FollowMode = 'followers' | 'followings';

interface FollowModalProps {
	// whose followers (a doctor / clinic); without it only the "Following" list is shown
	target?: FollowTarget;
	// whose followings (the member behind the profile)
	memberId: string;
	mode: FollowMode | null;
	counts: Partial<Record<FollowMode, number>>;
	onMode: (mode: FollowMode) => void;
	onClose: () => void;
}

const FollowModal = ({ target, memberId, mode, counts, onMode, onClose }: FollowModalProps) => {
	const { t } = useTranslation('common');
	const modes: FollowMode[] = target ? ['followers', 'followings'] : ['followings'];

	return (
		<Dialog
			open={!!mode}
			onClose={onClose}
			PaperProps={{ className: 'pb-follow-modal' }}
			aria-labelledby="follow-modal-title"
		>
			<div className="pb-follow-modal__head">
				<h2 id="follow-modal-title" className="pb-sr">
					{mode === 'followers' ? t('Followers') : t('Following')}
				</h2>
				<div className="pb-follow-modal__tabs" role="tablist">
					{modes.map((item) => (
						<button
							key={item}
							type="button"
							role="tab"
							aria-selected={mode === item}
							className={`pb-pill ${mode === item ? 'pb-pill--active' : ''}`}
							onClick={() => onMode(item)}
						>
							{item === 'followers' ? t('Followers') : t('Following')} · {formatCount(counts[item] ?? 0)}
						</button>
					))}
				</div>
				<button type="button" className="pb-drawer__close" aria-label={t('Close')} onClick={onClose}>
					<Icon name="close" size={18} />
				</button>
			</div>
			<div className="pb-follow-modal__body">
				{mode === 'followers' && target && <FollowList key="followers" mode="followers" target={target} />}
				{mode === 'followings' && <FollowList key="followings" mode="followings" memberId={memberId} />}
			</div>
		</Dialog>
	);
};

export default FollowModal;
