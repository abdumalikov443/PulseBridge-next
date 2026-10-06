import React from 'react';
import dynamic from 'next/dynamic';
import MySection from './MySection';

const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle = () => (
	<MySection title="Write an article" subTitle="Share a short health tip or a question with the community">
		<div className="pb-card pb-card--flat">
			<TuiEditor />
		</div>
	</MySection>
);

export default WriteArticle;
