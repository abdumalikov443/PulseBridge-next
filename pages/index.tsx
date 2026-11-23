import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../libs/components/layout/PbShell';
import HomeHero from '../libs/components/homepage/HomeHero';
import HomeStats from '../libs/components/homepage/HomeStats';
import HomeSpecialties from '../libs/components/homepage/HomeSpecialties';
import DoctorCard from '../libs/components/cards/DoctorCard';
import ClinicCard from '../libs/components/cards/ClinicCard';
import PostCard from '../libs/components/cards/PostCard';
import { SkeletonCards } from '../libs/components/ui/Loaders';
import Icon from '../libs/components/ui/Icon';
import { GET_ARTICLES, GET_CLINICS, GET_DOCTOR_CARDS } from '../apollo/user/query';
import { LIKE_TARGET_ARTICLE, LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../apollo/user/mutation';
import { useLikeToggle } from '../libs/hooks/useEngagement';
import { Doctor } from '../libs/types/doctor/doctor';
import { Clinic } from '../libs/types/clinic/clinic';
import { Article } from '../libs/types/article/article';
import { T } from '../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const isLiked = (item: { meLiked?: { myFavorite: boolean }[] }) => !!item.meLiked?.[0]?.myFavorite;

interface SectionHeadProps {
	id: string;
	title: string;
	sub?: string;
	href: string;
	more: string;
}

const SectionHead = ({ id, title, sub, href, more }: SectionHeadProps) => (
	<div className="pb-section-head">
		<div>
			<h2 className="pb-title" id={id}>
				{title}
			</h2>
			{sub && <p className="pb-section-sub">{sub}</p>}
		</div>
		<Link href={href} className="pb-more">
			{more} <Icon name="arrow" size={16} className="pb-arrow" />
		</Link>
	</div>
);

const Home: NextPage = () => {
	const { t } = useTranslation('common');
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [clinics, setClinics] = useState<Clinic[] | null>(null);
	const [articles, setArticles] = useState<Article[] | null>(null);
	const doctorLikes = useLikeToggle(LIKE_TARGET_DOCTOR);
	const clinicLikes = useLikeToggle(LIKE_TARGET_CLINIC);
	const articleLikes = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** APOLLO REQUESTS **/
	useQuery(GET_DOCTOR_CARDS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 3, sort: 'doctorRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setDoctors(data?.getDoctors?.list ?? []),
		onError: () => setDoctors([]),
	});
	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 3, sort: 'clinicRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setClinics(data?.getClinics?.list ?? []),
		onError: () => setClinics([]),
	});
	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 2, sort: 'articleLikes', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setArticles(data?.getArticles?.list ?? []),
		onError: () => setArticles([]),
	});

	return (
		<>
			<HomeHero />
			<HomeStats />
			<HomeSpecialties />

			<section className="pb-container pb-section" aria-labelledby="home-doctors">
				<SectionHead
					id="home-doctors"
					title={t('Featured doctors')}
					sub={t('Ranked by likes, follows and views from patients')}
					href="/doctor"
					more={t('View all doctors')}
				/>
				<div className="pb-grid">
					{doctors === null && <SkeletonCards count={3} />}
					{doctors?.map((doctor) => {
						const state = doctorLikes.likeState(doctor._id, isLiked(doctor), doctor.doctorLikes);
						return (
							<DoctorCard
								key={doctor._id}
								doctor={doctor}
								liked={state.liked}
								likes={state.likes}
								onLike={() => doctorLikes.toggleLike(doctor._id, state)}
							/>
						);
					})}
				</div>
				{doctors?.length === 0 && <p className="pb-empty">{t('No doctors yet.')}</p>}
			</section>

			<section className="pb-container pb-section" aria-labelledby="home-clinics">
				<SectionHead
					id="home-clinics"
					title={t('Clinics & hospital networks')}
					sub={t("Tags show the specialties of each clinic's doctors")}
					href="/clinic"
					more={t('View all clinics')}
				/>
				<div className="pb-grid pb-grid--wide">
					{clinics === null && <SkeletonCards count={3} />}
					{clinics?.map((clinic, index) => {
						const state = clinicLikes.likeState(clinic._id, isLiked(clinic), clinic.clinicLikes);
						return (
							<ClinicCard
								key={clinic._id}
								clinic={clinic}
								index={index}
								liked={state.liked}
								likes={state.likes}
								onLike={() => clinicLikes.toggleLike(clinic._id, state)}
							/>
						);
					})}
				</div>
				{clinics?.length === 0 && <p className="pb-empty">{t('No clinics yet.')}</p>}
			</section>

			<section className="pb-container pb-section" aria-labelledby="home-stories">
				<SectionHead
					id="home-stories"
					title={t('Health stories')}
					sub={t('Articles and experiences from doctors and patients')}
					href="/community"
					more={t('Browse community')}
				/>
				<div className="pb-grid pb-grid--posts">
					{articles === null && <SkeletonCards count={2} />}
					{articles?.map((article) => {
						const state = articleLikes.likeState(article._id, isLiked(article), article.articleLikes);
						return (
							<PostCard
								key={article._id}
								article={article}
								liked={state.liked}
								likes={state.likes}
								onLike={() => articleLikes.toggleLike(article._id, state)}
							/>
						);
					})}
				</div>
				{articles?.length === 0 && <p className="pb-empty">{t('No posts yet.')}</p>}
			</section>
		</>
	);
};

export default withPbLayout(Home);
