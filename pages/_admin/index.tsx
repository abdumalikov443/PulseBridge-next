import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import {
	GET_ALL_APPOINTMENTS_BY_ADMIN,
	GET_ALL_ARTICLES_BY_ADMIN,
	GET_ALL_CLINICS_BY_ADMIN,
	GET_ALL_MEMBERS_BY_ADMIN,
} from '../../apollo/admin/query';
import { GET_DOCTORS } from '../../apollo/user/query';
import { AppointmentStatus } from '../../libs/enums/appointment.enum';
import { Appointment } from '../../libs/types/appointment/appointment';
import { Member } from '../../libs/types/member/member';
import { getMemberName } from '../../libs/config';
import { formatEnum } from '../../libs/utils';
import { formatCount } from '../../libs/components/ui/ActionChips';
import Avatar from '../../libs/components/ui/Avatar';
import Icon, { IconName } from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// totals come from the list queries (metaCounter of a one-item page)
const one = { page: 1, limit: 1, search: {} };
const total = (data: any, key: string): number | null => (data ? data[key]?.metaCounter?.[0]?.total ?? 0 : null);

// admin home: platform totals, the newest members and the confirmed visits, earliest first (overdue ones included)
const AdminOverview: NextPage = () => {
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	const options = { fetchPolicy: 'network-only' as const };
	const { data: members } = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		...options,
		variables: { input: { page: 1, limit: 5, sort: 'createdAt', direction: 'DESC', search: {} } },
	});
	const { data: clinics } = useQuery(GET_ALL_CLINICS_BY_ADMIN, { ...options, variables: { input: one } });
	const { data: doctors } = useQuery(GET_DOCTORS, { ...options, variables: { input: one } });
	const { data: articles } = useQuery(GET_ALL_ARTICLES_BY_ADMIN, { ...options, variables: { input: one } });
	const { data: upcoming } = useQuery(GET_ALL_APPOINTMENTS_BY_ADMIN, {
		...options,
		variables: {
			input: {
				page: 1,
				limit: 5,
				sort: 'appointmentDate',
				direction: 'ASC',
				search: { appointmentStatus: AppointmentStatus.CONFIRMED },
			},
		},
	});

	const stats: { label: string; value: number | null; icon: IconName; href: string; tone: string }[] = [
		{
			label: 'Members',
			value: total(members, 'getAllMembersByAdmin'),
			icon: 'users',
			href: '/_admin/users',
			tone: 'blue',
		},
		{
			label: 'Clinics',
			value: total(clinics, 'getAllClinicsByAdmin'),
			icon: 'clinic',
			href: '/_admin/clinics',
			tone: 'green',
		},
		{
			label: 'Doctors',
			value: total(doctors, 'getDoctors'),
			icon: 'stethoscope',
			href: '/_admin/doctors',
			tone: 'violet',
		},
		{
			label: 'Confirmed visits',
			value: total(upcoming, 'getAllAppointmentsByAdmin'),
			icon: 'calendar',
			href: '/_admin/appointments',
			tone: 'orange',
		},
		{
			label: 'Articles',
			value: total(articles, 'getAllArticlesByAdmin'),
			icon: 'book',
			href: '/_admin/community',
			tone: 'pink',
		},
	];
	const newest: Member[] | null = members ? members.getAllMembersByAdmin?.list ?? [] : null;
	const visits: Appointment[] | null = upcoming ? upcoming.getAllAppointmentsByAdmin?.list ?? [] : null;

	return (
		<div className="content pb-admin-home">
			<div>
				<h1 className="tit">{t('Overview')}</h1>
				<p className="pb-admin-home__date">{moment().format('dddd, MMMM D')}</p>
			</div>

			<div className="pb-admin-stats">
				{stats.map((stat) => (
					<Link key={stat.label} href={stat.href} className="pb-admin-stat">
						<span className={`pb-admin-stat__icon pb-tone--${stat.tone}`}>
							<Icon name={stat.icon} size={20} />
						</span>
						<span>
							<strong>{stat.value === null ? '–' : formatCount(stat.value)}</strong>
							<small>{t(stat.label)}</small>
						</span>
						<Icon name="arrow" size={16} className="pb-admin-stat__go" />
					</Link>
				))}
			</div>

			<div className="pb-admin-panels">
				<section className="pb-admin-panel">
					<header>
						<h2>{t('Newest members')}</h2>
						<Link href="/_admin/users" className="pb-more">
							{t('All members')} <Icon name="arrow" size={14} className="pb-arrow" />
						</Link>
					</header>
					{newest === null && <EcgLine small width={60} />}
					{newest?.length === 0 && <p className="pb-admin-panel__empty">{t('No members yet.')}</p>}
					{newest?.map((member) => (
						<div key={member._id} className="pb-admin-panel__row">
							<Avatar name={getMemberName(member)} image={member.memberImage} size={38} />
							<span className="pb-admin-panel__main">
								<strong>{getMemberName(member)}</strong>
								<small>
									@{member.memberNick} · {moment(member.createdAt).fromNow()}
								</small>
							</span>
							<span className={`pb-admin-tag pb-admin-tag--${member.memberType.toLowerCase()}`}>
								{formatEnum(member.memberType)}
							</span>
						</div>
					))}
				</section>

				<section className="pb-admin-panel">
					<header>
						<h2>{t('Confirmed visits')}</h2>
						<Link href="/_admin/appointments" className="pb-more">
							{t('All appointments')} <Icon name="arrow" size={14} className="pb-arrow" />
						</Link>
					</header>
					{visits === null && <EcgLine small width={60} />}
					{visits?.length === 0 && <p className="pb-admin-panel__empty">{t('No confirmed visits.')}</p>}
					{visits?.map((visit) => {
						const day = moment.utc(visit.appointmentDate);
						return (
							<div key={visit._id} className="pb-admin-panel__row">
								<span className="pb-admin-panel__date">
									<strong>{day.format('D')}</strong>
									<small>{day.format('MMM')}</small>
								</span>
								<span className="pb-admin-panel__main">
									<strong>
										{getMemberName(visit.memberData)} → {t('Dr.')} {getMemberName(visit.doctorData?.memberData)}
									</strong>
									<small>{visit.clinicData?.clinicName}</small>
								</span>
								<span className="pb-admin-panel__time">{visit.appointmentTime}</span>
							</div>
						);
					})}
				</section>
			</div>
		</div>
	);
};

export default withAdminLayout(AdminOverview);
