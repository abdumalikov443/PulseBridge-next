import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import CommunityCard from './CommunityCard';
import { Article } from '../../types/article/article';
import { GET_ARTICLES } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';

// articles have no categories: popular (by views) on the left, latest on the right
const CommunityBoards = () => {
	const device = useDeviceDetect();
	const [popularArticles, setPopularArticles] = useState<Article[]>([]);
	const [latestArticles, setLatestArticles] = useState<Article[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 6, sort: 'articleViews', direction: 'DESC', search: {} } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setPopularArticles(data?.getArticles?.list);
		},
	});

	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: {} } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setLatestArticles(data?.getArticles?.list);
		},
	});

	if (device === 'mobile') {
		return <div>COMMUNITY BOARDS (MOBILE)</div>;
	} else {
		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Stack>
						<Typography variant={'h1'}>HEALTH COMMUNITY HIGHLIGHTS</Typography>
					</Stack>
					<Stack className="community-main">
						<Stack className={'community-left'}>
							<Stack className={'content-top'}>
								<Link href={'/community?sort=articleViews'}>
									<span>Popular</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap'}>
								{popularArticles.map((article, index) => {
									return <CommunityCard vertical={true} article={article} index={index} key={article?._id} />;
								})}
							</Stack>
						</Stack>
						<Stack className={'community-right'}>
							<Stack className={'content-top'}>
								<Link href={'/community'}>
									<span>Latest</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap vertical'}>
								{latestArticles.map((article, index) => {
									return <CommunityCard vertical={false} article={article} index={index} key={article?._id} />;
								})}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default CommunityBoards;
