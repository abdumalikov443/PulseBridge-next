import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, split, from, NormalizedCacheObject, Observable } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { pendingRequestsVar, serverReadyVar, socketVar } from './store';
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

// Custom WebSocket Client
class LoggingWebSocket {
	private socket: WebSocket;

	constructor(url: string) {
		this.socket = new WebSocket(`${url}?token=${getJwtToken()}`);
		socketVar(this.socket);

		this.socket.onopen = () => {
			console.log("WebSocket Connection!");
		};

		this.socket.onmessage = (msg) => {
			console.log("WebSocket Message: ", msg.data);
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
				pendingRequestsVar(Math.max(0, pendingRequestsVar() - 1));
			};
			pendingRequestsVar(pendingRequestsVar() + 1);
			const subscription = forward(operation).subscribe({
				next: (result) => {
					serverReadyVar(true);
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

		const errorLink = onError(({ graphQLErrors, networkError, response }) => {
			if (graphQLErrors) {
				graphQLErrors.map(({ message, locations, path, extensions }) =>{
					console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
					if (!message.includes("input")) sweetErrorAlert(message);
				});
			}
			if (networkError) console.log(`[Network error]: ${networkError}`);
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

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
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
