import React from 'react';
import SavedTargets from './SavedTargets';
import { GET_VISITED_CLINICS, GET_VISITED_DOCTORS } from '../../../apollo/user/query';

const RecentlyVisited = () => (
	<SavedTargets
		title="Recently visited"
		subTitle="Profiles you opened lately"
		clinicQuery={GET_VISITED_CLINICS}
		clinicResultKey={'getVisitedClinics'}
		doctorQuery={GET_VISITED_DOCTORS}
		doctorResultKey={'getVisitedDoctors'}
	/>
);

export default RecentlyVisited;
