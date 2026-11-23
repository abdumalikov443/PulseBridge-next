import axios from 'axios';
import { getJwtToken } from './auth';

// backend accepts only these upload folders
export type UploadTarget = 'member' | 'clinic' | 'article';

// single image upload through the imageUploader mutation (multipart request)
export const uploadImage = async (file: File, target: UploadTarget): Promise<string> => {
	const formData = new FormData();
	formData.append(
		'operations',
		JSON.stringify({
			query: `mutation ImageUploader($file: Upload!, $target: String!) {
				imageUploader(file: $file, target: $target)
			}`,
			variables: { file: null, target },
		}),
	);
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);

	const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
			'apollo-require-preflight': true,
			Authorization: `Bearer ${getJwtToken()}`,
		},
	});

	const errors = response.data?.errors;
	if (errors?.length) throw new Error(errors[0].message);
	return response.data.data.imageUploader;
};
