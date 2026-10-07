import { Router } from "express";
import { login, register } from "../services/auth.service";
const router = Router();
router.post("/register", async (req,res)=>{ try{res.status(201).json(await register(req.body));}catch(e:any){console.error("[register]",e);res.status(400).json({message:e.message||e.errors?.[0]?.message||e.code||"Error al registrarse"});} });
router.post("/login", async (req,res)=>{ try{res.json(await login(req.body.email,req.body.password));}catch(e:any){console.error("[login]",e);res.status(401).json({message:e.message||e.errors?.[0]?.message||e.code||"Error al iniciar sesion"});} });
export default router;
