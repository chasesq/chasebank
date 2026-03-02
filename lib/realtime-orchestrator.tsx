'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
	useRef,
} from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

/**
 * Local helper to check if Supabase is properly configured
 * This is defined locally to avoid circular imports and to work in the browser context
 */
function isSupabaseConfigured(): boolean {
	if (typeof window === 'undefined') return false;
	return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

interface RealtimeSubscription {
	schema: string;
	table: string;
	event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

interface RealtimeContextType {
	isConnected: boolean;
	subscribe: (subscription: RealtimeSubscription, callback: (payload: any) => void) => string;
	unsubscribe: (subscriptionId: string) => void;
	lastEvent: any | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
	children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
	const [isConnected, setIsConnected] = useState(false);
	const subscriptionsRef = useRef<Map<string, any>>(new Map());
	const [lastEvent, setLastEvent] = useState<any | null>(null);
	const supabaseRef = useRef<any | null>(null);

	// Initialize Supabase client
	useEffect(() => {
		if (!isSupabaseConfigured()) {
			console.warn('[v0] Supabase not configured, real-time features disabled');
			return;
		}

		try {
			supabaseRef.current = createSupabaseClient();
			setIsConnected(true);
		} catch (error) {
			console.error('[v0] Failed to initialize Supabase client:', error);
		}
	}, []);

	// Subscribe to real-time changes
	const subscribe = useCallback(
		(subscription: RealtimeSubscription, callback: (payload: any) => void) => {
			if (!supabaseRef.current) {
				console.warn('[v0] Supabase client not initialized');
				return '';
			}

			const subscriptionId = `${subscription.schema}_${subscription.table}_${Date.now()}`;

			try {
				const channel = supabaseRef.current
					.channel(`${subscription.schema}:${subscription.table}`)
					.on(
						'postgres_changes',
						{
							event: subscription.event,
							schema: subscription.schema,
							table: subscription.table,
						},
						(payload: any) => {
							setLastEvent(payload);
							callback(payload);
						}
					)
					.subscribe();

				subscriptionsRef.current.set(subscriptionId, channel);
				return subscriptionId;
			} catch (error) {
				console.error('[v0] Real-time subscription error:', error);
				return '';
			}
		},
		[]
	);

	// Unsubscribe from real-time changes
	const unsubscribe = useCallback((subscriptionId: string) => {
		const channel = subscriptionsRef.current.get(subscriptionId);
		if (channel) {
			channel.unsubscribe();
			subscriptionsRef.current.delete(subscriptionId);
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			subscriptionsRef.current.forEach((channel) => {
				channel.unsubscribe();
			});
			subscriptionsRef.current.clear();
		};
	}, []);

	const value: RealtimeContextType = {
		isConnected,
		subscribe,
		unsubscribe,
		lastEvent,
	};

	return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextType {
	const context = useContext(RealtimeContext);
	if (!context) {
		throw new Error('useRealtime must be used within RealtimeProvider');
	}
	return context;
}
