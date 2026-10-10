import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { GET_NOTICES } from '../../../apollo/user/query';
import { NoticeCategory } from '../../enums/notice.enum';
import { Notice as NoticeItem } from '../../types/notice/notice';
import Icon from '../ui/Icon';
import { SkeletonCards } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

const LIMIT = 10;

// published platform notices (pinned first, then newest); a notice opens to show its text
const Notice = () => {
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);

	const { data, loading, error } = useQuery(GET_NOTICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page, limit: LIMIT, search: { noticeCategory: NoticeCategory.NOTICE } } },
	});
	const notices: NoticeItem[] = data?.getNotices?.list ?? [];
	const total: number = data?.getNotices?.metaCounter?.[0]?.total ?? 0;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
			{loading && !data && <SkeletonCards count={3} />}
			{!loading && (error || notices.length === 0) && <p className="pb-empty">{t('No notices yet.')}</p>}
			{notices.map((notice, index) => (
				<details key={notice._id} className="pb-faq pb-notice pb-in" style={{ animationDelay: `${index * 0.06}s` }}>
					<summary>
						<span className="pb-notice__main">
							{notice.noticePinned && (
								<span className="pb-badge pb-badge--warning">
									<Icon name="pin" size={12} /> {t('Pinned')}
								</span>
							)}
							<span className="pb-notice__title">{notice.noticeTitle}</span>
						</span>
						<time className="pb-notice__date" dateTime={moment(notice.createdAt).toISOString()}>
							{moment(notice.createdAt).format('YYYY-MM-DD')}
						</time>
						<Icon name="arrow" size={16} />
					</summary>
					<p style={{ whiteSpace: 'pre-line' }}>{notice.noticeContent}</p>
				</details>
			))}
			<PbPagination page={page} total={total} limit={LIMIT} onChange={setPage} scrollTop={false} />
		</div>
	);
};

export default Notice;
