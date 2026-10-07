import { useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MY_CLINIC, GET_MY_DOCTOR_PROFILE } from '../../apollo/user/query';
import { MemberType } from '../enums/member.enum';
import { FollowGroup } from '../enums/follow.enum';
import { T } from '../types/common';

export interface MyFollowTarget {
	followGroup: FollowGroup;
	refId: string;
	followers: number;
}

// doctors and clinic owners are followed through their doctor profile / clinic; patients have no followers
export const useMyFollowTarget = (): MyFollowTarget | null => {
	const user = useReactiveVar(userVar);
	const [target, setTarget] = useState<MyFollowTarget | null>(null);

	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'cache-and-network',
		skip: user?.memberType !== MemberType.DOCTOR,
		onCompleted: (data: T) => {
			const doctor = data?.getMyDoctorProfile;
			if (doctor) setTarget({ followGroup: FollowGroup.DOCTOR, refId: doctor._id, followers: doctor.doctorFollowers ?? 0 });
		},
	});
	useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'cache-and-network',
		skip: user?.memberType !== MemberType.CLINIC,
		onCompleted: (data: T) => {
			const clinic = data?.getMyClinic;
			if (clinic) setTarget({ followGroup: FollowGroup.CLINIC, refId: clinic._id, followers: clinic.clinicFollowers ?? 0 });
		},
	});

	return target;
};
