import { Achievement } from "./entities/achievement.entity";

const DEFAULT_ACHIEVEMENTS: Partial<Achievement>[] = [
  {
    name: 'Porteria a cero',
    description: 'Has ganado manteniendo tu porteria a cero',
    image: 'zero-goalkeeper',
  },
  {
    name: 'Racha de dos',
    description: 'Has ganado dos partidas de forma consecutiva',
    image: 'two-in-a-row',
  },
  {
    name: 'Racha de cinco',
    description: 'Has ganado cinco partidas de forma consecutiva',
    image: 'five-in-a-row',
  },
  {
    name: 'Racha de diez',
    description: 'Has ganado cinco partidas de forma consecutiva',
    image: 'ten-in-a-row',
  },
  {
    name: 'Conquista del pueblo',
    description: 'Has ganado contra un oponente más fuerte',
    image: 'people-victory',
  },
  {
    name: 'Derrota de la elite',
    description: 'Has perdido contra un oponente más débil',
    image: 'power-defeat',
  },
  {
    name: 'Por los pelos',
    description: 'Has ganado por un punto de ventaja',
    image: 'narrow-victory',
  },
  {
    name: 'Victoria inesperada',
    description: 'Has remontado una partida en la que ibas perdiendo',
    image: 'comeback-victory',
  },
  {
    name: 'Racha ganadora',
    description: 'Has conseguido 5 puntos seguidos en una partida',
    image: 'winning-streak',
  },
  {
    name: 'Puntuación relámpago',
    description: 'Has conseguido 2 puntos consecutivos en menos de 10 segundos',
    image: 'double-tap',
  },
  {
    name: 'Muro impenetrable',
    description: 'Has bloqueado 10 disparos consecutivos al oponente',
    image: 'blocker',
  },
  {
    name: 'Primer golpe',
    description: 'Has conseguido el primer punto en una partida',
    image: 'first-point',
  },
  {
    name: 'Por la escuadra',
    description: 'Has conseguido un punto colocando la pelota rozando la esquina del campo',
    image: 'precision',
  },
]

export { DEFAULT_ACHIEVEMENTS };
