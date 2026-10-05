import React, { useState } from 'react';
import { NextPage } from 'next';
import { Button, Pagination, Stack, Typography } from '@mui/material';
import moment from 'moment';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ListRow from './ListRow';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Appointment } from '../../types/appointment/appointment';
import { AppointmentsInquiry } from '../../types/appointment/appointment.input';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { MemberType } from '../../enums/member.enum';
import { T } from '../../types/common';
import { getImageUrl, getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { UPDATE_APPOINTMENT } from '../../../apollo/user/mutation';
import {
	GET_CLINIC_APPOINTMENTS,
	GET_DOCTOR_APPOINTMENTS,
	GET_MY_APPOINTMENTS,
	GET_MY_DOCTOR_PROFILE,
} from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';

const statusTabs: AppointmentStatus[] = [
	AppointmentStatus.CONFIRMED,
	AppointmentStatus.COMPLETED,
	AppointmentStatus.CANCELLED,
];

// patient: own bookings; doctor: bookings with me; clinic: bookings of my clinic
const getAppointmentsQuery = (memberType: string) => {
	if (memberType === MemberType.DOCTOR) return { query: GET_DOCTOR_APPOINTMENTS, key: 'getDoctorAppointments' };
	if (memberType === MemberType.CLINIC) return { query: GET_CLINIC_APPOINTMENTS, key: 'getClinicAppointments' };
	return { query: GET_MY_APPOINTMENTS, key: 'getMyAppointments' };
};

const MyAppointments: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const isPatient = user.memberType === MemberType.PATIENT;
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const { query, key } = getAppointmentsQuery(user.memberType);
	const [searchFilter, setSearchFilter] = useState<AppointmentsInquiry>(initialInput);
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [total, setTotal] = useState<number>(0);
	// a doctor without a clinic has no appointments to manage
	const [doctorHasClinic, setDoctorHasClinic] = useState<boolean | null>(isDoctor ? null : true);

	/** APOLLO REQUESTS **/
	const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);

	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) => {
			setDoctorHasClinic(!!data?.getMyDoctorProfile?.clinicId);
		},
	});

	const { refetch: appointmentsRefetch } = useQuery(query, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !user._id || !doctorHasClinic,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAppointments(data?.[key]?.list ?? []);
			setTotal(data?.[key]?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/

	const statusChangeHandler = (appointmentStatus: AppointmentStatus) => {
		setSearchFilter({ ...searchFilter, page: 1, search: { ...searchFilter.search, appointmentStatus } });
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const updateStatusHandler = async (id: string, status: AppointmentStatus.COMPLETED | AppointmentStatus.CANCELLED) => {
		try {
			const action = status === AppointmentStatus.COMPLETED ? 'complete' : 'cancel';
			if (!(await sweetConfirmAlert(`Do you want to ${action} this appointment?`))) return;
			await updateAppointment({ variables: { input: { _id: id, appointmentStatus: status } } });
			await appointmentsRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const renderActions = (appointment: Appointment) => {
		if (appointment.appointmentStatus !== AppointmentStatus.CONFIRMED) return undefined;
		return (
			<Stack direction={'row'} gap={'6px'}>
				{!isPatient && (
					<Button
						size={'small'}
						variant={'contained'}
						onClick={() => updateStatusHandler(appointment._id, AppointmentStatus.COMPLETED)}
					>
						Complete
					</Button>
				)}
				<Button
					size={'small'}
					color={'error'}
					variant={'outlined'}
					onClick={() => updateStatusHandler(appointment._id, AppointmentStatus.CANCELLED)}
				>
					Cancel
				</Button>
			</Stack>
		);
	};

	if (device === 'mobile') {
		return <div>MY APPOINTMENTS MOBILE</div>;
	}

	if (doctorHasClinic === false) {
		return (
			<div id="my-property-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Appointments</Typography>
						<Typography className="sub-title">
							Join a clinic first: patients can book you only after a clinic approves your join request.
						</Typography>
					</Stack>
				</Stack>
			</div>
		);
	}

	return (
		<div id="my-property-page">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">Appointments</Typography>
					<Typography className="sub-title">
						{isPatient ? 'Your bookings with doctors' : 'Bookings made by patients'}
					</Typography>
				</Stack>
			</Stack>
			<Stack className="property-list-box">
				<Stack className="tab-name-box">
					{statusTabs.map((status: AppointmentStatus) => (
						<Typography
							key={status}
							onClick={() => statusChangeHandler(status)}
							className={searchFilter.search.appointmentStatus === status ? 'active-tab-name' : 'tab-name'}
						>
							{formatEnum(status)}
						</Typography>
					))}
				</Stack>
				<Stack className="list-box">
					<Stack className="listing-title-box">
						<Typography className="title-text">{isPatient ? 'Doctor' : 'Patient'}</Typography>
						<Typography className="title-text">Date</Typography>
						<Typography className="title-text">Status</Typography>
						<Typography className="title-text">Time</Typography>
						{searchFilter.search.appointmentStatus === AppointmentStatus.CONFIRMED && (
							<Typography className="title-text">Action</Typography>
						)}
					</Stack>
					{appointments.length === 0 ? (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No appointments found!</p>
						</div>
					) : (
						appointments.map((appointment: Appointment) => {
							const person = isPatient ? appointment.doctorData?.memberData : appointment.memberData;
							const doctorLine = isPatient
								? formatEnum(appointment.doctorData?.specialty)
								: `Dr. ${getMemberName(appointment.doctorData?.memberData)}`;
							return (
								<ListRow
									key={appointment._id}
									image={getImageUrl(person?.memberImage)}
									title={getMemberName(person)}
									subTitle={`${doctorLine} · ${appointment.clinicData?.clinicName ?? ''}`}
									extra={appointment.appointmentReason}
									dateText={moment.utc(appointment.appointmentDate).format('DD MMM, YYYY')}
									status={formatEnum(appointment.appointmentStatus)}
									count={appointment.appointmentTime}
									actions={renderActions(appointment)}
								/>
							);
						})
					)}
					{appointments.length !== 0 && (
						<Stack className="pagination-config">
							<Stack className="pagination-box">
								<Pagination
									count={Math.ceil(total / searchFilter.limit)}
									page={searchFilter.page}
									shape="circular"
									color="primary"
									onChange={paginationHandler}
								/>
							</Stack>
							<Stack className="total-result">
								<Typography>
									{total} appointment{total > 1 ? 's' : ''}
								</Typography>
							</Stack>
						</Stack>
					)}
				</Stack>
			</Stack>
		</div>
	);
};

MyAppointments.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'appointmentDate',
		direction: 'ASC',
		search: {
			appointmentStatus: AppointmentStatus.CONFIRMED,
		},
	},
};

export default MyAppointments;
