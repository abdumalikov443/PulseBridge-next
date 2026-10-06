import React, { useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_MY_DOCTOR_PROFILE, GET_MY_JOIN_REQUESTS } from '../../../apollo/user/query';
import { CANCEL_JOIN_REQUEST, REQUEST_JOIN_CLINIC } from '../../../apollo/user/mutation';
import { ClinicJoinRequest, Doctor } from '../../types/doctor/doctor';
import { JoinRequestStatus } from '../../enums/doctor.enum';
import { MemberType } from '../../enums/member.enum';
import { T } from '../../types/common';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';

interface ClinicJoinButtonProps {
	clinicId: string;
	clinicName: string;
	onShowDoctors: () => void;
}

// main action on a clinic profile: doctors send a join request (one pending at a time), others browse its doctors
const ClinicJoinButton = ({ clinicId, clinicName, onShowDoctors }: ClinicJoinButtonProps) => {
	const user = useReactiveVar(userVar);
	const isDoctor = user?.memberType === MemberType.DOCTOR;
	const [profile, setProfile] = useState<Doctor | null | undefined>(undefined);
	const [requests, setRequests] = useState<ClinicJoinRequest[] | null>(null);
	const [busy, setBusy] = useState(false);

	/** APOLLO REQUESTS **/
	const [requestJoinClinic] = useMutation(REQUEST_JOIN_CLINIC);
	const [cancelJoinRequest] = useMutation(CANCEL_JOIN_REQUEST);

	const { refetch: profileRefetch } = useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) => setProfile(data?.getMyDoctorProfile ?? null),
		onError: () => setProfile(null),
	});

	const { refetch: requestsRefetch } = useQuery(GET_MY_JOIN_REQUESTS, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		variables: { input: { page: 1, limit: 20 } },
		onCompleted: (data: T) => setRequests(data?.getMyJoinRequests?.list ?? []),
		onError: () => setRequests([]),
	});

	if (!isDoctor) {
		return (
			<button type="button" className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block" onClick={onShowDoctors}>
				Choose a doctor <Icon name="arrow" className="pb-arrow" />
			</button>
		);
	}

	if (profile === undefined || requests === null) {
		return (
			<button type="button" className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block" disabled>
				<EcgLine small width={44} />
			</button>
		);
	}

	const pending = requests.find((ele) => ele.requestStatus === JoinRequestStatus.PENDING);

	/** HANDLERS **/
	const run = async (confirmText: string, action: () => Promise<unknown>, doneText: string) => {
		try {
			if (!(await sweetConfirmAlert(confirmText))) return;
			setBusy(true);
			await action();
			await Promise.all([requestsRefetch(), profileRefetch()]).then(([res, prof]) => {
				setRequests(res.data?.getMyJoinRequests?.list ?? []);
				setProfile(prof.data?.getMyDoctorProfile ?? null);
			});
			await sweetTopSmallSuccessAlert(doneText, 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setBusy(false);
		}
	};

	if (profile?.clinicId) {
		const here = profile.clinicId === clinicId;
		return (
			<button type="button" className="pb-btn pb-btn--soft pb-btn--lg pb-btn--block" disabled>
				<Icon name={here ? 'check' : 'clinic'} size={18} />
				{here ? 'You work here' : 'You already have a clinic'}
			</button>
		);
	}

	if (pending && pending.clinicId === clinicId) {
		return (
			<button
				type="button"
				className="pb-btn pb-btn--danger pb-btn--lg pb-btn--block"
				disabled={busy}
				onClick={() => run('Cancel your join request?', () => cancelJoinRequest({ variables: { input: pending._id } }), 'Request cancelled')}
			>
				{busy ? <EcgLine small width={44} /> : <><Icon name="close" size={18} /> Cancel join request</>}
			</button>
		);
	}

	return (
		<button
			type="button"
			className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block"
			disabled={busy || !!pending}
			title={pending ? 'You already have a pending request at another clinic' : undefined}
			onClick={() => run(`Send a join request to ${clinicName}?`, () => requestJoinClinic({ variables: { input: clinicId } }), 'Request sent')}
		>
			{busy ? <EcgLine small width={44} /> : pending ? 'Request pending elsewhere' : <>Request to join <Icon name="arrow" className="pb-arrow" /></>}
		</button>
	);
};

export default ClinicJoinButton;
