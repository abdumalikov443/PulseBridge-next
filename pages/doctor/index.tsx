import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack, Box, Button, Pagination } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import DoctorCard from '../../libs/components/common/DoctorCard';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Doctor } from '../../libs/types/doctor/doctor';
import { DoctorsInquiry } from '../../libs/types/doctor/doctor.input';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useMutation, useQuery } from '@apollo/client';
import { GET_DOCTORS } from '../../apollo/user/query';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';
import { DoctorSpecialty } from '../../libs/enums/doctor.enum';
import { Direction } from '../../libs/enums/common.enum';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const sortOptions: { id: string; name: string; sort: string; direction: Direction }[] = [
	{ id: 'recent', name: 'Recent', sort: 'createdAt', direction: Direction.DESC },
	{ id: 'rank', name: 'Top Rated', sort: 'doctorRank', direction: Direction.DESC },
	{ id: 'likes', name: 'Likes', sort: 'doctorLikes', direction: Direction.DESC },
	{ id: 'views', name: 'Views', sort: 'doctorViews', direction: Direction.DESC },
	{ id: 'experience', name: 'Experience', sort: 'experience', direction: Direction.DESC },
];

const DoctorList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [filterSortName, setFilterSortName] = useState('Recent');
	const [sortingOpen, setSortingOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [specialtyAnchorEl, setSpecialtyAnchorEl] = useState<null | HTMLElement>(null);
	const [searchFilter, setSearchFilter] = useState<DoctorsInquiry>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [likeTargetDoctor] = useMutation(LIKE_TARGET_DOCTOR);

	const { refetch: getDoctorsRefetch } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.getDoctors?.list);
			setTotal(data?.getDoctors?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/

	useEffect(() => {
		if (router.query.input) {
			const input_obj = JSON.parse(router?.query?.input as string);
			setSearchFilter(input_obj);
			setSearchText(input_obj?.search?.text ?? '');
			setCurrentPage(input_obj.page ?? 1);
		} else
			router.replace(`/doctor?input=${JSON.stringify(searchFilter)}`, `/doctor?input=${JSON.stringify(searchFilter)}`);
	}, [router]);

	/** HANDLERS **/

	const pushFilter = async (input: DoctorsInquiry) => {
		await router.push(`/doctor?input=${JSON.stringify(input)}`, `/doctor?input=${JSON.stringify(input)}`, {
			scroll: false,
		});
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

	const specialtyHandler = async (specialty: DoctorSpecialty | null) => {
		const search = { ...searchFilter.search };
		if (specialty) search.specialtyList = [specialty];
		else delete search.specialtyList;
		setSpecialtyAnchorEl(null);
		await pushFilter({ ...searchFilter, page: 1, search });
	};

	const paginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		await pushFilter({ ...searchFilter, page: value });
		setCurrentPage(value);
	};

	const likeDoctorHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetDoctor({ variables: { input: id } });
			await getDoctorsRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeDoctorHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <h1>DOCTORS PAGE MOBILE</h1>;
	} else {
		return (
			<Stack className={'agent-list-page'}>
				<Stack className={'container'}>
					<Stack className={'filter'}>
						<Box component={'div'} className={'left'}>
							<input
								type="text"
								placeholder={'Search for a doctor'}
								value={searchText}
								onChange={(e: any) => setSearchText(e.target.value)}
								onKeyDown={(event: any) => {
									if (event.key == 'Enter') {
										const search: T = { ...searchFilter.search, text: searchText };
										if (!searchText) delete search.text;
										pushFilter({ ...searchFilter, page: 1, search }).then();
									}
								}}
							/>
						</Box>
						<Box component={'div'} className={'right'}>
							<span>Specialty</span>
							<div>
								<Button
									onClick={(e: MouseEvent<HTMLElement>) => setSpecialtyAnchorEl(e.currentTarget)}
									endIcon={<KeyboardArrowDownRoundedIcon />}
								>
									{searchFilter?.search?.specialtyList?.[0] ? formatEnum(searchFilter.search.specialtyList[0]) : 'All'}
								</Button>
								<Menu
									anchorEl={specialtyAnchorEl}
									open={Boolean(specialtyAnchorEl)}
									onClose={() => setSpecialtyAnchorEl(null)}
									sx={{ paddingTop: '5px' }}
								>
									<MenuItem onClick={() => specialtyHandler(null)} disableRipple>
										All
									</MenuItem>
									{Object.values(DoctorSpecialty).map((specialty: DoctorSpecialty) => (
										<MenuItem key={specialty} onClick={() => specialtyHandler(specialty)} disableRipple>
											{formatEnum(specialty)}
										</MenuItem>
									))}
								</Menu>
							</div>
							<span>Sort by</span>
							<div>
								<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
									{filterSortName}
								</Button>
								<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
									{sortOptions.map((option) => (
										<MenuItem key={option.id} onClick={sortingHandler} id={option.id} disableRipple>
											{option.name}
										</MenuItem>
									))}
								</Menu>
							</div>
						</Box>
					</Stack>
					<Stack className={'card-wrap'}>
						{doctors?.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No Doctors found!</p>
							</div>
						) : (
							doctors.map((doctor: Doctor) => {
								return <DoctorCard doctor={doctor} key={doctor._id} likeDoctorHandler={likeDoctorHandler} />;
							})
						)}
					</Stack>
					<Stack className={'pagination'}>
						<Stack className="pagination-box">
							{doctors.length !== 0 && Math.ceil(total / searchFilter.limit) > 1 && (
								<Stack className="pagination-box">
									<Pagination
										page={currentPage}
										count={Math.ceil(total / searchFilter.limit)}
										onChange={paginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Stack>
							)}
						</Stack>

						{doctors.length !== 0 && (
							<span>
								Total {total} doctor{total > 1 ? 's' : ''} available
							</span>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

DoctorList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(DoctorList);
