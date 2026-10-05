import React from 'react';
import { NextPage } from 'next';
import SavedTargets from './SavedTargets';
import { GET_VISITED_CLINICS, GET_VISITED_DOCTORS } from '../../../apollo/user/query';

const RecentlyVisited: NextPage = () => {
	return (
		<SavedTargets
			pageId={'my-favorites-page'}
			title={'Recently Visited'}
			clinicQuery={GET_VISITED_CLINICS}
			clinicResultKey={'getVisitedClinics'}
			doctorQuery={GET_VISITED_DOCTORS}
			doctorResultKey={'getVisitedDoctors'}
			recentlyVisited={true}
		/>
	);
};

export default RecentlyVisited;
