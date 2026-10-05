/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// old Nestar routes
	async redirects() {
		return [
			{ source: '/property', destination: '/clinic', permanent: false },
			{ source: '/property/detail', destination: '/clinic/detail', permanent: false },
			{ source: '/agent', destination: '/doctor', permanent: false },
			{ source: '/agent/detail', destination: '/doctor/detail', permanent: false },
		];
	},
	env: {
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_API_WS: process.env.REACT_APP_API_WS,
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
