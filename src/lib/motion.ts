/** Curvas e molas compartilhadas: o app inteiro se move com a mesma "personalidade". */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;
export const softSpring = { type: "spring", stiffness: 260, damping: 30 } as const;
