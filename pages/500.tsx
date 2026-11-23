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

const Page500: NextPage = () => <ErrorView code={500} />;

export default withPbLayout(Page500);
