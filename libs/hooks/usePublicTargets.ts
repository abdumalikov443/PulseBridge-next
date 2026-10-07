import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CLINICS, GET_DOCTORS } from '../../apollo/user/query';
import { Doctor } from '../types/doctor/doctor';
import { Clinic } from '../types/clinic/clinic';
import { T } from '../types/common';

// public doctors and clinics with clinicData and meLiked; lists that lack them
// (follow lists, favorites, recently visited) read them from here
const TARGET_LIMIT = 100;

export const usePublicTargets = (skip: boolean = false) => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [clinics, setClinics] = useState<Clinic[]>([]);

	useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		skip,
		variables: { input: { page: 1, limit: TARGET_LIMIT, search: {} } },
		onCompleted: (data: T) => setDoctors(data?.getDoctors?.list ?? []),
	});
	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		skip,
		variables: { input: { page: 1, limit: TARGET_LIMIT, search: {} } },
		onCompleted: (data: T) => setClinics(data?.getClinics?.list ?? []),
	});

	const doctorById = useMemo(() => new Map(doctors.map((ele) => [ele._id, ele])), [doctors]);
	const clinicById = useMemo(() => new Map(clinics.map((ele) => [ele._id, ele])), [clinics]);

	return { doctors, clinics, doctorById, clinicById };
};
