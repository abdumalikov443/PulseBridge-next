import { useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MY_CLINIC, GET_MY_DOCTOR_PROFILE } from '../../apollo/user/query';
import { MemberType } from '../enums/member.enum';
import { ClinicStatus } from '../enums/clinic.enum';
import { T } from '../types/common';

export interface ArticleAccess {
	// null while the profile is loading
	allowed: boolean | null;
	reason?: string;
	link?: { href: string; label: string };
}

// same rule as the backend createArticle: a doctor working in a clinic, or an ACTIVE clinic
export const useArticleAccess = (): ArticleAccess => {
	const user = useReactiveVar(userVar);
	const isDoctor = user?.memberType === MemberType.DOCTOR;
	const isClinic = user?.memberType === MemberType.CLINIC;
	const [access, setAccess] = useState<ArticleAccess>({ allowed: isDoctor || isClinic ? null : false });

	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) =>
			setAccess(
				data?.getMyDoctorProfile?.clinicId
					? { allowed: true }
					: {
							allowed: false,
							reason: 'Only doctors working in a clinic can write articles.',
							link: { href: '/mypage?category=joinRequests', label: 'Join a clinic' },
					  },
			),
		onError: () => setAccess({ allowed: false, reason: 'Your doctor profile could not be loaded.' }),
	});
	useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		skip: !isClinic,
		onCompleted: (data: T) =>
			setAccess(
				data?.getMyClinic?.clinicStatus === ClinicStatus.ACTIVE
					? { allowed: true }
					: {
							allowed: false,
							reason: 'Only active clinics can write articles.',
							link: { href: '/mypage?category=myClinic', label: 'Clinic settings' },
					  },
			),
		onError: () => setAccess({ allowed: false, reason: 'Your clinic could not be loaded.' }),
	});

	if (!isDoctor && !isClinic) return { allowed: false, reason: 'Articles are written by doctors and clinics.' };
	return access;
};
