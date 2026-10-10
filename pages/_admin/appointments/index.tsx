import React, { useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import type { NextPage } from 'next';
import moment from 'moment';
import CopyId from '../../../libs/components/admin/CopyId';
import AdminTotal from '../../../libs/components/admin/AdminTotal';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import {
	Box,
	Divider,
	List,
	ListItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from '@mui/material';
import { useQuery } from '@apollo/client';
import { Appointment } from '../../../libs/types/appointment/appointment';
import { AppointmentsInquiry } from '../../../libs/types/appointment/appointment.input';
import { AppointmentStatus } from '../../../libs/enums/appointment.enum';
import { T } from '../../../libs/types/common';
import { getMemberName } from '../../../libs/config';
import { formatEnum } from '../../../libs/utils';
import { GET_ALL_APPOINTMENTS_BY_ADMIN } from '../../../apollo/admin/query';

// read-only overview: appointments are completed or cancelled by the patient, doctor or clinic owner
const AdminAppointments: NextPage = ({ initialInquiry, ...props }: any) => {
	const { t } = useTranslation('common');
	const [inquiry, setInquiry] = useState<AppointmentsInquiry>(initialInquiry);
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [value, setValue] = useState<string>('ALL');

	/** APOLLO REQUESTS **/
	useQuery(GET_ALL_APPOINTMENTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAppointments(data?.getAllAppointmentsByAdmin?.list ?? []);
			setTotal(data?.getAllAppointmentsByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/

	const tabChangeHandler = (newValue: string) => {
		setValue(newValue);
		const search: T = { ...inquiry.search, appointmentStatus: newValue };
		if (newValue === 'ALL') delete search.appointmentStatus;
		setInquiry({ ...inquiry, page: 1, search });
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('Appointment List')}
				<AdminTotal total={total} noun="appointment" />
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{['ALL', ...Object.values(AppointmentStatus)].map((status: string) => (
						<ListItem
							key={status}
							onClick={() => tabChangeHandler(status)}
							className={value === status ? 'li on' : 'li'}
						>
							{formatEnum(status)}
						</ListItem>
					))}
				</List>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 750 }} size={'medium'}>
						<TableHead>
							<TableRow>
								<TableCell align="left">{t('DATE')}</TableCell>
								<TableCell align="center">{t('TIME')}</TableCell>
								<TableCell align="center">{t('PATIENT')}</TableCell>
								<TableCell align="center">{t('DOCTOR')}</TableCell>
								<TableCell align="center">{t('CLINIC')}</TableCell>
								<TableCell align="center">{t('STATUS')}</TableCell>
								<TableCell align="left">{t('ID')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{appointments.length === 0 && (
								<TableRow>
									<TableCell align="center" colSpan={7}>
										<span className={'no-data'}>{t('No data found')}</span>
									</TableCell>
								</TableRow>
							)}
							{appointments.map((appointment: Appointment) => (
								<TableRow hover key={appointment._id}>
									<TableCell align="left">{moment.utc(appointment.appointmentDate).format('YYYY-MM-DD')}</TableCell>
									<TableCell align="center">{appointment.appointmentTime}</TableCell>
									<TableCell align="center">{getMemberName(appointment.memberData)}</TableCell>
									<TableCell align="center">{getMemberName(appointment.doctorData?.memberData)}</TableCell>
									<TableCell align="center">{appointment.clinicData?.clinicName}</TableCell>
									<TableCell align="center">
										<span className={`pb-admin-status pb-admin-status--${appointment.appointmentStatus.toLowerCase()}`}>
											{formatEnum(appointment.appointmentStatus)}
										</span>
									</TableCell>
									<TableCell align="left">
										<CopyId id={appointment._id} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					labelRowsPerPage={t('Rows per page:')}
					labelDisplayedRows={({ from, to, count }) => t('{{from}}–{{to}} of {{count}}', { from, to, count })}
					rowsPerPageOptions={[10, 20, 40]}
					component="div"
					count={total}
					rowsPerPage={inquiry.limit}
					page={inquiry.page - 1}
					onPageChange={(e: unknown, page: number) => setInquiry({ ...inquiry, page: page + 1 })}
					onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setInquiry({ ...inquiry, page: 1, limit: parseInt(e.target.value, 10) })
					}
				/>
			</Box>
		</Box>
	);
};

AdminAppointments.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'appointmentDate',
		direction: 'DESC',
		search: {},
	},
};

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

export default withAdminLayout(AdminAppointments);
