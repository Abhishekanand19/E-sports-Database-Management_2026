'use client';
import { createContext,useContext,type ReactNode } from 'react';
import type { User } from '@/lib/auth';
const Session=createContext<User|null>(null);
export function SessionProvider({user,children}:{user:User|null;children:ReactNode}) {return <Session.Provider value={user}>{children}</Session.Provider>;}
export function useUser(){return useContext(Session);}
