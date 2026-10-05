export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

// sort keys accepted by the backend (any other value is rejected)
export const clinicSorts = ['createdAt', 'updatedAt', 'clinicLikes', 'clinicViews', 'clinicRank', 'clinicDoctors'];
export const doctorSorts = ['createdAt', 'updatedAt', 'doctorLikes', 'doctorViews', 'doctorRank', 'experience'];

// backend validation limits
export const ARTICLE_TITLE_MAX = 50;
export const ARTICLE_CONTENT_MAX = 250;
export const COMMENT_CONTENT_MAX = 100;

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

export const getImageUrl = (image?: string | null, fallback: string = '/img/profile/defaultUser.svg'): string => {
	return image ? `${REACT_APP_API_URL}/${image}` : fallback;
};

export const getMemberName = (member?: { memberFullName?: string; memberNick?: string } | null): string => {
	return member?.memberFullName || member?.memberNick || '';
};

export const DEFAULT_CLINIC_IMAGE = '/img/property/bigImage.png';

// rank from which a doctor or clinic gets the "top" badge
export const TOP_RANK = 2;
