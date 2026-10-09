import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Pagination } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { ClinicJoinRequest, Doctor } from '../../types/doctor/doctor';
import { Clinic } from '../../types/clinic/clinic';
import { OrdinaryInquiry, T } from '../../types/common';
import { JoinRequestStatus } from '../../enums/doctor.enum';
import { MemberType } from '../../enums/member.enum';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { CANCEL_JOIN_REQUEST, REQUEST_JOIN_CLINIC, RESPOND_JOIN_REQUEST } from '../../../apollo/user/mutation';
import { GET_CLINIC_JOIN_REQUESTS, GET_CLINICS, GET_MY_DOCTOR_PROFILE, GET_MY_JOIN_REQUESTS } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import ListRow, { Tone } from './ListRow';
import MySection from './MySection';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { SkeletonCards } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

const tones: Record<JoinRequestStatus, Tone> = {
	[JoinRequestStatus.PENDING]: 'warning',
	[JoinRequestStatus.APPROVED]: 'success',
	[JoinRequestStatus.REJECTED]: 'danger',
};

const clinicIcon = (
	<span className="pb-avatar" style={{ width: 46, height: 46, background: 'var(--pb-soft-1)', color: 'var(--pb-deep)', borderRadius: 14 }}>
		<Icon name="clinic" size={22} />
	</span>
);

// DOCTOR: ask a clinic to join (one pending request at a time); CLINIC: approve or reject pending requests
const JoinRequests = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const resultKey = isDoctor ? 'getMyJoinRequests' : 'getClinicJoinRequests';
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 6 });
	const [requests, setRequests] = useState<ClinicJoinRequest[] | null>(null);
	const [total, setTotal] = useState(0);
	const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
	const [searchText, setSearchText] = useState('');
	const [clinicSearch, setClinicSearch] = useState('');
	const [clinics, setClinics] = useState<Clinic[]>([]);

	/** APOLLO REQUESTS **/
	const [requestJoinClinic] = useMutation(REQUEST_JOIN_CLINIC);
	const [cancelJoinRequest] = useMutation(CANCEL_JOIN_REQUEST);
	const [respondJoinRequest] = useMutation(RESPOND_JOIN_REQUEST);

	const { refetch: profileRefetch } = useQuery(GET_MY_DOCTOR_PROFILE, {
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
			setTotal(data?.[resultKey]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setRequests([]),
	});

	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 5, sort: 'clinicRank', direction: 'DESC', search: { text: clinicSearch } } },
		skip: !isDoctor || !clinicSearch,
		onCompleted: (data: T) => setClinics(data?.getClinics?.list ?? []),
	});

	const hasPending = isDoctor && (requests ?? []).some((ele) => ele.requestStatus === JoinRequestStatus.PENDING);
	const canRequest = isDoctor && !doctorProfile?.clinicId && !hasPending;

	/** HANDLERS **/
	const refreshAll = async () => {
		await requestsRefetch({ input: inquiry });
		if (isDoctor) await profileRefetch();
	};

	const run = async (confirmText: string, action: () => Promise<unknown>, doneText?: string) => {
		try {
			if (!(await sweetConfirmAlert(confirmText))) return;
			await action();
			await refreshAll();
			if (doneText) await sweetTopSmallSuccessAlert(doneText, 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const subTitle = isDoctor
		? doctorProfile?.clinicData
			? `You work at ${doctorProfile.clinicData.clinicName}`
			: 'You do not work in a clinic yet. Find a clinic and send a join request.'
		: 'Doctors waiting for your approval';

	return (
		<MySection title="Join requests" subTitle={subTitle}>
			{canRequest && (
				<div className="pb-card pb-card--flat">
					<form
						className="pb-search"
						style={{ background: 'var(--pb-bg)' }}
						onSubmit={(e) => {
							e.preventDefault();
							setClinicSearch(searchText.trim());
						}}
					>
						<Icon name="search" />
						<label htmlFor="join-clinic-search" className="pb-sr">
							Search clinic by name
						</label>
						<input id="join-clinic-search" value={searchText} placeholder="Search clinic by name" onChange={(e) => setSearchText(e.target.value)} />
						<button type="submit" className="pb-btn pb-btn--primary pb-btn--sm">
							Search
						</button>
					</form>
					{clinicSearch && clinics.length === 0 && <p style={{ margin: 0, color: 'var(--pb-muted)' }}>No clinic found.</p>}
					{clinicSearch &&
						clinics.map((clinic) => (
							<ListRow
								key={clinic._id}
								avatar={clinicIcon}
								title={clinic.clinicName}
								subTitle={`${formatEnum(clinic.clinicType)} · ${clinic.clinicAddress}`}
								count={`${clinic.clinicDoctors} doctors`}
								date={clinic.createdAt}
								actions={
									<button
										type="button"
										className="pb-btn pb-btn--primary pb-btn--sm"
										onClick={() => run(`Send a join request to ${clinic.clinicName}?`, () => requestJoinClinic({ variables: { input: clinic._id } }), 'Request sent')}
									>
										Request
									</button>
								}
							/>
						))}
				</div>
			)}

			{requests === null && <SkeletonCards count={2} />}
			{requests?.length === 0 && <p className="pb-empty">No join requests.</p>}
			{requests?.map((request) =>
				isDoctor ? (
					<ListRow
						key={request._id}
						avatar={clinicIcon}
						title={request.clinicData?.clinicName ?? ''}
						subTitle={request.clinicData?.clinicAddress}
						date={request.createdAt}
						status={formatEnum(request.requestStatus)}
						tone={tones[request.requestStatus]}
						onClick={() => request.clinicData && router.push(`/clinic/detail?id=${request.clinicData._id}`)}
						actions={
							request.requestStatus === JoinRequestStatus.PENDING ? (
								<button type="button" className="pb-btn pb-btn--danger pb-btn--sm" onClick={() => run('Cancel this join request?', () => cancelJoinRequest({ variables: { input: request._id } }))}>
									Cancel
								</button>
							) : undefined
						}
					/>
				) : (
					<ListRow
						key={request._id}
						avatar={<Avatar name={getMemberName(request.doctorData?.memberData)} image={request.doctorData?.memberData?.memberImage} size={46} />}
						title={getMemberName(request.doctorData?.memberData)}
						subTitle={`${formatEnum(request.doctorData?.specialty)} · ${request.doctorData?.experience ?? 0} years experience`}
						extra={request.doctorData?.memberData?.memberPhone}
						date={request.createdAt}
						status={formatEnum(request.requestStatus)}
						tone={tones[request.requestStatus]}
						// the doctor has no clinic yet, so the review page is the member profile
						onClick={() => request.doctorData?.memberData && router.push(`/member?memberId=${request.doctorData.memberData._id}`)}
						actions={
							<>
								<button
									type="button"
									className="pb-btn pb-btn--outline pb-btn--sm"
									onClick={() => request.doctorData?.memberData && router.push(`/member?memberId=${request.doctorData.memberData._id}`)}
								>
									<Icon name="eye" size={14} /> Profile
								</button>
								<button
									type="button"
									className="pb-btn pb-btn--primary pb-btn--sm"
									onClick={() => run('Approve this doctor?', () => respondJoinRequest({ variables: { input: { _id: request._id, requestStatus: JoinRequestStatus.APPROVED } } }), 'Approved')}
								>
									Approve
								</button>
								<button
									type="button"
									className="pb-btn pb-btn--danger pb-btn--sm"
									onClick={() => run('Reject this doctor?', () => respondJoinRequest({ variables: { input: { _id: request._id, requestStatus: JoinRequestStatus.REJECTED } } }))}
								>
									Reject
								</button>
							</>
						}
					/>
				),
			)}

			<PbPagination page={inquiry.page} total={total} limit={inquiry.limit} onChange={(page) => setInquiry({ ...inquiry, page })} noun="request" />
		</MySection>
	);
};

export default JoinRequests;
