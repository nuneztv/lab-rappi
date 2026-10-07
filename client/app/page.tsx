"use client";
import {useAuth} from "../context/AuthContext";import {useEffect} from "react";import {useRouter} from "next/navigation";
export default function Home(){const {user}=useAuth();const router=useRouter();useEffect(()=>{router.replace(user?(user.role==="consumer"?"/client":user.role==="store"?"/store-admin":"/delivery"):"/login")},[user,router]);return <main className="center"><div className="card"><h1>Rappi Local</h1><p>Cargando...</p></div></main>}
