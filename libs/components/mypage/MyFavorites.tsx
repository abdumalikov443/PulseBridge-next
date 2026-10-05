import React from 'react';
import { NextPage } from 'next';
import SavedTargets from './SavedTargets';
import { GET_FAVORITE_CLINICS, GET_FAVORITE_DOCTORS } from '../../../apollo/user/query';

const MyFavorites: NextPage = () => {
	return (
		<SavedTargets
			pageId={'my-favorites-page'}
			title={'My Favorites'}
			clinicQuery={GET_FAVORITE_CLINICS}
			clinicResultKey={'getFavoriteClinics'}
			doctorQuery={GET_FAVORITE_DOCTORS}
			doctorResultKey={'getFavoriteDoctors'}
			myFavorites={true}
		/>
	);
};

export default MyFavorites;
