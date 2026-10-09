import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Pagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { Doctor } from '../../types/doctor/doctor';
import { DoctorsInquiry } from '../../types/doctor/doctor.input';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { REMOVE_DOCTOR } from '../../../apollo/user/mutation';
import { GET_DOCTORS, GET_MY_CLINIC } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import ListRow from './ListRow';
import MySection from './MySection';
import Avatar from '../ui/Avatar';
import { SkeletonCards } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

// CLINIC members: doctors working in my clinic; removing keeps the doctor profile, it only leaves the clinic
const ClinicDoctors = () => {
	const router = useRouter();
	const [input, setInput] = useState<DoctorsInquiry>({ page: 1, limit: 6, sort: 'createdAt', direction: Direction.DESC, search: {} });
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [total, setTotal] = useState(0);

	/** APOLLO REQUESTS **/
	const [removeDoctor] = useMutation(REMOVE_DOCTOR);

	useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const clinicId = data?.getMyClinic?._id;
			if (clinicId) setInput((prev) => ({ ...prev, search: { clinicId } }));
			else setDoctors([]);
		},
		onError: () => setDoctors([]),
	});

	const { refetch } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		variables: { input },
		skip: !input.search.clinicId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.getDoctors?.list ?? []);
			setTotal(data?.getDoctors?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setDoctors([]),
	});

	/** HANDLERS **/
	const removeDoctorHandler = async (doctor: Doctor) => {
		try {
			if (!(await sweetConfirmAlert(`Remove ${getMemberName(doctor.memberData)} from your clinic?`))) return;
			await removeDoctor({ variables: { input: doctor._id } });
			await refetch({ input });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<MySection title="Doctors" subTitle="Doctors join your clinic through join requests">
			{doctors === null && <SkeletonCards count={3} />}
			{doctors?.length === 0 && <p className="pb-empty">No doctors yet. Approve join requests to add doctors.</p>}
			{doctors?.map((doctor) => (
				<ListRow
					key={doctor._id}
					avatar={<Avatar name={getMemberName(doctor.memberData)} image={doctor.memberData?.memberImage} size={46} />}
					title={getMemberName(doctor.memberData)}
					subTitle={`${formatEnum(doctor.specialty)} · ${doctor.experience} years experience`}
					date={doctor.createdAt}
					count={`${doctor.doctorViews} views`}
					onClick={() => router.push(`/doctor/detail?id=${doctor._id}`)}
					actions={
						<button type="button" className="pb-btn pb-btn--danger pb-btn--sm" onClick={() => removeDoctorHandler(doctor)}>
							Remove
						</button>
					}
				/>
			))}
			<PbPagination page={input.page} total={total} limit={input.limit} onChange={(page) => setInput({ ...input, page })} noun="doctor" />
		</MySection>
	);
};

export default ClinicDoctors;
