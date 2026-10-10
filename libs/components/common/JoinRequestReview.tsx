import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CLINIC_JOIN_REQUESTS } from '../../../apollo/user/query';
import { RESPOND_JOIN_REQUEST } from '../../../apollo/user/mutation';
import { ClinicJoinRequest } from '../../types/doctor/doctor';
import { JoinRequestStatus } from '../../enums/doctor.enum';
import { MemberType } from '../../enums/member.enum';
import { T } from '../../types/common';
import { formatEnum } from '../../utils';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';

const tones: Record<JoinRequestStatus, string> = {
	[JoinRequestStatus.PENDING]: 'warning',
	[JoinRequestStatus.APPROVED]: 'success',
	[JoinRequestStatus.REJECTED]: 'danger',
};

// CLINIC owner on a doctor's member page: the doctor's join request with approve / reject.
// The doctor page (getDoctor) only lists doctors who already have a clinic, so the review happens here.
const JoinRequestReview = ({ memberId }: { memberId: string }) => {
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const isClinic = user?.memberType === MemberType.CLINIC;
	const [request, setRequest] = useState<ClinicJoinRequest | null>(null);
	const [busy, setBusy] = useState(false);

	/** APOLLO REQUESTS **/
	const [respondJoinRequest] = useMutation(RESPOND_JOIN_REQUEST);
	const { refetch } = useQuery(GET_CLINIC_JOIN_REQUESTS, {
		fetchPolicy: 'network-only',
		skip: !isClinic || !memberId,
		variables: { input: { page: 1, limit: 50 } },
		onCompleted: (data: T) => {
			const list: ClinicJoinRequest[] = data?.getClinicJoinRequests?.list ?? [];
			const mine = list.filter((ele) => ele.doctorData?.memberData?._id === memberId);
			setRequest(mine.find((ele) => ele.requestStatus === JoinRequestStatus.PENDING) ?? mine[0] ?? null);
		},
	});

	if (!isClinic || !request) return null;

	/** HANDLERS **/
	const respond = async (requestStatus: JoinRequestStatus) => {
		try {
			const approve = requestStatus === JoinRequestStatus.APPROVED;
			if (!(await sweetConfirmAlert(approve ? 'Approve this doctor?' : 'Reject this doctor?'))) return;
			setBusy(true);
			await respondJoinRequest({ variables: { input: { _id: request._id, requestStatus } } });
			await refetch();
			await sweetTopSmallSuccessAlert(approve ? 'Approved' : 'Rejected', 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setBusy(false);
		}
	};

	const doctor = request.doctorData;
	const pending = request.requestStatus === JoinRequestStatus.PENDING;

	return (
		<section className="pb-card pb-card--flat pb-in pb-review-request" aria-label={t('Join request')}>
			<div className="pb-review-request__head">
				<span className="pb-review-request__icon">
					<Icon name="clinic" size={20} />
				</span>
				<div style={{ flex: 1, minWidth: 0 }}>
					<strong>{t('Join request to your clinic')}</strong>
					<small>{t('Sent {{date}}', { date: moment(request.createdAt).format('MMM D, YYYY') })}</small>
				</div>
				<span className={`pb-badge pb-badge--${tones[request.requestStatus]}`}>
					{formatEnum(request.requestStatus)}
				</span>
			</div>
			<dl className="pb-review-request__facts">
				<div>
					<dt>{t('Specialty')}</dt>
					<dd>{formatEnum(doctor?.specialty)}</dd>
				</div>
				<div>
					<dt>{t('Experience')}</dt>
					<dd>{t('{{count}} years', { count: doctor?.experience ?? 0 })}</dd>
				</div>
				{doctor?.memberData?.memberPhone && (
					<div>
						<dt>{t('Phone')}</dt>
						<dd>
							<a href={`tel:${doctor.memberData.memberPhone}`}>{doctor.memberData.memberPhone}</a>
						</dd>
					</div>
				)}
			</dl>
			{pending && (
				<div className="pb-review-request__actions">
					<button
						type="button"
						className="pb-btn pb-btn--primary"
						disabled={busy}
						onClick={() => respond(JoinRequestStatus.APPROVED)}
					>
						{busy ? (
							<EcgLine small width={44} />
						) : (
							<>
								<Icon name="check" size={16} /> {t('Approve')}
							</>
						)}
					</button>
					<button
						type="button"
						className="pb-btn pb-btn--danger"
						disabled={busy}
						onClick={() => respond(JoinRequestStatus.REJECTED)}
					>
						<Icon name="close" size={16} /> {t('Reject')}
					</button>
				</div>
			)}
		</section>
	);
};

export default JoinRequestReview;
