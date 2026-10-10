"use client";

import { createContext, useContext } from "react";

export interface SignOutTransition {
  startSignOut: () => void;
  cancelSignOut: () => void;
}

export const SignOutTransitionContext = createContext<SignOutTransition>({
  startSignOut: () => {},
  cancelSignOut: () => {},
});

export const useSignOutTransition = () => useContext(SignOutTransitionContext);
