import React from 'react';
import { useTranslation } from 'next-i18next';
import CopyId from '../CopyId';
import Link from 'next/link';
import {
	TableCell,
	TableHead,
	TableBody,
	TableRow,
	Table,
	TableContainer,
	Button,
	Menu,
	Fade,
	MenuItem,
} from '@mui/material';
import Icon from '../../ui/Icon';
import { statusTone } from '../statusTone';
import { Stack } from '@mui/material';
import { Clinic } from '../../../types/clinic/clinic';
import { getMemberName, REACT_APP_API_URL } from '../../../config';
import { formatEnum } from '../../../utils';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import { ClinicStatus } from '../../../enums/clinic.enum';

const ClinicThumb = ({ image }: { image?: string }) => (
	<span className="pb-admin-thumb">{image ? <img src={image} alt="" /> : <Icon name="clinic" size={18} />}</span>
);

const headCells: { id: string; label: string; numeric: boolean }[] = [
	{ id: 'id', numeric: true, label: 'CLINIC ID' },
	{ id: 'name', numeric: true, label: 'NAME' },
	{ id: 'owner', numeric: false, label: 'OWNER' },
	{ id: 'type', numeric: false, label: 'TYPE' },
	{ id: 'doctors', numeric: false, label: 'DOCTORS' },
	{ id: 'status', numeric: false, label: 'STATUS' },
];

function EnhancedTableHead() {
	const { t } = useTranslation('common');
	return (
		<TableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell key={headCell.id} align={headCell.numeric ? 'left' : 'center'} padding={'normal'}>
						{t(headCell.label)}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
}

interface ClinicPanelListType {
	clinics: Clinic[];
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateClinicHandler: any;
	removeClinicHandler: any;
}

// a clinic can be removed only after its status is DELETE
export const ClinicPanelList = (props: ClinicPanelListType) => {
	const { clinics, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateClinicHandler, removeClinicHandler } =
		props;
	const { t } = useTranslation('common');

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					<EnhancedTableHead />
					<TableBody>
						{clinics.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={6}>
									<span className={'no-data'}>{t('No data found')}</span>
								</TableCell>
							</TableRow>
						)}

						{clinics.length !== 0 &&
							clinics.map((clinic: Clinic, index: number) => {
								const clinicImage = clinic?.clinicImage ? `${REACT_APP_API_URL}/${clinic.clinicImage}` : undefined;

								return (
									<TableRow hover key={clinic?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
										<TableCell align="left">
											<CopyId id={clinic._id} />
										</TableCell>
										<TableCell align="left" className={'name'}>
											{clinic.clinicStatus === ClinicStatus.ACTIVE ? (
												<Stack direction={'row'}>
													<Link href={`/clinic/detail?id=${clinic?._id}`}>
														<div>
															<ClinicThumb image={clinicImage} />
														</div>
													</Link>
													<Link href={`/clinic/detail?id=${clinic?._id}`}>
														<div>{clinic.clinicName}</div>
													</Link>
												</Stack>
											) : (
												<Stack direction={'row'}>
													<div>
														<ClinicThumb image={clinicImage} />
													</div>
													<div style={{ marginTop: '10px' }}>{clinic.clinicName}</div>
												</Stack>
											)}
										</TableCell>
										<TableCell align="center">{getMemberName(clinic.memberData)}</TableCell>
										<TableCell align="center">{formatEnum(clinic.clinicType)}</TableCell>
										<TableCell align="center">{clinic.clinicDoctors}</TableCell>
										<TableCell align="center">
											{clinic.clinicStatus === ClinicStatus.DELETE && (
												<Button
													variant="outlined"
													sx={{ p: '3px', border: 'none', ':hover': { border: '1px solid #000000' } }}
													onClick={() => removeClinicHandler(clinic._id)}
												>
													<DeleteIcon fontSize="small" />
												</Button>
											)}

											<Button
												onClick={(e: any) => menuIconClickHandler(e, index)}
												className={`badge ${statusTone(clinic.clinicStatus)}`}
											>
												{formatEnum(clinic.clinicStatus)}
											</Button>

											<Menu
												className={'menu-modal'}
												MenuListProps={{
													'aria-labelledby': 'fade-button',
												}}
												anchorEl={anchorEl[index]}
												open={Boolean(anchorEl[index])}
												onClose={menuIconCloseHandler}
												TransitionComponent={Fade}
												sx={{ p: 1 }}
											>
												{Object.values(ClinicStatus)
													.filter((ele) => ele !== clinic.clinicStatus)
													.map((status: ClinicStatus) => (
														<MenuItem
															onClick={() => updateClinicHandler({ _id: clinic._id, clinicStatus: status })}
															key={status}
														>
															<Typography variant={'subtitle1'} component={'span'}>
																{formatEnum(status)}
															</Typography>
														</MenuItem>
													))}
											</Menu>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};
