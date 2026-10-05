import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

// likeTargetClinic / likeTargetDoctor / likeTargetArticle all take the target id
export const likeTargetHandler = async (likeTarget: any, id: string) => {
	try {
		await likeTarget({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

// CARDIOLOGY -> Cardiology, DOCTOR_REQUEST -> Doctor request
export const formatEnum = (value?: string | null): string => {
	if (!value) return '';
	const text = value.toLowerCase().replace(/_/g, ' ');
	return text.charAt(0).toUpperCase() + text.slice(1);
};
