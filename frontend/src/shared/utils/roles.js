export const ROLES={
    DIRECTIVO: 'directivo',
    DOCENTE: 'docente',
    PRECEPTOR: 'preceptor',

};

export const ITEMSGESTION = [
    {
        id:'asistencias',
        label:'Asistencias',
        path: '/gestion/asistencias',
        roles:[ROLES.DIRECTIVO, ROLES.PRECEPTOR]
    },

    {
        id: 'notas',
        label: 'Notas',
        path: 'gestion/notas',
        roles:[ROLES.DIRECTIVO,ROLES.DOCENTE]
    }


];

