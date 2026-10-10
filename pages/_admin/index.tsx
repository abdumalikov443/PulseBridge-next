import React, { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPage } from 'next';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import { useRouter } from 'next/router';

const AdminHome: NextPage = (props: any) => {
	const router = useRouter();

	/** LIFECYCLES **/
	useEffect(() => {
		router.push('/_admin/users');
	}, []);
	return <></>;
};

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

export default withAdminLayout(AdminHome);
