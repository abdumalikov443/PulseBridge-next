import React from 'react';
import type { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import NoticeManager from '../../../libs/components/admin/cs/NoticeManager';
import { NoticeCategory } from '../../../libs/enums/notice.enum';

const AdminFaq: NextPage = () => <NoticeManager category={NoticeCategory.FAQ} />;

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

export default withAdminLayout(AdminFaq);
