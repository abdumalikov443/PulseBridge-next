import React, { useState } from 'react';
import { Pagination } from '@mui/material';
import { DocumentNode, useQuery } from '@apollo/client';
import { Clinic } from '../../types/clinic/clinic';
import { Doctor } from '../../types/doctor/doctor';
import { OrdinaryInquiry, T } from '../../types/common';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../hooks/useEngagement';
import ClinicCard from '../cards/ClinicCard';
import DoctorCard from '../cards/DoctorCard';
import MySection from './MySection';
import { SkeletonCards } from '../ui/Loaders';

type Target = 'clinic' | 'doctor';

interface SavedTargetsProps {
	title: string;
	subTitle: string;
	clinicQuery: DocumentNode;
	clinicResultKey: string;
	doctorQuery: DocumentNode;
	doctorResultKey: string;
}

// clinics and doctors saved by the member: favorites or recently visited
const SavedTargets = ({ title, subTitle, clinicQuery, clinicResultKey, doctorQuery, doctorResultKey }: SavedTargetsProps) => {
	const [target, setTarget] = useState<Target>('doctor');
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 6 });
	const [clinics, setClinics] = useState<Clinic[] | null>(null);
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const clinicLike = useLikeToggle(LIKE_TARGET_CLINIC);
	const doctorLike = useLikeToggle(LIKE_TARGET_DOCTOR);

	/** APOLLO REQUESTS **/
	useQuery(clinicQuery, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		skip: target !== 'clinic',
		onCompleted: (data: T) => {
			setClinics(data?.[clinicResultKey]?.list ?? []);
			setTotal(data?.[clinicResultKey]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setClinics([]),
	});

	useQuery(doctorQuery, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		skip: target !== 'doctor',
		onCompleted: (data: T) => {
			setDoctors(data?.[doctorResultKey]?.list ?? []);
			setTotal(data?.[doctorResultKey]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setDoctors([]),
	});

	const list = target === 'clinic' ? clinics : doctors;

	return (
		<MySection title={title} subTitle={subTitle}>
			<div className="pb-pills" role="tablist" aria-label="Saved type">
				{(['doctor', 'clinic'] as Target[]).map((value) => (
					<button
						key={value}
						type="button"
						role="tab"
						aria-selected={target === value}
						className={`pb-pill ${target === value ? 'pb-pill--active' : ''}`}
						onClick={() => {
							setTarget(value);
							setTotal(0);
							setInquiry({ ...inquiry, page: 1 });
						}}
					>
						{value === 'doctor' ? 'Doctors' : 'Clinics'}
					</button>
				))}
			</div>

			<div className={target === 'clinic' ? 'pb-grid pb-grid--wide' : 'pb-grid'}>
				{list === null && <SkeletonCards count={3} />}
				{target === 'doctor' &&
					doctors?.map((doctor) => {
						const state = doctorLike.likeState(doctor._id, !!doctor.meLiked?.[0]?.myFavorite, doctor.doctorLikes);
						return (
							<DoctorCard
								key={doctor._id}
								doctor={doctor}
								liked={state.liked}
								likes={state.likes}
								onLike={() => doctorLike.toggleLike(doctor._id, state)}
								following={isFollowing(doctor.memberId)}
								onFollow={canFollow(doctor.memberId) ? () => toggleFollow(doctor.memberId) : undefined}
							/>
						);
					})}
				{target === 'clinic' &&
					clinics?.map((clinic, index) => {
						const state = clinicLike.likeState(clinic._id, !!clinic.meLiked?.[0]?.myFavorite, clinic.clinicLikes);
						return (
							<ClinicCard
								key={clinic._id}
								clinic={clinic}
								index={index}
								liked={state.liked}
								likes={state.likes}
								onLike={() => clinicLike.toggleLike(clinic._id, state)}
								following={isFollowing(clinic.memberId)}
								onFollow={canFollow(clinic.memberId) ? () => toggleFollow(clinic.memberId) : undefined}
							/>
						);
					})}
			</div>
			{list?.length === 0 && <p className="pb-empty">Nothing here yet.</p>}

			{total > inquiry.limit && (
				<div className="pb-pagination">
					<Pagination page={inquiry.page} count={Math.ceil(total / inquiry.limit)} onChange={(e, page) => setInquiry({ ...inquiry, page })} shape="circular" color="primary" />
				</div>
			)}
		</MySection>
	);
};

export default SavedTargets;
