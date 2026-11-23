import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_NOTICES } from '../../../apollo/user/query';
import { FaqTopic, NoticeCategory } from '../../enums/notice.enum';
import { Notice } from '../../types/notice/notice';
import { formatEnum } from '../../utils';
import Icon from '../ui/Icon';
import { SkeletonCards } from '../ui/Loaders';

// one page is enough: FAQ lists stay short
const LIMIT = 50;

// published FAQ answers from the admin, grouped by topic (pinned first)
const Faq = () => {
	const { t } = useTranslation('common');
	const [topic, setTopic] = useState<FaqTopic | ''>('');

	const { data, loading, error } = useQuery(GET_NOTICES, {
		fetchPolicy: 'network-only',
		variables: {
			input: {
				page: 1,
				limit: LIMIT,
				search: { noticeCategory: NoticeCategory.FAQ, ...(topic && { faqTopic: topic }) },
			},
		},
	});
	const items: Notice[] = data?.getNotices?.list ?? [];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
			<div className="pb-pills" role="tablist" aria-label={t('FAQ topics')}>
				{(['', ...Object.values(FaqTopic)] as (FaqTopic | '')[]).map((value) => (
					<button
						key={value || 'all'}
						type="button"
						role="tab"
						aria-selected={topic === value}
						className={`pb-pill ${topic === value ? 'pb-pill--active' : ''}`}
						onClick={() => setTopic(value)}
					>
						{value ? formatEnum(value) : t('All')}
					</button>
				))}
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
				{loading && !data && <SkeletonCards count={3} />}
				{!loading && (error || items.length === 0) && (
					<p className="pb-empty">{t('No questions in this topic yet.')}</p>
				)}
				{items.map((item, index) => (
					<details
						key={item._id}
						className="pb-faq pb-in"
						open={index === 0}
						style={{ animationDelay: `${index * 0.06}s` }}
					>
						<summary>
							{item.noticeTitle}
							<Icon name="arrow" size={16} />
						</summary>
						<p style={{ whiteSpace: 'pre-line' }}>{item.noticeContent}</p>
					</details>
				))}
			</div>
		</div>
	);
};

export default Faq;
