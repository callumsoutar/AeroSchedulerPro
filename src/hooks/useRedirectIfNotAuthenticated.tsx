"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Custom hook to handle redirection for unauthenticated or unauthorized users.
 * @param {string[]} allowedRoles - Array of roles allowed to access the page.
 * @param {string} redirectPath - Path to redirect unauthorized users (default: "/sign-in").
 * @returns {object} - The `user` object and `isLoading` state.
 */
export function useRedirectIfNotAuthenticated(
  allowedRoles: string[] = [],
  redirectPath = "/sign-in"
) {
  const { user, isLoading, userDetails } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Debug logging
    console.log('Redirect Hook State:', {
      isLoading,
      user,
      userDetails,
      allowedRoles,
      currentRole: userDetails?.role
    });

    // Redirect if not authenticated
    if (!isLoading && !user) {
      console.log("No authenticated user, redirecting to login");
      router.push(redirectPath);
      return;
    }

    // Redirect if user doesn't have a required role
    if (!isLoading && userDetails && allowedRoles.length > 0) {
      const userRole = userDetails.role; // Change to use userDetails instead of user
      console.log(`Checking role authorization: ${userRole} against allowed roles:`, allowedRoles);
      
      if (userRole && !allowedRoles.includes(userRole)) {
        console.log(`Unauthorized role (${userRole}), redirecting`);
        router.push(redirectPath);
      }
    }
  }, [user, userDetails, isLoading, router, redirectPath, allowedRoles]);

  return { user: userDetails, isLoading }; // Return userDetails instead of user
}
