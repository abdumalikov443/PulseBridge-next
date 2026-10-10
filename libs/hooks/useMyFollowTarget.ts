import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MY_CLINIC, GET_MY_DOCTOR_PROFILE } from '../../apollo/user/query';
import { MemberType } from '../enums/member.enum';
import { FollowGroup } from '../enums/follow.enum';

export interface MyFollowTarget {
	followGroup: FollowGroup;
	refId: string;
	followers: number;
	likes: number;
}

// doctors and clinic owners are followed and liked through their doctor profile / clinic; patients have none
export const useMyFollowTarget = (): MyFollowTarget | null => {
	const user = useReactiveVar(userVar);

	// read from data (fresh on every visit), not from onCompleted
	const { data: doctorData } = useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: user?.memberType !== MemberType.DOCTOR,
	});
	const { data: clinicData } = useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		skip: user?.memberType !== MemberType.CLINIC,
	});

	const doctor = doctorData?.getMyDoctorProfile;
	if (user?.memberType === MemberType.DOCTOR && doctor) {
		return { followGroup: FollowGroup.DOCTOR, refId: doctor._id, followers: doctor.doctorFollowers ?? 0, likes: doctor.doctorLikes ?? 0 };
	}
	const clinic = clinicData?.getMyClinic;
	if (user?.memberType === MemberType.CLINIC && clinic) {
		return { followGroup: FollowGroup.CLINIC, refId: clinic._id, followers: clinic.clinicFollowers ?? 0, likes: clinic.clinicLikes ?? 0 };
	}
	return null;
};
