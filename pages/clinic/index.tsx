import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import ClinicCard from '../../libs/components/clinic/ClinicCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFilter from '../../libs/components/clinic/ClinicFilter';
import { useRouter } from 'next/router';
import { ClinicsInquiry } from '../../libs/types/clinic/clinic.input';
import { Clinic } from '../../libs/types/clinic/clinic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction, Message } from '../../libs/enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CLINICS } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_CLINIC } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const sortOptions: { id: string; name: string; sort: string; direction: Direction }[] = [
	{ id: 'new', name: 'New', sort: 'createdAt', direction: Direction.DESC },
	{ id: 'rank', name: 'Top Rated', sort: 'clinicRank', direction: Direction.DESC },
	{ id: 'likes', name: 'Most Liked', sort: 'clinicLikes', direction: Direction.DESC },
	{ id: 'doctors', name: 'Most Doctors', sort: 'clinicDoctors', direction: Direction.DESC },
];

const ClinicList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<ClinicsInquiry>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [clinics, setClinics] = useState<Clinic[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [sortingOpen, setSortingOpen] = useState(false);
	const [filterSortName, setFilterSortName] = useState('New');

	/** APOLLO REQUESTS **/
	const [likeTargetClinic] = useMutation(LIKE_TARGET_CLINIC);

	const { refetch: getClinicsRefetch } = useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setClinics(data?.getClinics?.list);
			setTotal(data?.getClinics?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/

	useEffect(() => {
		if (router.query.input) {
			const inputObj = JSON.parse(router?.query?.input as string);
			setSearchFilter(inputObj);
			setCurrentPage(inputObj.page ?? 1);
		}
	}, [router]);

	/** HANDLERS **/

	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		const input = { ...searchFilter, page: value };
		await router.push(`/clinic?input=${JSON.stringify(input)}`, `/clinic?input=${JSON.stringify(input)}`, {
			scroll: false,
		});
		setCurrentPage(value);
	};

	const likeClinicHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetClinic({ variables: { input: id } });
			await getClinicsRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeClinicHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		const option = sortOptions.find((ele) => ele.id === e.currentTarget.id);
		if (option) {
			setSearchFilter({ ...searchFilter, sort: option.sort, direction: option.direction });
			setFilterSortName(option.name);
		}
		setSortingOpen(false);
		setAnchorEl(null);
	};

	if (device === 'mobile') {
		return <h1>CLINICS MOBILE</h1>;
	} else {
		return (
			<div id="property-list-page" style={{ position: 'relative' }}>
				<div className="container">
					<Box component={'div'} className={'right'}>
						<span>Sort by</span>
						<div>
							<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
								{filterSortName}
							</Button>
							<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
								{sortOptions.map((option) => (
									<MenuItem
										key={option.id}
										onClick={sortingHandler}
										id={option.id}
										disableRipple
										sx={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
									>
										{option.name}
									</MenuItem>
								))}
							</Menu>
						</div>
					</Box>
					<Stack className={'property-page'}>
						<Stack className={'filter-config'}>
							<ClinicFilter searchFilter={searchFilter} initialInput={initialInput} />
						</Stack>
						<Stack className="main-config" mb={'76px'}>
							<Stack className={'list-config'}>
								{clinics?.length === 0 ? (
									<div className={'no-data'}>
										<img src="/img/icons/icoAlert.svg" alt="" />
										<p>No Clinics found!</p>
									</div>
								) : (
									clinics.map((clinic: Clinic) => {
										return <ClinicCard clinic={clinic} key={clinic?._id} likeClinicHandler={likeClinicHandler} />;
									})
								)}
							</Stack>
							<Stack className="pagination-config">
								{clinics.length !== 0 && (
									<Stack className="pagination-box">
										<Pagination
											page={currentPage}
											count={Math.ceil(total / searchFilter.limit)}
											onChange={handlePaginationChange}
											shape="circular"
											color="primary"
										/>
									</Stack>
								)}
								{clinics.length !== 0 && (
									<Stack className="total-result">
										<Typography>
											Total {total} clinic{total > 1 ? 's' : ''} available
										</Typography>
									</Stack>
								)}
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

ClinicList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(ClinicList);
