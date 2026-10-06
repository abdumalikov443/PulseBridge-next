import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../libs/components/layout/PbShell';
import HomeHero from '../libs/components/homepage/HomeHero';
import DoctorCard from '../libs/components/cards/DoctorCard';
import ClinicCard from '../libs/components/cards/ClinicCard';
import PostCard from '../libs/components/cards/PostCard';
import { SkeletonCards } from '../libs/components/ui/Loaders';
import Icon from '../libs/components/ui/Icon';
import { GET_ARTICLES, GET_CLINICS, GET_DOCTORS } from '../apollo/user/query';
import { LIKE_TARGET_ARTICLE, LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../libs/hooks/useEngagement';
import { DoctorSpecialty } from '../libs/enums/doctor.enum';
import { Doctor } from '../libs/types/doctor/doctor';
import { Clinic } from '../libs/types/clinic/clinic';
import { Article } from '../libs/types/article/article';
import { T } from '../libs/types/common';
import { formatEnum } from '../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const isLiked = (item: { meLiked?: { myFavorite: boolean }[] }) => !!item.meLiked?.[0]?.myFavorite;
const specialtyHref = (specialty: DoctorSpecialty) =>
	`/doctor?input=${JSON.stringify({ page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { specialtyList: [specialty] } })}`;

const Home: NextPage = () => {
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [clinics, setClinics] = useState<Clinic[] | null>(null);
	const [articles, setArticles] = useState<Article[] | null>(null);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const doctorLikes = useLikeToggle(LIKE_TARGET_DOCTOR);
	const clinicLikes = useLikeToggle(LIKE_TARGET_CLINIC);
	const articleLikes = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** APOLLO REQUESTS **/
	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'doctorRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setDoctors(data?.getDoctors?.list ?? []),
	});
	useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 3, sort: 'clinicRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setClinics(data?.getClinics?.list ?? []),
	});
	useQuery(GET_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 2, sort: 'articleViews', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setArticles(data?.getArticles?.list ?? []),
	});

	const specialties = Object.values(DoctorSpecialty);

	return (
		<>
			<HomeHero />

			<section aria-label="Specialties" className="pb-marquee">
				<div className="pb-marquee__track">
					{specialties.concat(specialties).map((specialty, i) => (
						<Link key={`${specialty}-${i}`} href={specialtyHref(specialty)} tabIndex={i >= specialties.length ? -1 : 0}>
							{formatEnum(specialty)}
						</Link>
					))}
				</div>
			</section>

			<section className="pb-container pb-section" style={{ paddingTop: 24 }}>
				<div className="pb-section-head">
					<h2 className="pb-title">Top doctors</h2>
					<Link href="/doctor" className="pb-btn pb-btn--light pb-btn--sm">
						All doctors <Icon name="arrow" size={16} className="pb-arrow" />
					</Link>
				</div>
				<div className="pb-grid">
					{doctors === null && <SkeletonCards count={4} />}
					{doctors?.map((doctor) => {
						const state = doctorLikes.likeState(doctor._id, isLiked(doctor), doctor.doctorLikes);
						return (
							<DoctorCard
								key={doctor._id}
								doctor={doctor}
								liked={state.liked}
								likes={state.likes}
								onLike={() => doctorLikes.toggleLike(doctor._id, state)}
								following={isFollowing(doctor.memberId)}
								onFollow={canFollow(doctor.memberId) ? () => toggleFollow(doctor.memberId) : undefined}
							/>
						);
					})}
				</div>
				{doctors?.length === 0 && <p className="pb-empty">No doctors yet.</p>}
			</section>

			<section className="pb-container pb-section">
				<div className="pb-section-head">
					<h2 className="pb-title">Clinics people love</h2>
					<Link href="/clinic" className="pb-btn pb-btn--light pb-btn--sm">
						All clinics <Icon name="arrow" size={16} className="pb-arrow" />
					</Link>
				</div>
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
								following={isFollowing(clinic.memberId)}
								onFollow={canFollow(clinic.memberId) ? () => toggleFollow(clinic.memberId) : undefined}
							/>
						);
					})}
				</div>
				{clinics?.length === 0 && <p className="pb-empty">No clinics yet.</p>}
			</section>

			<section className="pb-container pb-section">
				<div className="pb-section-head">
					<h2 className="pb-title">From the community</h2>
					<Link href="/community" className="pb-btn pb-btn--light pb-btn--sm">
						Open community <Icon name="arrow" size={16} className="pb-arrow" />
					</Link>
				</div>
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
								following={isFollowing(article.memberId)}
								onFollow={canFollow(article.memberId) ? () => toggleFollow(article.memberId) : undefined}
							/>
						);
					})}
				</div>
				{articles?.length === 0 && <p className="pb-empty">No posts yet.</p>}
			</section>
		</>
	);
};

export default withPbLayout(Home);
