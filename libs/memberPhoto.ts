import { ApolloClient } from '@apollo/client';
import { UPDATE_MEMBER } from '../apollo/user/mutation';
import { userVar } from '../apollo/store';
import { updateStorage, updateUserInfo } from './auth';

// saves memberImage and refreshes the token, so the header avatar changes right away
export const saveMemberImage = async (client: ApolloClient<any>, memberImage: string) => {
	// the backend MemberUpdate requires memberPhone on every update
	const { _id, memberPhone } = userVar();
	const result = await client.mutate({ mutation: UPDATE_MEMBER, variables: { input: { _id, memberPhone, memberImage } } });
	const jwtToken = result.data?.updateMember?.accessToken;
	if (jwtToken) {
		updateStorage({ jwtToken });
		updateUserInfo(jwtToken);
	}
};
