import React, { useState } from 'react';
import type { NextPage } from 'next';
import AdminTotal from '../../../libs/components/admin/AdminTotal';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, List, ListItem, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import TablePagination from '@mui/material/TablePagination';
import { ClinicPanelList } from '../../../libs/components/admin/clinics/ClinicList';
import { AllClinicsInquiry } from '../../../libs/types/clinic/clinic.input';
import { Clinic } from '../../../libs/types/clinic/clinic';
import { ClinicStatus, ClinicType } from '../../../libs/enums/clinic.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { ClinicUpdate } from '../../../libs/types/clinic/clinic.update';
import { useMutation, useQuery } from '@apollo/client';
import { T } from '../../../libs/types/common';
import { formatEnum } from '../../../libs/utils';
import { REMOVE_CLINIC_BY_ADMIN, UPDATE_CLINIC_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_CLINICS_BY_ADMIN } from '../../../apollo/admin/query';

const AdminClinics: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
	const [clinicsInquiry, setClinicsInquiry] = useState<AllClinicsInquiry>(initialInquiry);
	const [clinics, setClinics] = useState<Clinic[]>([]);
	const [clinicsTotal, setClinicsTotal] = useState<number>(0);
	const [value, setValue] = useState<string>(clinicsInquiry?.search?.clinicStatus ?? 'ALL');
	const [searchType, setSearchType] = useState<string>('ALL');

	/** APOLLO REQUESTS **/
	const [updateClinicByAdmin] = useMutation(UPDATE_CLINIC_BY_ADMIN);
	const [removeClinicByAdmin] = useMutation(REMOVE_CLINIC_BY_ADMIN);

	const { refetch: getAllClinicsByAdminRefetch } = useQuery(GET_ALL_CLINICS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: clinicsInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setClinics(data?.getAllClinicsByAdmin?.list ?? []);
			setClinicsTotal(data?.getAllClinicsByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/

	const changePageHandler = async (event: unknown, newPage: number) => {
		setClinicsInquiry({ ...clinicsInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setClinicsInquiry({ ...clinicsInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = (newValue: string) => {
		setValue(newValue);
		const search: T = { ...clinicsInquiry.search, clinicStatus: newValue };
		if (newValue === 'ALL') delete search.clinicStatus;
		setClinicsInquiry({ ...clinicsInquiry, page: 1, search });
	};

	const searchTypeHandler = (newValue: string) => {
		setSearchType(newValue);
		const search: T = { ...clinicsInquiry.search, clinicType: newValue };
		if (newValue === 'ALL') delete search.clinicType;
		setClinicsInquiry({ ...clinicsInquiry, page: 1, search });
	};

	const removeClinicHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to remove?')) {
				await removeClinicByAdmin({ variables: { input: id } });
				await getAllClinicsByAdminRefetch({ input: clinicsInquiry });
			}
			menuIconCloseHandler();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const updateClinicHandler = async (updateData: ClinicUpdate) => {
		try {
			await updateClinicByAdmin({ variables: { input: updateData } });
			menuIconCloseHandler();
			await getAllClinicsByAdminRefetch({ input: clinicsInquiry });
		} catch (err: any) {
			menuIconCloseHandler();
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Clinic List
				<AdminTotal total={clinicsTotal} noun="clinic" />
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								{['ALL', ...Object.values(ClinicStatus)].map((status: string) => (
									<ListItem
										key={status}
										onClick={() => tabChangeHandler(status)}
										value={status}
										className={value === status ? 'li on' : 'li'}
									>
										{formatEnum(status)}
									</ListItem>
								))}
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<Select sx={{ width: '160px', mr: '20px' }} value={searchType}>
									<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
										ALL
									</MenuItem>
									{Object.values(ClinicType).map((type: string) => (
										<MenuItem value={type} onClick={() => searchTypeHandler(type)} key={type}>
											{type}
										</MenuItem>
									))}
								</Select>
							</Stack>
							<Divider />
						</Box>
						<ClinicPanelList
							clinics={clinics}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateClinicHandler={updateClinicHandler}
							removeClinicHandler={removeClinicHandler}
						/>
						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={clinicsTotal}
							rowsPerPage={clinicsInquiry?.limit}
							page={clinicsInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminClinics.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminClinics);
