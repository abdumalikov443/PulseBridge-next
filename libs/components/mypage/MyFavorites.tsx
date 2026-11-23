import React from 'react';
import SavedTargets from './SavedTargets';
import { GET_FAVORITE_CLINICS, GET_FAVORITE_DOCTORS } from '../../../apollo/user/query';

const MyFavorites = () => (
	<SavedTargets
		title="Favorites"
		subTitle="Doctors and clinics you liked"
		clinicQuery={GET_FAVORITE_CLINICS}
		clinicResultKey={'getFavoriteClinics'}
		doctorQuery={GET_FAVORITE_DOCTORS}
		doctorResultKey={'getFavoriteDoctors'}
		allLiked
	/>
);

export default MyFavorites;
