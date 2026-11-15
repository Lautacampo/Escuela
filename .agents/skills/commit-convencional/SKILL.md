---
name: commit-convencional
description: Redacta mensajes de commit con el formato del equipo. Usala cada vez que haya que proponer un commit.
---
## Pasos
1. Ejecutá git diff -cached. Si no hay nada, avisá.
2. Leé references/tipos.md para elegir el tipo.
3. Escribí «tipo: descripción», en español e imperativo.
4. Si mezcla temas, proponé dividirlo en varios commits.
5. Mostrá el mensaje y ejecutá git commit -m.
## Ejemplos
feat: agrega validación de email en el registro
fix: corrige el cálculo de impuestos del carrito