import React, { useState } from 'react';
import { NextPage } from 'next';
import { Button, OutlinedInput, Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ListRow from './ListRow';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { ClinicJoinRequest, Doctor } from '../../types/doctor/doctor';
import { Clinic } from '../../types/clinic/clinic';
import { OrdinaryInquiry, T } from '../../types/common';
import { JoinRequestStatus } from '../../enums/doctor.enum';
import { MemberType } from '../../enums/member.enum';
import { DEFAULT_CLINIC_IMAGE, getImageUrl, getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { CANCEL_JOIN_REQUEST, REQUEST_JOIN_CLINIC, RESPOND_JOIN_REQUEST } from '../../../apollo/user/mutation';
import {
	GET_CLINIC_JOIN_REQUESTS,
	GET_CLINICS,
	GET_MY_DOCTOR_PROFILE,
	GET_MY_JOIN_REQUESTS,
} from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';

// DOCTOR: ask a clinic to join (one pending request at a time); CLINIC: approve or reject pending requests
const JoinRequests: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 5 });
	const [requests, setRequests] = useState<ClinicJoinRequest[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
	const [searchText, setSearchText] = useState<string>('');
	const [clinicSearch, setClinicSearch] = useState<string>('');
	const [clinics, setClinics] = useState<Clinic[]>([]);
	const resultKey = isDoctor ? 'getMyJoinRequests' : 'getClinicJoinRequests';

	/** APOLLO REQUESTS **/
	const [requestJoinClinic] = useMutation(REQUEST_JOIN_CLINIC);
	const [cancelJoinRequest] = useMutation(CANCEL_JOIN_REQUEST);
	const [respondJoinRequest] = useMutation(RESPOND_JOIN_REQUEST);

	const { refetch: doctorProfileRefetch } = useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) => setDoctorProfile(data?.getMyDoctorProfile ?? null),
	});

	const { refetch: requestsRefetch } = useQuery(isDoctor ? GET_MY_JOIN_REQUESTS : GET_CLINIC_JOIN_REQUESTS, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		skip: !user._id,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setRequests(data?.[resultKey]?.list ?? []);
			setTotal(data?.[resultKey]?.metaCounter[0]?.total ?? 0);
		},
	});

	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 5, sort: 'clinicRank', direction: 'DESC', search: { text: clinicSearch } } },
		skip: !isDoctor || !clinicSearch,
		onCompleted: (data: T) => setClinics(data?.getClinics?.list ?? []),
	});

	const hasPending = isDoctor && requests.some((ele) => ele.requestStatus === JoinRequestStatus.PENDING);
	const canRequest = isDoctor && !doctorProfile?.clinicId && !hasPending;

	/** HANDLERS **/

	const refreshAll = async () => {
		await requestsRefetch({ input: inquiry });
		if (isDoctor) await doctorProfileRefetch();
	};

	const requestHandler = async (clinic: Clinic) => {
		try {
			if (!(await sweetConfirmAlert(`Send a join request to ${clinic.clinicName}?`))) return;
			await requestJoinClinic({ variables: { input: clinic._id } });
			await refreshAll();
			await sweetTopSmallSuccessAlert('Request sent!', 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const cancelHandler = async (requestId: string) => {
		try {
			if (!(await sweetConfirmAlert('Cancel this join request?'))) return;
			await cancelJoinRequest({ variables: { input: requestId } });
			await refreshAll();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const respondHandler = async (requestId: string, requestStatus: JoinRequestStatus) => {
		try {
			const action = requestStatus === JoinRequestStatus.APPROVED ? 'approve' : 'reject';
			if (!(await sweetConfirmAlert(`Do you want to ${action} this doctor?`))) return;
			await respondJoinRequest({ variables: { input: { _id: requestId, requestStatus } } });
			await refreshAll();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const renderDoctorRequest = (request: ClinicJoinRequest) => (
		<ListRow
			key={request._id}
			image={getImageUrl(request.clinicData?.clinicImage, DEFAULT_CLINIC_IMAGE)}
			title={request.clinicData?.clinicName ?? ''}
			subTitle={request.clinicData?.clinicAddress}
			date={request.createdAt}
			status={formatEnum(request.requestStatus)}
			count={formatEnum(request.clinicData?.clinicType)}
			onClick={() => request.clinicData && router.push(`/clinic/detail?id=${request.clinicData._id}`)}
			actions={
				request.requestStatus === JoinRequestStatus.PENDING ? (
					<Button size={'small'} color={'error'} variant={'outlined'} onClick={() => cancelHandler(request._id)}>
						Cancel
					</Button>
				) : undefined
			}
		/>
	);

	const renderClinicRequest = (request: ClinicJoinRequest) => (
		<ListRow
			key={request._id}
			image={getImageUrl(request.doctorData?.memberData?.memberImage)}
			title={getMemberName(request.doctorData?.memberData)}
			subTitle={`${request.doctorData?.experience ?? 0} years experience`}
			extra={request.doctorData?.memberData?.memberPhone}
			date={request.createdAt}
			status={formatEnum(request.requestStatus)}
			count={formatEnum(request.doctorData?.specialty)}
			actions={
				<Stack direction={'row'} gap={'6px'}>
					<Button
						size={'small'}
						variant={'contained'}
						onClick={() => respondHandler(request._id, JoinRequestStatus.APPROVED)}
					>
						Approve
					</Button>
					<Button
						size={'small'}
						color={'error'}
						variant={'outlined'}
						onClick={() => respondHandler(request._id, JoinRequestStatus.REJECTED)}
					>
						Reject
					</Button>
				</Stack>
			}
		/>
	);

	if (device === 'mobile') {
		return <div>JOIN REQUESTS MOBILE</div>;
	}

	return (
		<div id="my-property-page">
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">Join Requests</Typography>
					<Typography className="sub-title">
						{isDoctor
							? doctorProfile?.clinicData
								? `You work at ${doctorProfile.clinicData.clinicName}`
								: 'You do not work in a clinic yet. Find a clinic and send a join request.'
							: 'Doctors waiting for your approval'}
					</Typography>
				</Stack>
			</Stack>

			{canRequest && (
				<Stack className="property-list-box" mb={'24px'}>
					<Stack direction={'row'} gap={'8px'} alignItems={'center'}>
						<OutlinedInput
							size={'small'}
							value={searchText}
							placeholder={'Search clinic by name'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(e: any) => e.key === 'Enter' && setClinicSearch(searchText.trim())}
						/>
						<Button variant={'outlined'} onClick={() => setClinicSearch(searchText.trim())}>
							Search
						</Button>
					</Stack>
					{clinicSearch &&
						clinics.map((clinic: Clinic) => (
							<ListRow
								key={clinic._id}
								image={getImageUrl(clinic.clinicImage, DEFAULT_CLINIC_IMAGE)}
								title={clinic.clinicName}
								subTitle={clinic.clinicAddress}
								date={clinic.createdAt}
								status={formatEnum(clinic.clinicType)}
								count={`${clinic.clinicDoctors} doctors`}
								actions={
									<Button size={'small'} variant={'contained'} onClick={() => requestHandler(clinic)}>
										Request
									</Button>
								}
							/>
						))}
				</Stack>
			)}

			<Stack className="property-list-box">
				<Stack className="list-box">
					<Stack className="listing-title-box">
						<Typography className="title-text">{isDoctor ? 'Clinic' : 'Doctor'}</Typography>
						<Typography className="title-text">Requested</Typography>
						<Typography className="title-text">Status</Typography>
						<Typography className="title-text">{isDoctor ? 'Type' : 'Specialty'}</Typography>
						<Typography className="title-text">Action</Typography>
					</Stack>
					{requests.length === 0 ? (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No join requests!</p>
						</div>
					) : (
						requests.map((request) => (isDoctor ? renderDoctorRequest(request) : renderClinicRequest(request)))
					)}
					{requests.length !== 0 && (
						<Stack className="pagination-config">
							<Stack className="pagination-box">
								<Pagination
									count={Math.ceil(total / inquiry.limit)}
									page={inquiry.page}
									shape="circular"
									color="primary"
									onChange={(e: T, value: number) => setInquiry({ ...inquiry, page: value })}
								/>
							</Stack>
						</Stack>
					)}
				</Stack>
			</Stack>
		</div>
	);
};

export default JoinRequests;
