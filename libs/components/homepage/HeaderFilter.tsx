import React, { useEffect, useRef, useState } from 'react';
import { Stack, Box, Modal, Divider, Button } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { ClinicType } from '../../enums/clinic.enum';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { formatEnum } from '../../utils';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	borderRadius: '12px',
	outline: 'none',
	boxShadow: 24,
};

type SearchTarget = 'clinic' | 'doctor';

const HeaderFilter = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const router = useRouter();
	const targetRef: any = useRef();
	const typeRef: any = useRef();
	const specialtyRef: any = useRef();
	const [target, setTarget] = useState<SearchTarget>('clinic');
	const [clinicType, setClinicType] = useState<ClinicType | null>(null);
	const [specialty, setSpecialty] = useState<DoctorSpecialty | null>(null);
	const [text, setText] = useState<string>('');
	const [openTarget, setOpenTarget] = useState(false);
	const [openType, setOpenType] = useState(false);
	const [openSpecialty, setOpenSpecialty] = useState(false);
	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

	/** LIFECYCLES **/

	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			if (!targetRef?.current?.contains(event.target)) setOpenTarget(false);
			if (!typeRef?.current?.contains(event.target)) setOpenType(false);
			if (!specialtyRef?.current?.contains(event.target)) setOpenSpecialty(false);
		};

		document.addEventListener('mousedown', clickHandler);
		return () => {
			document.removeEventListener('mousedown', clickHandler);
		};
	}, []);

	/** HANDLERS **/

	const closeAll = () => {
		setOpenTarget(false);
		setOpenType(false);
		setOpenSpecialty(false);
	};

	const targetSelectHandler = (value: SearchTarget) => {
		setTarget(value);
		closeAll();
	};

	const resetFilterHandler = () => {
		setClinicType(null);
		setSpecialty(null);
		setText('');
	};

	const pushSearchHandler = async () => {
		try {
			const search: any = {};
			if (text) search.text = text;
			if (target === 'clinic' && clinicType) search.clinicType = clinicType;
			if (target === 'doctor' && specialty) search.specialtyList = [specialty];

			const input = JSON.stringify({ page: 1, limit: 9, search });
			await router.push(`/${target}?input=${input}`, `/${target}?input=${input}`);
		} catch (err: any) {
			console.log('ERROR, pushSearchHandler:', err);
		}
	};

	if (device === 'mobile') {
		return <div>HEADER FILTER MOBILE</div>;
	} else {
		return (
			<>
				<Stack className={'search-box'}>
					<Stack className={'select-box'}>
						<Box
							component={'div'}
							className={`box ${openTarget ? 'on' : ''}`}
							onClick={() => {
								setOpenTarget((prev) => !prev);
								setOpenType(false);
								setOpenSpecialty(false);
							}}
						>
							<span>{target === 'clinic' ? t('Clinics') : t('Doctors')}</span>
							<ExpandMoreIcon />
						</Box>
						{target === 'clinic' ? (
							<Box
								className={`box ${openType ? 'on' : ''}`}
								onClick={() => {
									setOpenType((prev) => !prev);
									setOpenTarget(false);
								}}
							>
								<span>{clinicType ? formatEnum(clinicType) : t('Clinic type')}</span>
								<ExpandMoreIcon />
							</Box>
						) : (
							<Box
								className={`box ${openSpecialty ? 'on' : ''}`}
								onClick={() => {
									setOpenSpecialty((prev) => !prev);
									setOpenTarget(false);
								}}
							>
								<span>{specialty ? formatEnum(specialty) : t('Specialty')}</span>
								<ExpandMoreIcon />
							</Box>
						)}
					</Stack>
					<Stack className={'search-box-other'}>
						<Box
							className={'advanced-filter'}
							onClick={() => {
								closeAll();
								setOpenAdvancedFilter(true);
							}}
						>
							<img src="/img/icons/tune.svg" alt="" />
							<span>{t('Advanced')}</span>
						</Box>
						<Box className={'search-btn'} onClick={pushSearchHandler}>
							<img src="/img/icons/search_white.svg" alt="" />
						</Box>
					</Stack>

					{/*MENU */}
					<div className={`filter-rooms ${openTarget ? 'on' : ''}`} ref={targetRef}>
						<span onClick={() => targetSelectHandler('clinic')}>{t('Clinics')}</span>
						<span onClick={() => targetSelectHandler('doctor')}>{t('Doctors')}</span>
					</div>

					<div className={`filter-rooms ${openType ? 'on' : ''}`} ref={typeRef}>
						{Object.values(ClinicType).map((type: ClinicType) => (
							<span
								key={type}
								onClick={() => {
									setClinicType(type);
									closeAll();
								}}
							>
								{formatEnum(type)}
							</span>
						))}
					</div>

					<div className={`filter-rooms ${openSpecialty ? 'on' : ''}`} ref={specialtyRef}>
						{Object.values(DoctorSpecialty).map((value: DoctorSpecialty) => (
							<span
								key={value}
								onClick={() => {
									setSpecialty(value);
									closeAll();
								}}
							>
								{formatEnum(value)}
							</span>
						))}
					</div>
				</Stack>

				{/* ADVANCED FILTER MODAL */}
				<Modal open={openAdvancedFilter} onClose={() => setOpenAdvancedFilter(false)}>
					{/* @ts-ignore */}
					<Box sx={style}>
						<Box className={'advanced-filter-modal'}>
							<div className={'close'} onClick={() => setOpenAdvancedFilter(false)}>
								<CloseIcon />
							</div>
							<div className={'top'}>
								<span>{target === 'clinic' ? 'Find your clinic' : 'Find your doctor'}</span>
								<div className={'search-input-box'}>
									<img src="/img/icons/search.svg" alt="" />
									<input
										value={text}
										type="text"
										placeholder={target === 'clinic' ? 'Clinic name' : 'Doctor name'}
										onChange={(e: any) => setText(e.target.value)}
										onKeyDown={(e: any) => e.key === 'Enter' && pushSearchHandler()}
									/>
								</div>
							</div>
							<Divider sx={{ mt: '30px', mb: '18px' }} />
							<div className={'bottom'}>
								<div onClick={resetFilterHandler}>
									<img src="/img/icons/reset.svg" alt="" />
									<span>Reset all filters</span>
								</div>
								<Button
									startIcon={<img src={'/img/icons/search.svg'} />}
									className={'search-btn'}
									onClick={pushSearchHandler}
								>
									Search
								</Button>
							</div>
						</Box>
					</Box>
				</Modal>
			</>
		);
	}
};

export default HeaderFilter;
