import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { TabContext, TabList } from '@mui/lab';
import { Stack, Tab, Typography, Button, Pagination } from '@mui/material';
import CommunityCard from '../../libs/components/common/CommunityCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Article } from '../../libs/types/article/article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ArticlesInquiry } from '../../libs/types/article/article.input';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ARTICLES } from '../../apollo/user/query';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// articles have no categories: tabs switch the sort order
const tabs: { value: string; label: string; subTitle: string }[] = [
	{ value: 'createdAt', label: 'Latest', subTitle: 'Fresh posts from our health community' },
	{ value: 'articleViews', label: 'Popular', subTitle: 'The most read articles' },
	{ value: 'articleLikes', label: 'Most Liked', subTitle: 'Articles our members liked the most' },
];

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchCommunity, setSearchCommunity] = useState<ArticlesInquiry>(initialInput);
	const [articles, setArticles] = useState<Article[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const activeTab = tabs.find((tab) => tab.value === searchCommunity.sort) ?? tabs[0];

	/** APOLLO REQUESTS **/
	const [likeTargetArticle] = useMutation(LIKE_TARGET_ARTICLE);

	const { refetch: articlesRefetch } = useQuery(GET_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getArticles?.list);
			setTotalCount(data?.getArticles?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/

	useEffect(() => {
		const sort = router.query?.sort as string;
		if (sort && tabs.some((tab) => tab.value === sort)) {
			setSearchCommunity({ ...searchCommunity, page: 1, sort });
		}
	}, [router.query?.sort]);

	/** HANDLERS **/

	const tabChangeHandler = async (e: T, value: string) => {
		setSearchCommunity({ ...searchCommunity, page: 1, sort: value });
		await router.push({ pathname: '/community', query: { sort: value } }, undefined, { shallow: true });
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticleHandler = async (e: any, user: T, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetArticle({ variables: { input: id } });
			await articlesRefetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <h1>COMMUNITY PAGE MOBILE</h1>;
	} else {
		return (
			<div id="community-list-page">
				<div className="container">
					<TabContext value={activeTab.value}>
						<Stack className="main-box">
							<Stack className="left-config">
								<Stack className={'image-info'}>
									<img src={'/img/logo/logoText.svg'} />
									<Stack className={'community-name'}>
										<Typography className={'name'}>PulseBridge Community</Typography>
									</Stack>
								</Stack>
								<TabList
									orientation="vertical"
									aria-label="community sort tabs"
									TabIndicatorProps={{
										style: { display: 'none' },
									}}
									onChange={tabChangeHandler}
								>
									{tabs.map((tab) => (
										<Tab
											key={tab.value}
											value={tab.value}
											label={tab.label}
											className={`tab-button ${activeTab.value === tab.value ? 'active' : ''}`}
										/>
									))}
								</TabList>
							</Stack>
							<Stack className="right-config">
								<Stack className="panel-config">
									<Stack className="title-box">
										<Stack className="left">
											<Typography className="title">{activeTab.label} Articles</Typography>
											<Typography className="sub-title">{activeTab.subTitle}</Typography>
										</Stack>
										<Button
											onClick={() =>
												router.push({
													pathname: '/mypage',
													query: {
														category: 'writeArticle',
													},
												})
											}
											className="right"
										>
											Write
										</Button>
									</Stack>
									<Stack className="list-box" sx={{ padding: '24px' }}>
										{totalCount ? (
											articles?.map((article: Article) => {
												return <CommunityCard article={article} key={article?._id} likeArticleHandler={likeArticleHandler} />;
											})
										) : (
											<Stack className={'no-data'}>
												<img src="/img/icons/icoAlert.svg" alt="" />
												<p>No Article found!</p>
											</Stack>
										)}
									</Stack>
								</Stack>
							</Stack>
						</Stack>
					</TabContext>
					{totalCount > 0 && (
						<Stack className="pagination-config">
							<Stack className="pagination-box">
								<Pagination
									count={Math.ceil(totalCount / searchCommunity.limit)}
									page={searchCommunity.page}
									shape="circular"
									color="primary"
									onChange={paginationHandler}
								/>
							</Stack>
							<Stack className="total-result">
								<Typography>
									Total {totalCount} article{totalCount > 1 ? 's' : ''} available
								</Typography>
							</Stack>
						</Stack>
					)}
				</div>
			</div>
		);
	}
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(Community);
