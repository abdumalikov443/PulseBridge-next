import { useEffect, useState } from 'react';
import { ApolloClient, useApolloClient } from '@apollo/client';
import { GET_DOCTOR_INDEX } from '../../apollo/user/query';
import { DoctorSpecialty } from '../enums/doctor.enum';

export interface DoctorIndex {
	total: number;
	// false when there are more doctors than one request returns: callers fall back to their own query
	complete: boolean;
	bySpecialty: Map<DoctorSpecialty, number>;
	byClinic: Map<string, DoctorSpecialty[]>;
}

const INDEX_LIMIT = 500;
// several components on one page (specialty tiles, stats, clinic cards) share one fresh request
const TTL = 30000;
let shared: { at: number; promise: Promise<DoctorIndex> } | null = null;

const build = (data: any): DoctorIndex => {
	const list: { _id: string; specialty: DoctorSpecialty; clinicId?: string | null }[] = data?.getDoctors?.list ?? [];
	const total: number = data?.getDoctors?.metaCounter?.[0]?.total ?? 0;
	const bySpecialty = new Map<DoctorSpecialty, number>();
	const byClinic = new Map<string, DoctorSpecialty[]>();
	for (const doctor of list) {
		bySpecialty.set(doctor.specialty, (bySpecialty.get(doctor.specialty) ?? 0) + 1);
		if (!doctor.clinicId) continue;
		const specialties = byClinic.get(doctor.clinicId) ?? [];
		if (!specialties.includes(doctor.specialty)) specialties.push(doctor.specialty);
		byClinic.set(doctor.clinicId, specialties);
	}
	return { total, complete: list.length >= total, bySpecialty, byClinic };
};

export const loadDoctorIndex = (client: ApolloClient<object>): Promise<DoctorIndex> => {
	if (!shared || Date.now() - shared.at > TTL) {
		const promise = client
			.query({
				query: GET_DOCTOR_INDEX,
				variables: { input: { page: 1, limit: INDEX_LIMIT, search: {} } },
				fetchPolicy: 'network-only',
			})
			.then((res) => build(res.data));
		// a failed request is not kept, so the next caller tries again
		promise.catch(() => {
			if (shared?.promise === promise) shared = null;
		});
		shared = { at: Date.now(), promise };
	}
	return shared.promise;
};

// null while loading
export const useDoctorIndex = (skip: boolean = false): DoctorIndex | null => {
	const client = useApolloClient();
	const [index, setIndex] = useState<DoctorIndex | null>(null);

	useEffect(() => {
		if (skip) return;
		let active = true;
		loadDoctorIndex(client)
			.then((value) => active && setIndex(value))
			.catch(() => active && setIndex({ total: 0, complete: false, bySpecialty: new Map(), byClinic: new Map() }));
		return () => {
			active = false;
		};
	}, [client, skip]);

	return index;
};
