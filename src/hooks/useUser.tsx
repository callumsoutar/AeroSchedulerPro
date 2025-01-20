"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import {
	useUser as useSupaUser,
	useSessionContext,
	User,
} from "@supabase/auth-helpers-react";
import { UserDetails } from "@/types";

type UserContextType = {
	accessToken: string | null;
	user: User | null;
	userDetails: UserDetails | null;
	isLoading: boolean;
};

export const UserContext = createContext<UserContextType | undefined>(
	undefined
);

export interface Props {
	[propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
	const {
		session,
		isLoading: isLoadingUser,
		supabaseClient: supabase,
	} = useSessionContext();
	const user = useSupaUser();
	const accessToken = session?.access_token ?? null;
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

	const getUserDetails = useCallback(async () => {
		if (!user?.id) return null;

		const { data, error } = await supabase
			.from("User")
			.select("*")
			.eq('id', user.id)
			.single();
		
		if (error) {
			console.error('Error fetching user details:', error);
			return null;
		}
		
		console.log('User details from DB:', data);
		return data;
	}, [supabase, user?.id]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoadingData(true);
				const data = await getUserDetails();
				if (data) {
					setUserDetails(data as UserDetails);
				}
			} catch (error) {
				console.error('Error in getUserDetails:', error);
			} finally {
				setIsLoadingData(false);
			}
		};

		if (user && !isLoadingData && !userDetails) {
			fetchData();
		} else if (!user && !isLoadingUser && !isLoadingData) {
			setUserDetails(null);
		}
	}, [user, isLoadingUser, getUserDetails, isLoadingData, userDetails]);

	const value = {
		accessToken,
		user,
		userDetails,
		isLoading: isLoadingUser || isLoadingData,
	};

	return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error(`useUser must be used within a MyUserContextProvider.`);
	}
	return context;
};
