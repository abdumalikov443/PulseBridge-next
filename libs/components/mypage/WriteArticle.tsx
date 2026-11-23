import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MySection from './MySection';
import { useArticleAccess } from '../../hooks/useArticleAccess';
import { SkeletonCards } from '../ui/Loaders';

const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle = () => {
	const access = useArticleAccess();
	const { t } = useTranslation('common');

	return (
		<MySection title="Write an article" subTitle="Share a short health tip with the community">
			{access.allowed === null && <SkeletonCards count={1} />}
			{access.allowed === false && (
				<p className="pb-empty">
					{access.reason && t(access.reason)}{' '}
					{access.link && (
						<Link href={access.link.href} className="pb-link">
							{t(access.link.label)}
						</Link>
					)}
				</p>
			)}
			{access.allowed && (
				<div className="pb-card pb-card--flat">
					<TuiEditor />
				</div>
			)}
		</MySection>
	);
};

export default WriteArticle;
