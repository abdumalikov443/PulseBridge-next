import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import AdminTotal from '../../../libs/components/admin/AdminTotal';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, MenuItem } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import { TabContext } from '@mui/lab';
import TablePagination from '@mui/material/TablePagination';
import CommunityArticleList from '../../../libs/components/admin/community/CommunityArticleList';
import { AllArticlesInquiry } from '../../../libs/types/article/article.input';
import { Article } from '../../../libs/types/article/article';
import { ArticleStatus } from '../../../libs/enums/article.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { ArticleUpdate } from '../../../libs/types/article/article.update';
import { REMOVE_ARTICLE_BY_ADMIN, UPDATE_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';

const AdminCommunity: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<any>([]);
	const [communityInquiry, setCommunityInquiry] = useState<AllArticlesInquiry>(initialInquiry);
	const [articles, setArticles] = useState<Article[]>([]);
	const [articleTotal, setArticleTotal] = useState<number>(0);
	const [value, setValue] = useState(
		communityInquiry?.search?.articleStatus ? communityInquiry?.search?.articleStatus : 'ALL',
	);

	/** APOLLO REQUESTS **/
	const [ updateArticleByAdmin ] = useMutation(UPDATE_ARTICLE_BY_ADMIN);
	const [ removeArticleByAdmin ] = useMutation(REMOVE_ARTICLE_BY_ADMIN);

	const {
		loading: getAllArticlesByAdminLoading,
		data: getAllArticlesByAdminData, 
		error: getAllArticlesByAdminError, 
		refetch: getAllArticlesByAdminRefetch 
	} = useQuery(GET_ALL_ARTICLES_BY_ADMIN, {
		fetchPolicy: "network-only",
		variables: { input: communityInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => { 
			setArticles(data?.getAllArticlesByAdmin?.list);
			setArticleTotal(data?.getAllArticlesByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		getAllArticlesByAdminRefetch({ input: communityInquiry }).then();
	}, [communityInquiry]);

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		communityInquiry.page = newPage + 1;
		await getAllArticlesByAdminRefetch({ input: communityInquiry });
		setCommunityInquiry({ ...communityInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		communityInquiry.limit = parseInt(event.target.value, 10);
		communityInquiry.page = 1;
		await getAllArticlesByAdminRefetch({ input: communityInquiry });
		setCommunityInquiry({ ...communityInquiry });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
		setValue(newValue);

		setCommunityInquiry({ ...communityInquiry, page: 1, sort: 'createdAt' });

		switch (newValue) {
			case 'ACTIVE':
				setCommunityInquiry({ ...communityInquiry, search: { articleStatus: ArticleStatus.ACTIVE } });
				break;
			case 'DELETE':
				setCommunityInquiry({ ...communityInquiry, search: { articleStatus: ArticleStatus.DELETE } });
				break;
			default:
				delete communityInquiry?.search?.articleStatus;
				setCommunityInquiry({ ...communityInquiry });
				break;
		}
	};

	const updateArticleHandler = async (updateData: ArticleUpdate) => {
		try {
			await updateArticleByAdmin({
				variables: { input: updateData }
			});

			menuIconCloseHandler();
			await getAllArticlesByAdminRefetch({ input: communityInquiry });
		} catch (err: any) {
			menuIconCloseHandler();
			sweetErrorHandling(err).then();
		}
	};

	const removeArticleHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('are you sure to remove?')) {
				await removeArticleByAdmin({
					variables: { input: id }
				});

				await getAllArticlesByAdminRefetch({ input: communityInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};


	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Article List
				<AdminTotal total={articleTotal} noun="article" />
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									onClick={(e:any) => tabChangeHandler(e, 'ALL')}
									value="ALL"
									className={value === 'ALL' ? 'li on' : 'li'}
								>
									All
								</ListItem>
								<ListItem
									onClick={(e:any) => tabChangeHandler(e, 'ACTIVE')}
									value="ACTIVE"
									className={value === 'ACTIVE' ? 'li on' : 'li'}
								>
									Active
								</ListItem>
								<ListItem
									onClick={(e:any) => tabChangeHandler(e, 'DELETE')}
									value="DELETE"
									className={value === 'DELETE' ? 'li on' : 'li'}
								>
									Delete
								</ListItem>
							</List>
							<Divider />
							<Divider />
						</Box>
						<CommunityArticleList
							articles={articles}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateArticleHandler={updateArticleHandler}
							removeArticleHandler={removeArticleHandler}
						/>

						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={articleTotal}
							rowsPerPage={communityInquiry?.limit}
							page={communityInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminCommunity.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminCommunity);
