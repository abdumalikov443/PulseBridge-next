import React, { useState } from 'react';
import { Stack, Typography, Checkbox, OutlinedInput, Tooltip, IconButton } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { ClinicType } from '../../enums/clinic.enum';
import { ClinicsInquiry } from '../../types/clinic/clinic.input';
import { formatEnum } from '../../utils';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { T } from '../../types/common';

interface ClinicFilterType {
	searchFilter: ClinicsInquiry;
	initialInput: ClinicsInquiry;
}

// filter changes are pushed to the url; the clinic list page reads them from there
const ClinicFilter = (props: ClinicFilterType) => {
	const { searchFilter, initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchText, setSearchText] = useState<string>(searchFilter?.search?.text ?? '');

	/** HANDLERS **/

	const pushFilter = async (input: ClinicsInquiry) => {
		const url = `/clinic?input=${JSON.stringify({ ...input, page: 1 })}`;
		await router.push(url, url, { scroll: false });
	};

	const textHandler = async (text: string) => {
		const search: T = { ...searchFilter.search, text };
		if (!text) delete search.text;
		await pushFilter({ ...searchFilter, search });
	};

	// backend accepts one clinicType: checking a type replaces the previous one
	const clinicTypeSelectHandler = async (e: any) => {
		try {
			const { checked, value } = e.target;
			const search: T = { ...searchFilter.search, clinicType: value };
			if (!checked) delete search.clinicType;
			await pushFilter({ ...searchFilter, search });
		} catch (err: any) {
			console.log('ERROR, clinicTypeSelectHandler:', err);
		}
	};

	const refreshHandler = async () => {
		try {
			setSearchText('');
			await pushFilter(initialInput);
		} catch (err: any) {
			console.log('ERROR, refreshHandler:', err);
		}
	};

	if (device === 'mobile') {
		return <div>CLINICS FILTER</div>;
	} else {
		return (
			<Stack className={'filter-main'}>
				<Stack className={'find-your-home'} mb={'40px'}>
					<Typography className={'title-main'}>Find Your Clinic</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={'Clinic name'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(event: any) => {
								if (event.key == 'Enter') textHandler(searchText).then();
							}}
							endAdornment={
								<>
									<CancelRoundedIcon
										onClick={() => {
											setSearchText('');
											textHandler('').then();
										}}
									/>
								</>
							}
						/>
						<img src={'/img/icons/search_icon.png'} alt={''} />
						<Tooltip title="Reset">
							<IconButton onClick={refreshHandler}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Clinic Type</Typography>
					{Object.values(ClinicType).map((type: ClinicType) => (
						<Stack className={'input-box'} key={type}>
							<Checkbox
								id={type}
								className="property-checkbox"
								color="default"
								size="small"
								value={type}
								onChange={clinicTypeSelectHandler}
								checked={searchFilter?.search?.clinicType === type}
							/>
							<label htmlFor={type} style={{ cursor: 'pointer' }}>
								<Typography className="property_type">{formatEnum(type)}</Typography>
							</label>
						</Stack>
					))}
				</Stack>
			</Stack>
		);
	}
};

export default ClinicFilter;
