import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { canWriteArticles } from '../../libs/utils';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import { userVar } from '../../apollo/store';
import { getJwtToken } from '../../libs/auth';
import MyMenu from '../../libs/components/mypage/MyMenu';
import MyOverview from '../../libs/components/mypage/MyOverview';
import MyAppointments from '../../libs/components/mypage/MyAppointments';
import MyClinic from '../../libs/components/mypage/MyClinic';
import ClinicDoctors from '../../libs/components/mypage/ClinicDoctors';
import JoinRequests from '../../libs/components/mypage/JoinRequests';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MySection from '../../libs/components/mypage/MySection';
import FollowList from '../../libs/components/common/FollowList';
import MyFollowers from '../../libs/components/mypage/MyFollowers';
import { EcgLine } from '../../libs/components/ui/Loaders';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const category = (router.query.category as string) ?? 'overview';

	/** LIFECYCLES **/
	useEffect(() => {
		// guests go to the login page; a stored token restores the user first
		if (!getJwtToken()) router.replace('/account/join');
	}, [router]);

	if (!user._id) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const sections: Record<string, React.ReactNode> = {
		overview: <MyOverview />,
		myAppointments: <MyAppointments />,
		myClinic: <MyClinic />,
		clinicDoctors: <ClinicDoctors />,
		joinRequests: <JoinRequests />,
		myFavorites: <MyFavorites />,
		recentlyVisited: <RecentlyVisited />,
		...(canWriteArticles(user.memberType) && { myArticles: <MyArticles />, writeArticle: <WriteArticle /> }),
		myProfile: <MyProfile />,
		followers: <MyFollowers />,
		followings: (
			<MySection title="Following" subTitle="Doctors and clinics you follow">
				<FollowList mode="followings" memberId={user._id} />
			</MySection>
		),
	};

	return (
		<div className="pb-container" style={{ paddingTop: 32 }}>
			<div className="pb-split">
				<div style={{ flex: '1 1 260px', maxWidth: 320, minWidth: 0 }}>
					<MyMenu />
				</div>
				<div className="pb-split__main" key={category}>
					{sections[category] ?? sections.overview}
				</div>
			</div>
		</div>
	);
};

export default withPbLayout(MyPage);
