import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../libs/components/layout/PbShell';
import ErrorView from '../libs/components/common/ErrorView';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Page404: NextPage = () => <ErrorView code={404} />;

export default withPbLayout(Page404);
