import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, split, from, NormalizedCacheObject, Observable } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { chatMessagesVar, chatNewVar, chatOnlineVar, pendingRequestsVar, serverReadyVar, socketVar } from './store';

// messages kept in the open chat during a visit
const CHAT_HISTORY = 50;
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		// execute refresh token
		return null;
	},
});

// reactive vars re-render their components (server loader, chat); queries and the socket can
// start while a page is rendering, so the vars change after that render instead of inside it
const afterRender = (fn: () => void) => Promise.resolve().then(fn);

// Custom WebSocket Client
class LoggingWebSocket {
	private socket: WebSocket;

	constructor(url: string) {
		this.socket = new WebSocket(`${url}?token=${getJwtToken()}`);
		afterRender(() => socketVar(this.socket));

		this.socket.onopen = () => {
			console.log("WebSocket Connection!");
		};

		// "info" and "getMessages" arrive right after connecting, before the chat is mounted
		this.socket.onmessage = (msg) => {
			try {
				const data = JSON.parse(msg.data);
				switch (data.event) {
					case 'info':
						chatOnlineVar(data.totalClients ?? 0);
						break;
					case 'getMessages':
						// the server keeps the last 5 messages and sends them to every new connection
						chatMessagesVar(data.list ?? []);
						break;
					case 'message':
						chatMessagesVar([...chatMessagesVar(), data].slice(-CHAT_HISTORY));
						chatNewVar(chatNewVar() + 1);
						break;
				}
			} catch (err) {
				console.log('WebSocket message parse error:', err);
			}
		};

		this.socket.onerror = (err) => {
			console.log("WebSocket Error: ", err);
		};
	}

	send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) { //@ts-ignore
		this.socket.send(data);
	}

	close() {
		this.socket.close();
	}

}

// counts running http requests and marks the server ready on the first answer (server loader)
const trackingLink = new ApolloLink(
	(operation, forward) =>
		new Observable((observer) => {
			let finished = false;
			const finish = () => {
				if (finished) return;
				finished = true;
				afterRender(() => pendingRequestsVar(Math.max(0, pendingRequestsVar() - 1)));
			};
			afterRender(() => pendingRequestsVar(pendingRequestsVar() + 1));
			const subscription = forward(operation).subscribe({
				next: (result) => {
					if (!serverReadyVar()) afterRender(() => serverReadyVar(true));
					observer.next(result);
				},
				error: (err) => {
					finish();
					observer.error(err);
				},
				complete: () => {
					finish();
					observer.complete();
				},
			});
			return () => {
				finish();
				subscription.unsubscribe();
			};
		}),
);

// a readable message from a string, a list of strings or any other value
const errorText = (value: unknown): string => {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return value.map(errorText).join(', ');
	try {
		return JSON.stringify(value) ?? 'Something went wrong';
	} catch {
		return 'Something went wrong';
	}
};

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			console.warn('requesting.. ', operation);
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
		});

		/* WEBSOCKET SUBSCRIPTION LINK */
		const wsLink = new WebSocketLink({
			uri: process.env.REACT_APP_API_WS ?? 'ws://127.0.0.1:3007',
			options: {
				reconnect: false,
				timeout: 30000,
				connectionParams: () => {
					return { headers: getHeaders() };
				},
			},
			webSocketImpl: LoggingWebSocket,
		});

		// runs inside the response stream: it must never throw, whatever shape the error has
		const errorLink = onError(({ graphQLErrors, networkError, response }) => {
			if (graphQLErrors) {
				graphQLErrors.forEach(({ message, locations, path }) => {
					// the API sends validation errors as a list of messages
					const text = errorText(message);
					console.log('[GraphQL error]:', text, locations ?? '', path ?? '');
					if (!text.includes('input')) sweetErrorAlert(text);
				});
			}
			if (networkError) console.log('[Network error]:', networkError);
			// @ts-ignore
			if (networkError?.statusCode === 401) {
			}
		});

		const splitLink = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
			},
			wsLink,
			from([trackingLink, authLink, link]),
		);

		return from([errorLink, tokenRefreshLink, splitLink]);
	}
}

// values without an _id cannot be normalized: the newest server answer replaces the cached one
// (e.g. meLiked turns from [{...}] into [] after an unlike) instead of Apollo warning about data loss
const replace = { merge: false };
const byViewer = { fields: { meLiked: replace, meFollowed: replace } };
const typePolicies = {
	Doctor: { fields: { ...byViewer.fields, nextAvailable: replace } },
	Clinic: byViewer,
	Article: { fields: { meLiked: replace } },
	Follow: { fields: { meFollowed: replace } },
	IntakeSession: { fields: { messages: replace } },
	Query: { fields: { getDoctorAvailability: replace } },
	// paginated lists ({ list, metaCounter }) and other id-less results
	...Object.fromEntries(
		['Members', 'Doctors', 'Clinics', 'Appointments', 'Articles', 'Comments', 'ClinicJoinRequests', 'Follows', 'Notifications', 'IntakeChatResult'].map(
			(type) => [type, replace],
		),
	),
};

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache({ typePolicies }),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}

/**
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// No Subscription required for develop process

const httpLink = createHttpLink({
  uri: "http://localhost:3007/graphql",
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
*/
