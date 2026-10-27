import * as service from "./preceptores.service.js";

export const listar = async(req , res , next)=>{
    try{
        res.json(await service.listar());
    }catch (err){
        next(err);
    }
};

export const obtenerPorId = async (req, res, next)=>{
    try{
        const id = Number(req.params.id);
        res.json(await service.obtenerPorId(id));
    }catch(err){
        next(err);
    }
};

export const crear = async(req, res, next)=>{
    try{
        const nuevoPrece= await service.crear(req.body ?? {});
        res.status(201).json(nuevoPrece);
    }catch(err){
        next(err);
    }
};

export const actualizar = async (req, res, next)=>{
    try{
        const id = Number(req.params.id);
        res.json(await service.actualizar(id, req.body ?? {}));
    }catch(err){
        next(err);
    }
};

export const eliminar = async (req,res,next) =>{
    try{
        const id = Number(req.params.id);
        await service.eliminar(id);
        res.status(204).send();
    }catch(err){
        next(err);
    }
};

export const listarCursos = async (req,res,next) => {
    try{
        res.json(await service.listaCursos());
    }catch(err){
        next(err);
    }
};

export const asignarCursos = async (req,res,next) =>{
    try{
       const id = Number(req.params.id)
       res.json (await service.asignarCurso(id,req.body?.cursoIds));
    }catch(err){
        next(err);
    }
};
