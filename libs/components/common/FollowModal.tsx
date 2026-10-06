import React from 'react';
import { Dialog } from '@mui/material';
import FollowList from './FollowList';
import { formatCount } from '../ui/ActionChips';
import Icon from '../ui/Icon';

export type FollowMode = 'followers' | 'followings';

interface FollowModalProps {
	memberId: string;
	mode: FollowMode | null;
	counts: Record<FollowMode, number>;
	onMode: (mode: FollowMode) => void;
	onClose: () => void;
}

// followers / following of a member in a popup, with a switch between the two lists
const FollowModal = ({ memberId, mode, counts, onMode, onClose }: FollowModalProps) => (
	<Dialog open={!!mode} onClose={onClose} PaperProps={{ className: 'pb-follow-modal' }} aria-labelledby="follow-modal-title">
		<div className="pb-follow-modal__head">
			<h2 id="follow-modal-title" className="pb-sr">
				{mode === 'followers' ? 'Followers' : 'Following'}
			</h2>
			<div className="pb-follow-modal__tabs" role="tablist">
				{(['followers', 'followings'] as FollowMode[]).map((item) => (
					<button key={item} type="button" role="tab" aria-selected={mode === item} className={`pb-pill ${mode === item ? 'pb-pill--active' : ''}`} onClick={() => onMode(item)}>
						{item === 'followers' ? 'Followers' : 'Following'} · {formatCount(counts[item])}
					</button>
				))}
			</div>
			<button type="button" className="pb-drawer__close" aria-label="Close" onClick={onClose}>
				<Icon name="close" size={18} />
			</button>
		</div>
		<div className="pb-follow-modal__body">{mode && <FollowList key={mode} mode={mode} memberId={memberId} />}</div>
	</Dialog>
);

export default FollowModal;
