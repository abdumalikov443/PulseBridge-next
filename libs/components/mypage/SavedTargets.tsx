import React, { useState } from 'react';
import { Pagination } from '@mui/material';
import { DocumentNode, useQuery } from '@apollo/client';
import { Clinic } from '../../types/clinic/clinic';
import { Doctor } from '../../types/doctor/doctor';
import { OrdinaryInquiry, T } from '../../types/common';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../../apollo/user/mutation';
import { useLikeToggle } from '../../hooks/useEngagement';
import { usePublicTargets } from '../../hooks/usePublicTargets';
import ClinicCard from '../cards/ClinicCard';
import DoctorCard from '../cards/DoctorCard';
import MySection from './MySection';
import { SkeletonCards } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

type Target = 'clinic' | 'doctor';

interface SavedTargetsProps {
	title: string;
	subTitle: string;
	clinicQuery: DocumentNode;
	clinicResultKey: string;
	doctorQuery: DocumentNode;
	doctorResultKey: string;
	// every favorite is liked; recently visited reads the like state from the public lists
	allLiked?: boolean;
}

// clinics and doctors saved by the member: favorites or recently visited
const SavedTargets = ({ title, subTitle, clinicQuery, clinicResultKey, doctorQuery, doctorResultKey, allLiked = false }: SavedTargetsProps) => {
	const [target, setTarget] = useState<Target>('doctor');
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 6 });
	const [clinics, setClinics] = useState<Clinic[] | null>(null);
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [total, setTotal] = useState(0);
	const clinicLike = useLikeToggle(LIKE_TARGET_CLINIC);
	const doctorLike = useLikeToggle(LIKE_TARGET_DOCTOR);
	// these lists come without meLiked and (for doctors) without clinicData
	const { doctorById, clinicById } = usePublicTargets();

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
					doctors?.map((saved) => {
						const listed = doctorById.get(saved._id);
						const doctor = listed ? { ...saved, clinicData: listed.clinicData, meLiked: listed.meLiked } : saved;
						const state = doctorLike.likeState(doctor._id, listed ? !!listed.meLiked?.[0]?.myFavorite : allLiked, doctor.doctorLikes);
						return (
							<DoctorCard
								key={doctor._id}
								doctor={doctor}
								liked={state.liked}
								likes={state.likes}
								onLike={() => doctorLike.toggleLike(doctor._id, state)}
							/>
						);
					})}
				{target === 'clinic' &&
					clinics?.map((clinic, index) => {
						const listed = clinicById.get(clinic._id);
						const state = clinicLike.likeState(clinic._id, listed ? !!listed.meLiked?.[0]?.myFavorite : allLiked, clinic.clinicLikes);
						return (
							<ClinicCard
								key={clinic._id}
								clinic={clinic}
								index={index}
								liked={state.liked}
								likes={state.likes}
								onLike={() => clinicLike.toggleLike(clinic._id, state)}
							/>
						);
					})}
			</div>
			{list?.length === 0 && <p className="pb-empty">Nothing here yet.</p>}

			<PbPagination page={inquiry.page} total={total} limit={inquiry.limit} onChange={(page) => setInquiry({ ...inquiry, page })} />
		</MySection>
	);
};

export default SavedTargets;
